
import { FormState } from './useFormData';

interface AtendimentoHelpersProps {
  processAI: (content: string | null, type: 'main_complaint' | 'evolution' | 'exam_result', onSuccess: (processedContent: string, individualFields?: Record<string, string>) => void, selectedModelTitle?: string | null, dynamicFields?: Record<string, string>, selectedModelId?: string | null, selectedFieldsKeys?: string[]) => void;
  updateFormField: (field: keyof FormState, value: string | string[]) => void;
  selectedModelTitle?: string | null;
  dynamicFields?: Record<string, string>;
  onIndividualFieldsUpdate?: (fields: Record<string, string>) => void;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
  selectedModelId?: string | null;
}

export const useAtendimentoHelpers = ({
  processAI,
  updateFormField,
  selectedModelTitle,
  dynamicFields,
  onIndividualFieldsUpdate,
  updateDynamicFieldsFromAI,
  selectedModelId
}: AtendimentoHelpersProps) => {
  
  // Helper to avoid creating new callbacks in render - retorna Promise para compatibilidade
  const processAIContent = (field: string, content: string, providedDynamicFields?: Record<string, string>, selectedFieldsKeys?: string[]): Promise<void> => {
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
      
      // IMPORTANTE: Garantir que providedDynamicFields (undefined na Evolução) não faça fallback para os exames globais
      const fieldsToUse = providedDynamicFields !== undefined ? providedDynamicFields : (aiType === 'exam_result' ? dynamicFields : undefined);
      
      const formatLongText = (text: string, fieldKey?: string) => {
        if (!text) return text;
        // Limpar possíveis instruções que a IA possa ter retornado no texto
        let cleanText = text.replace(/INFORME EM IMPRESSÃO DIAGNÓSTICA\.?/gi, '').trim();
        
        // Obter o label do campo usando o mapa dinâmico para garantir limpeza correta
        if (fieldKey && dynamicFields) {
          // Procurar o campo correspondente na interface do template ativo
          // Para simplificar no helper, faremos uma limpeza genérica se o texto começar com a chave em si
          const keyPattern = fieldKey.replace(/([A-Z])/g, ' $1').trim(); // "rimdireito" -> "rim direito"
          const prefixRegex = new RegExp(`^${keyPattern}[\\s:]*`, 'i');
          cleanText = cleanText.replace(prefixRegex, '').trim();
        }

        if (cleanText.length > 0) {
          cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        }

        if (cleanText.length < 30) return cleanText;
        // Quebra após ponto seguido de espaço e colapsa quebras múltiplas
        return cleanText.replace(/\. +/g, '.\n').replace(/\n\n+/g, '\n');
      };

      processAI(content, aiType, (processedContent, individualFields) => {
        console.log('🔄 [useAtendimentoHelpers] onSuccess chamado - aiType:', aiType);
        
        // Formatar o conteúdo processado
        const formattedProcessedContent = formatLongText(processedContent);
        
        // Formatar campos individuais se existirem
        const formattedIndividualFields = individualFields ? Object.entries(individualFields).reduce((acc, [key, val]) => {
          // Se a chave for explicitamente "titulo_campo_NOME", vamos mapear de volta para "NOME"
          const cleanKey = key.startsWith('titulo_campo_') ? key.replace('titulo_campo_', '') : key;
          acc[cleanKey] = formatLongText(val, cleanKey);
          return acc;
        }, {} as Record<string, string>) : undefined;

        // Se há campos individuais e é um resultado de exame, processar APENAS campos individuais
        if (formattedIndividualFields && aiType === 'exam_result') {
          console.log('🎯 [useAtendimentoHelpers] Processando APENAS campos individuais (NÃO atualizando Resultado Final):', formattedIndividualFields);
          
          // Atualizar APENAS campos individuais
          if (onIndividualFieldsUpdate) {
            console.log('🎯 [useAtendimentoHelpers] CHAMANDO onIndividualFieldsUpdate (PRIORITÁRIO)');
            onIndividualFieldsUpdate(formattedIndividualFields);
          }
          
          if (updateDynamicFieldsFromAI) {
            console.log('🎯 [useAtendimentoHelpers] CHAMANDO updateDynamicFieldsFromAI (SECUNDÁRIO)');
            updateDynamicFieldsFromAI(formattedIndividualFields);
          }
          
          // NÃO atualizar o Resultado Final - ele será atualizado automaticamente pelos campos individuais
          console.log('🎯 [useAtendimentoHelpers] NÃO atualizando Resultado Final - será atualizado pelos campos individuais');
        } else {
          // Apenas atualizar o campo principal quando NÃO há campos individuais
          console.log('🎯 [useAtendimentoHelpers] Atualizando campo principal (sem campos individuais)');
          updateFormField(formField, formattedProcessedContent);
        }
        
        if (!formattedIndividualFields || aiType !== 'exam_result') {
          console.log('⚠️ [useAtendimentoHelpers] NÃO processando campos individuais:', {
            hasIndividualFields: !!formattedIndividualFields,
            individualFieldsKeys: formattedIndividualFields ? Object.keys(formattedIndividualFields) : [],
            isExamResult: aiType === 'exam_result',
            hasUpdateCallback: !!updateDynamicFieldsFromAI,
            hasGeneralCallback: !!onIndividualFieldsUpdate
          });
        }
        
        resolve();
      }, modelTitle, fieldsToUse, selectedModelId, selectedFieldsKeys);
    });
  };

  return {
    processAIContent
  };
};
