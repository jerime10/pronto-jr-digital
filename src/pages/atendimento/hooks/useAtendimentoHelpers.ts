
import { FormState } from './useFormData';

interface AtendimentoHelpersProps {
  processAI: (content: string | null, type: 'main_complaint' | 'evolution' | 'exam_result', onSuccess: (processedContent: string, individualFields?: Record<string, string>) => void, selectedModelTitle?: string | null, dynamicFields?: Record<string, string>) => void;
  updateFormField: (field: keyof FormState, value: string | string[]) => void;
  selectedModelTitle?: string | null;
  dynamicFields?: Record<string, string>;
  onIndividualFieldsUpdate?: (fields: Record<string, string>) => void;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
}

export const useAtendimentoHelpers = ({
  processAI,
  updateFormField,
  selectedModelTitle,
  dynamicFields,
  onIndividualFieldsUpdate,
  updateDynamicFieldsFromAI
}: AtendimentoHelpersProps) => {
  
  // Helper to avoid creating new callbacks in render - retorna Promise para compatibilidade
  const processAIContent = (field: string, content: string, providedDynamicFields?: Record<string, string>): Promise<void> => {
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
      
      // Passar selectedModelTitle apenas para resultados de exames
      const modelTitle = aiType === 'exam_result' ? selectedModelTitle : null;
      
      console.log('🔍 [useAtendimentoHelpers] Debug selectedModelTitle:');
      console.log('   selectedModelTitle recebido:', selectedModelTitle);
      console.log('   aiType:', aiType);
      console.log('   modelTitle que será usado:', modelTitle);
      
      // Usar os campos dinâmicos fornecidos ou os padrão
      const fieldsToUse = providedDynamicFields || dynamicFields;
      
      processAI(content, aiType, (processedContent, individualFields) => {
        console.log('🔄 [useAtendimentoHelpers] onSuccess chamado - aiType:', aiType);
        
        // Se há campos individuais e é um resultado de exame, processar APENAS campos individuais
        if (individualFields && aiType === 'exam_result') {
          console.log('🎯 [useAtendimentoHelpers] Processando APENAS campos individuais (NÃO atualizando Resultado Final):', individualFields);
          
          // Atualizar APENAS campos individuais
          if (onIndividualFieldsUpdate) {
            console.log('🎯 [useAtendimentoHelpers] CHAMANDO onIndividualFieldsUpdate (PRIORITÁRIO)');
            onIndividualFieldsUpdate(individualFields);
          }
          
          if (updateDynamicFieldsFromAI) {
            console.log('🎯 [useAtendimentoHelpers] CHAMANDO updateDynamicFieldsFromAI (SECUNDÁRIO)');
            updateDynamicFieldsFromAI(individualFields);
          }
          
          // NÃO atualizar o Resultado Final - ele será atualizado automaticamente pelos campos individuais
          console.log('🎯 [useAtendimentoHelpers] NÃO atualizando Resultado Final - será atualizado pelos campos individuais');
        } else {
          // Apenas atualizar o campo principal quando NÃO há campos individuais
          console.log('🎯 [useAtendimentoHelpers] Atualizando campo principal (sem campos individuais)');
          updateFormField(formField, processedContent);
        }
        
        if (!individualFields || aiType !== 'exam_result') {
          console.log('⚠️ [useAtendimentoHelpers] NÃO processando campos individuais:', {
            hasIndividualFields: !!individualFields,
            individualFieldsKeys: individualFields ? Object.keys(individualFields) : [],
            isExamResult: aiType === 'exam_result',
            hasUpdateCallback: !!updateDynamicFieldsFromAI,
            hasGeneralCallback: !!onIndividualFieldsUpdate
          });
        }
        
        resolve();
      }, modelTitle, fieldsToUse);
    });
  };

  return {
    processAIContent
  };
};
