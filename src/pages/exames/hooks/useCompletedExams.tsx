
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Definindo interface local para os resultados de exame
interface CompletedExam {
  id: string;
  name: string;
  result_template: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useCompletedExams = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<Partial<CompletedExam>>({ id: '', name: '', result_template: '' });
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: completedExams,
    isLoading: isLoadingResults,
    error: resultError,
    refetch: refetchResults
  } = useQuery({
    queryKey: ['modelo_result_exames'],
    queryFn: async () => {
      // Acessar diretamente a tabela modelo-result-exames
      const { data, error } = await supabase
        .from('modelo-result-exames' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar modelos de resultado:', error);
        throw error;
      }
      
      return (data as unknown as CompletedExam[]) || [];
    }
  });
  
  const filteredResults = useMemo(() => {
    if (!searchQuery || !completedExams) return completedExams || [];
    return completedExams.filter((result: CompletedExam) =>
      result?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [completedExams, searchQuery]);

  const handleOpenNewResult = () => {
    setCurrentResult({ id: '', name: '', result_template: '' });
    setIsEditing(false);
    setIsResultDialogOpen(true);
  };
  
  const handleOpenEditResult = (result: CompletedExam) => {
    setCurrentResult({ ...result });
    setIsEditing(true);
    setIsResultDialogOpen(true);
  };
  
  const handleDeleteResult = async (id: string) => {
    try {
      const { error } = await supabase
        .from('modelo-result-exames' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Resultado excluído com sucesso!");
      refetchResults();
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error("Erro ao excluir resultado.");
    }
  };
  
  const handleResultChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentResult(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveResult = async () => {
    if (!currentResult.name) {
      toast.error("O nome do resultado é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('modelo-result-exames' as any)
          .update({
            name: currentResult.name!,
            result_template: currentResult.result_template || null
          })
          .eq('id', currentResult.id);
        
        if (error) throw error;
        toast.success("Resultado atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('modelo-result-exames' as any)
          .insert([{
            name: currentResult.name!,
            result_template: currentResult.result_template || null
          }]);
        
        if (error) throw error;
        toast.success("Resultado criado com sucesso!");
      }
      
      setIsResultDialogOpen(false);
      refetchResults();
    } catch (error) {
      console.error('Error saving result:', error);
      toast.error("Erro ao salvar resultado.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    currentResult,
    isResultDialogOpen,
    setIsResultDialogOpen,
    isEditing,
    isLoading,
    filteredResults,
    isLoadingResults,
    resultError,
    handleOpenNewResult,
    handleOpenEditResult,
    handleDeleteResult,
    handleResultChange,
    handleSaveResult
  };
};
