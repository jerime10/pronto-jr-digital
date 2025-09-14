import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useAIProcessing = () => {
  const [isProcessingAI, setIsProcessingAI] = useState<{
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  }>({
    mainComplaint: false,
    evolution: false,
    examResults: false
  });
  
  const processAIContent = async (
    content: string, 
    type: 'main_complaint' | 'evolution' | 'exam_result',
    onSuccess: (processedContent: string) => void
  ) => {
    // Early validation
    if (!content || content.trim() === '') {
      toast.error('Por favor, forneça algum conteúdo para processar com IA.');
      return;
    }
    
    try {
      // Set the processing state for this specific field
      const fieldKey = type === 'main_complaint' ? 'mainComplaint' : type === 'evolution' ? 'evolution' : 'examResults';
      setIsProcessingAI(prev => ({ ...prev, [fieldKey]: true }));
      
      // For pharmacy system, we'll skip AI processing for now
      toast.error('Processamento com IA não disponível no sistema de farmácia');
      
    } catch (error) {
      console.error(`Erro ao processar ${type}:`, error);
      toast.error(`Erro ao processar o conteúdo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      // Clear the processing state
      const fieldKey = type === 'main_complaint' ? 'mainComplaint' : type === 'evolution' ? 'evolution' : 'examResults';
      setIsProcessingAI(prev => ({ ...prev, [fieldKey]: false }));
    }
  };
  
  return {
    isProcessingAI,
    processAIContent
  };
};