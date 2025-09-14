
import { FormState } from './useFormData';

interface AtendimentoHelpersProps {
  processAI: (content: string, type: 'main_complaint' | 'evolution' | 'exam_result', onSuccess: (processedContent: string) => void) => void;
  updateFormField: (field: keyof FormState, value: string | string[]) => void;
}

export const useAtendimentoHelpers = ({
  processAI,
  updateFormField
}: AtendimentoHelpersProps) => {
  
  // Helper to avoid creating new callbacks in render - retorna Promise para compatibilidade
  const processAIContent = async (field: string, content: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const fieldMap = {
        'queixaPrincipal': 'main_complaint',
        'evolucao': 'evolution',
        'resultadoExames': 'exam_result'
      } as const;
      
      const formFieldMap = {
        'queixaPrincipal': 'queixaPrincipal',
        'evolucao': 'evolucao',
        'resultadoExames': 'resultadoExames'
      } as const;
      
      const aiType = fieldMap[field as keyof typeof fieldMap] || 'main_complaint';
      const formField = formFieldMap[field as keyof typeof formFieldMap] || 'queixaPrincipal';
      
      processAI(content, aiType, (processedContent) => {
        updateFormField(formField, processedContent);
        resolve();
      });
    });
  };

  return {
    processAIContent
  };
};
