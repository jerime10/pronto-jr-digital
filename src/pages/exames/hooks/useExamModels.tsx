
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExamModel } from '@/types/database';

export const useExamModels = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentExam, setCurrentExam] = useState<Partial<ExamModel>>({ id: '', name: '', instructions: '' });
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: examModels,
    isLoading: isLoadingExams,
    error: examError,
    refetch: refetchExams
  } = useQuery({
    queryKey: ['exam_models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ExamModel[];
    }
  });
  
  const filteredExams = examModels?.filter(
    exam => exam.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleOpenNewExam = () => {
    setCurrentExam({ id: '', name: '', instructions: '' });
    setIsEditing(false);
    setIsExamDialogOpen(true);
  };
  
  const handleOpenEditExam = (exam: ExamModel) => {
    setCurrentExam({ ...exam });
    setIsEditing(true);
    setIsExamDialogOpen(true);
  };
  
  const handleDeleteExam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exam_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Exame excluído com sucesso!");
      refetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error("Erro ao excluir exame.");
    }
  };
  
  const handleExamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExam(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveExam = async () => {
    if (!currentExam.name) {
      toast.error("O nome do exame é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('exam_models')
          .update({
            name: currentExam.name!,
            instructions: currentExam.instructions || null
          })
          .eq('id', currentExam.id);
        
        if (error) throw error;
        toast.success("Exame atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('exam_models')
          .insert([{
            name: currentExam.name!,
            instructions: currentExam.instructions || null
          }]);
        
        if (error) throw error;
        toast.success("Exame criado com sucesso!");
      }
      
      setIsExamDialogOpen(false);
      refetchExams();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error("Erro ao salvar exame.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    currentExam,
    isExamDialogOpen,
    setIsExamDialogOpen,
    isEditing,
    isLoading,
    filteredExams,
    isLoadingExams,
    examError,
    handleOpenNewExam,
    handleOpenEditExam,
    handleDeleteExam,
    handleExamChange,
    handleSaveExam
  };
};
