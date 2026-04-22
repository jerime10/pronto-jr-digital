import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface IndividualFieldTemplate {
  id: string;
  field_key: string;
  field_label: string;
  field_content: string;
  model_name: string;
  created_at: string;
  updated_at: string;
}

export const useIndividualFieldTemplates = () => {
  const queryClient = useQueryClient();

  // Buscar todos os templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['individual_field_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_field_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IndividualFieldTemplate[];
    },
  });

  // Buscar templates por campo específico e modelo
  const searchFieldTemplates = async (fieldKey: string, searchTerm: string, modelName: string) => {
    console.log('🔍 [HOOK-SEARCH] ===== INÍCIO searchFieldTemplates =====');
    console.log('🔍 [HOOK-SEARCH] Parâmetros recebidos:', {
      fieldKey,
      searchTerm,
      searchTermLength: searchTerm?.length || 0,
      modelName,
      modelNameLength: modelName?.length || 0
    });
    
    // Sempre retornar dados mesmo com termo vazio (para que o dropdown funcione)
    let query = supabase
      .from('individual_field_templates')
      .select('*')
      .eq('field_key', fieldKey)
      .eq('model_name', modelName)
      .order('updated_at', { ascending: false })
      .limit(10);

    // Se houver termo de busca, filtrar por ele
    if (searchTerm && searchTerm.trim()) {
      console.log('🔍 [HOOK-SEARCH] Executando busca filtrada com termo:', searchTerm);
      query = query.ilike('field_content', `%${searchTerm}%`);
    } else {
      console.log('🔍 [HOOK-SEARCH] Termo vazio — buscar os 10 mais recentes sem filtro de texto');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [HOOK-SEARCH] Erro ao buscar templates:', error);
      return [];
    }

    console.log('✅ [HOOK-SEARCH] Templates encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('✅ [HOOK-SEARCH] Dados encontrados:', data.map(d => ({
        id: d.id,
        field_key: d.field_key,
        field_label: d.field_label,
        model_name: d.model_name,
        content_preview: d.field_content?.substring(0, 50) + '...'
      })));
    } else {
      console.log('⚠️ [HOOK-SEARCH] Nenhum resultado encontrado. Possíveis causas:');
      console.log('   - model_name não corresponde (esperado:', modelName, ')');
      console.log('   - field_key não corresponde (esperado:', fieldKey, ')');
      if (searchTerm && searchTerm.trim()) {
        console.log('   - field_content não contém o termo de busca:', searchTerm);
      }
    }
    console.log('🔍 [HOOK-SEARCH] ===== FIM searchFieldTemplates =====');
    
    return data as IndividualFieldTemplate[];
  };

  // Verificar se existe template para um campo específico
  const getFieldTemplateByKey = async (fieldKey: string, modelName: string) => {
    const { data, error } = await supabase
      .from('individual_field_templates')
      .select('*')
      .eq('field_key', fieldKey)
      .eq('model_name', modelName)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar template:', error);
      return null;
    }

    return data as IndividualFieldTemplate | null;
  };

  // Salvar novo template (sempre cria um novo registro)
  const saveFieldTemplate = useMutation({
    mutationFn: async ({
      fieldKey,
      fieldLabel,
      fieldContent,
      modelName,
    }: {
      fieldKey: string;
      fieldLabel: string;
      fieldContent: string;
      modelName: string;
    }) => {
      console.log('💾 [HOOK] Criando novo template:', { fieldKey, fieldLabel, modelName });
      
      // Verificar duplicidade
      const { data: existing, error: searchError } = await supabase
        .from('individual_field_templates')
        .select('id')
        .eq('field_key', fieldKey)
        .eq('model_name', modelName)
        .eq('field_content', fieldContent.trim())
        .maybeSingle();

      if (searchError) {
        console.error('❌ [HOOK] Erro ao verificar duplicidade:', searchError);
        throw searchError;
      }

      if (existing) {
        throw new Error('DUPLICATE_TEMPLATE');
      }

      // Sempre criar novo registro
      const { data, error } = await supabase
        .from('individual_field_templates')
        .insert({
          field_key: fieldKey,
          field_label: fieldLabel,
          field_content: fieldContent.trim(),
          model_name: modelName,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [HOOK] Erro ao criar:', error);
        throw error;
      }
      console.log('✅ [HOOK] Template criado:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [HOOK] Salvamento bem-sucedido:', data);
      queryClient.invalidateQueries({ queryKey: ['individual_field_templates'] });
      toast({
        title: '✅ Campo salvo',
        description: 'Template salvo com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('❌ [HOOK] Erro ao salvar template:', error);
      if (error.message === 'DUPLICATE_TEMPLATE') {
        toast({
          title: '⚠️ Modelo Duplicado',
          description: 'Já existe um modelo com este exato conteúdo.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Erro ao salvar',
          description: 'Não foi possível salvar o template.',
          variant: 'destructive',
        });
      }
    },
  });

  // Atualizar template
  const updateFieldTemplate = useMutation({
    mutationFn: async ({ id, fieldContent }: { id: string; fieldContent: string }) => {
      
      // Buscar as infos do template atual para checar duplicidade com mesmo field_key e model_name
      const { data: current } = await supabase
        .from('individual_field_templates')
        .select('field_key, model_name')
        .eq('id', id)
        .single();
        
      if (current) {
        const { data: existing, error: searchError } = await supabase
          .from('individual_field_templates')
          .select('id')
          .eq('field_key', current.field_key)
          .eq('model_name', current.model_name)
          .eq('field_content', fieldContent.trim())
          .neq('id', id)
          .maybeSingle();

        if (existing) {
          throw new Error('DUPLICATE_TEMPLATE');
        }
      }

      const { data, error } = await supabase
        .from('individual_field_templates')
        .update({ field_content: fieldContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual_field_templates'] });
      toast({
        title: '✅ Atualizado',
        description: 'Template atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar template:', error);
      if (error.message === 'DUPLICATE_TEMPLATE') {
        toast({
          title: '⚠️ Modelo Duplicado',
          description: 'Já existe um modelo com este exato conteúdo.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Erro ao atualizar',
          description: 'Não foi possível atualizar o template.',
          variant: 'destructive',
        });
      }
    },
  });

  // Deletar template
  const deleteFieldTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('individual_field_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual_field_templates'] });
      toast({
        title: '✅ Excluído',
        description: 'Template excluído com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast({
        title: '❌ Erro ao excluir',
        description: 'Não foi possível excluir o template.',
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    searchFieldTemplates,
    getFieldTemplateByKey,
    saveFieldTemplate: saveFieldTemplate.mutateAsync,
    updateFieldTemplate: updateFieldTemplate.mutateAsync,
    deleteFieldTemplate: deleteFieldTemplate.mutateAsync,
    isSaving: saveFieldTemplate.isPending,
    isUpdating: updateFieldTemplate.isPending,
    isDeleting: deleteFieldTemplate.isPending,
  };
};
