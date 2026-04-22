
import React from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSelect } from '@/components/ui/advanced-select';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SolicitacaoExamesProps {
  examRequests: string[];
  onExamRequestsChange: (exams: string[]) => void;
  availableExams: { id: string; name: string; instructions: string | null }[];
  isLoading: boolean;
}

const SolicitacaoExames: React.FC<SolicitacaoExamesProps> = ({
  examRequests,
  onExamRequestsChange,
  availableExams,
  isLoading
}) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const handleEditModel = async (option: { id?: string, label: string, value: string }, newContent: string) => {
    if (!option.id) return;
    try {
      // Procurar se newContent já existe para evitar duplicação (por name)
      const { data: existing } = await supabase
        .from('exam_models')
        .select('id')
        .eq('name', newContent.trim())
        .neq('id', option.id)
        .maybeSingle();

      if (existing) {
        toast({ title: '⚠️ Modelo Duplicado', description: 'Já existe um modelo de exame com este nome.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('exam_models')
        .update({ name: newContent.trim() })
        .eq('id', option.id);
        
      if (error) throw error;
      toast({ title: '✅ Atualizado', description: 'Modelo atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['exam_models'] });
    } catch (e) {
      console.error('Erro ao editar:', e);
      toast({ title: '❌ Erro', description: 'Erro ao editar modelo.', variant: 'destructive' });
    }
  };

  const handleDeleteModel = async (option: { id?: string, label: string, value: string }) => {
    if (!option.id) return;
    try {
      const { error } = await supabase
        .from('exam_models')
        .delete()
        .eq('id', option.id);
        
      if (error) throw error;
      toast({ title: '✅ Excluído', description: 'Modelo excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['exam_models'] });
    } catch (e) {
      console.error('Erro ao excluir:', e);
      toast({ title: '❌ Erro', description: 'Erro ao excluir modelo.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        isMobile ? "text-white" : "text-muted-foreground"
      )}>
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        <span>Carregando exames disponíveis...</span>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Busca Inteligente de Exames
        </p>
        <AdvancedSelect
          options={availableExams.map(e => ({ id: e.id, label: e.name, value: e.name }))}
          value={examRequests}
          onChange={(values) => onExamRequestsChange(values as string[])}
          onEdit={handleEditModel}
          onDelete={handleDeleteModel}
          placeholder="Buscar exames..."
          searchPlaceholder="Digite o nome do exame..."
          title="Solicitar Exames"
          multiple
          disabled={isLoading}
          className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
        />
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          💡 Clique no <strong className="text-slate-300">X</strong> para remover, no <strong className="text-slate-300">🗑️ lixeira</strong> para excluir permanentemente.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Solicitar Exames</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use a busca inteligente para encontrar e selecionar múltiplos exames.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          💡 Clique no <strong>X</strong> para remover da seleção, no <strong>🗑️ lixeira</strong> para excluir permanentemente do banco de dados
        </p>
      </CardHeader>
      <CardContent>
        <AdvancedSelect
          options={availableExams.map(e => ({ id: e.id, label: e.name, value: e.name }))}
          value={examRequests}
          onChange={(values) => onExamRequestsChange(values as string[])}
          onEdit={handleEditModel}
          onDelete={handleDeleteModel}
          placeholder="Buscar exames por nome ou instruções..."
          searchPlaceholder="Digite o nome do exame..."
          title="Solicitar Exames"
          multiple
          disabled={isLoading}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};

export default SolicitacaoExames;
