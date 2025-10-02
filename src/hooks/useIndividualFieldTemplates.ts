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
    if (!searchTerm || searchTerm.length < 2) return [];

    const { data, error } = await supabase
      .from('individual_field_templates')
      .select('*')
      .eq('field_key', fieldKey)
      .ilike('field_content', `%${searchTerm}%`)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }

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

  // Salvar novo template
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
      // Verificar se já existe
      const existing = await getFieldTemplateByKey(fieldKey, modelName);

      if (existing) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('individual_field_templates')
          .update({ field_content: fieldContent, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('individual_field_templates')
          .insert({
            field_key: fieldKey,
            field_label: fieldLabel,
            field_content: fieldContent,
            model_name: modelName,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individual_field_templates'] });
      toast({
        title: '✅ Campo salvo',
        description: 'Template salvo com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar template:', error);
      toast({
        title: '❌ Erro ao salvar',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar template
  const updateFieldTemplate = useMutation({
    mutationFn: async ({ id, fieldContent }: { id: string; fieldContent: string }) => {
      const { data, error } = await supabase
        .from('individual_field_templates')
        .update({ field_content: fieldContent, updated_at: new Date().toISOString() })
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
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: '❌ Erro ao atualizar',
        description: 'Não foi possível atualizar o template.',
        variant: 'destructive',
      });
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
    saveFieldTemplate: saveFieldTemplate.mutate,
    updateFieldTemplate: updateFieldTemplate.mutate,
    deleteFieldTemplate: deleteFieldTemplate.mutate,
    isSaving: saveFieldTemplate.isPending,
    isUpdating: updateFieldTemplate.isPending,
    isDeleting: deleteFieldTemplate.isPending,
  };
};
