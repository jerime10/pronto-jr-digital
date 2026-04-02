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
    content: string | null, 
    type: 'main_complaint' | 'evolution' | 'exam_result',
    onSuccess: (processedContent: string, individualFields?: Record<string, string>) => void,
    selectedModelTitle?: string | null,
    dynamicFields?: Record<string, string>,
    selectedModelId?: string | null,
    selectedFieldsKeys?: string[]
  ) => {
    // Early validation - aceitar campos dinâmicos mesmo com content vazio ou null
    const safeContent = (content === null || content === undefined) ? '' : String(content);
    const hasValidContent = safeContent.trim() !== '';
    
    const hasDynamicFields = dynamicFields && Object.values(dynamicFields).some(value => {
      const stringValue = (value === null || value === undefined) ? '' : String(value);
      return stringValue.trim() !== '';
    });
    
    if (!hasValidContent && !hasDynamicFields) {
      toast.error('Por favor, forneça algum conteúdo para processar com IA.');
      return;
    }
    
    try {
      // Set the processing state for this specific field
      const fieldKey = type === 'main_complaint' ? 'mainComplaint' : type === 'evolution' ? 'evolution' : 'examResults';
      setIsProcessingAI(prev => ({ ...prev, [fieldKey]: true }));
      
      console.log(`🤖 Processando ${type} with IA:`, content);
      console.log('🔍 [useAIProcessing] Análise de entrada:');
      console.log('   content:', content);
      console.log('   dynamicFields:', dynamicFields);
      console.log('   selectedModelId:', selectedModelId);
      console.log('   selectedFieldsKeys:', selectedFieldsKeys);
      
      // Verificar se há campos dinâmicos válidos
      const hasDynamicFieldsCheck = dynamicFields && Object.keys(dynamicFields).length > 0 && 
        Object.values(dynamicFields).some(value => {
          const stringValue = (value === null || value === undefined) ? '' : String(value);
          return stringValue.trim() !== '';
        });
      
      // Verificar se há conteúdo válido
      const hasValidContentCheck = safeContent.trim() !== '';
      
      console.log('🔍 [useAIProcessing] Resultado da análise:');
      console.log('   hasDynamicFields:', hasDynamicFieldsCheck);
      console.log('   hasValidContent:', hasValidContentCheck);
      
      // LOG DE PREVISÃO (Útil se a Edge Function não retornar o debug_prompt)
      console.log('%c 🔍 PREVISÃO DE PROMPT ', 'background: #333; color: #ffeb3b; font-weight: bold;');
      console.log('   Prompt esperado:', selectedModelId ? 'PERSONALIZADO DO MODELO' : 'GLOBAL');
      
      // Call the Edge Function ai-webhook
      const requestBody: any = {};
      
      if (hasDynamicFieldsCheck) {
        // Se há campos dinâmicos, enviar apenas eles (comportamento novo)
        console.log("🎯 Enviando apenas campos dinâmicos");
        
        // Sempre incluir o tipo para que a Edge Function saiba qual prompt base usar
        requestBody.type = type;

        Object.entries(dynamicFields).forEach(([key, value]) => {
          let stringValue = (value === null || value === undefined) ? '' : String(value);
          if (stringValue.trim() !== '') {
            // Nota: O título do campo agora já é injetado no componente ResultadoExames.tsx 
            // no formato "NOME_DO_CAMPO: valor". 
            
            // SOLUÇÃO: Injeção de Instrução Direta
            // Se o campo estiver na lista de selecionados (via checkbox), anexar instrução
            const cleanKeyForCheck = key.startsWith('titulo_campo_') ? key.replace('titulo_campo_', '') : key;
            if (selectedFieldsKeys && Array.isArray(selectedFieldsKeys) && selectedFieldsKeys.includes(cleanKeyForCheck)) {
              console.log(`💉 [useAIProcessing] Injetando instrução no campo: ${key}`);
              // Verifica se a string já não contém a instrução para não duplicar
              if (!stringValue.includes("INFORME EM IMPRESSÃO DIAGNÓSTICA.")) {
                stringValue = `${stringValue.trim()} (INFORME EM IMPRESSÃO DIAGNÓSTICA.)`;
              }
            }
            requestBody[key] = stringValue;
          }
        });
        
        // Incluir selectedModelTitle e selectedModelId também para campos dinâmicos
        if (selectedModelTitle) {
          console.log("🔍 Incluindo selectedModelTitle:", selectedModelTitle);
          requestBody.selectedModelTitle = selectedModelTitle;
        }
        if (selectedModelId) {
          console.log("🔍 Incluindo selectedModelId:", selectedModelId);
          requestBody.selectedModelId = selectedModelId;
        }
        
        // Incluir campos selecionados para análise se fornecido
        if (selectedFieldsKeys && selectedFieldsKeys.length > 0) {
          console.log("🔍 Incluindo selectedFieldsKeys:", selectedFieldsKeys);
          requestBody.selectedFieldsKeys = selectedFieldsKeys;
        }
        
        // NÃO incluir Resultado Final - apenas campos dinâmicos individuais
        console.log("🎯 Enviando APENAS campos dinâmicos individuais (sem Resultado Final)");
      } else if (hasValidContent) {
        // Se não há campos dinâmicos mas há conteúdo válido, enviar content/type (botões individuais)
        console.log("🎯 Enviando content/type (requisição individual)");
        requestBody.content = content;
        requestBody.type = type;
        
        // Incluir selectedModelTitle e selectedModelId se disponível
        if (selectedModelTitle) {
          requestBody.selectedModelTitle = selectedModelTitle;
        }
        if (selectedModelId) {
          requestBody.selectedModelId = selectedModelId;
        }
      } else {
        // Nenhum conteúdo válido para processar
        console.error("❌ Nenhum conteúdo válido para processar:", { hasValidContent, hasDynamicFields });
        toast.error('Nenhum conteúdo válido para processar com IA.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-webhook', {
        body: requestBody
      });
      
      if (error) {
        console.error('Erro na função Edge Function:', error);
        
        // Try to extract the custom error message we send from the Edge Function
        let errorMessage = error.message;
        
        try {
          // FunctionsHttpError often contains the body response in its details or context
          // However, supabase-js v2 might throw an error object where the body is not easily accessible
          // If we received data but success is false, we can use that error
          if (data && data.error) {
            errorMessage = data.error;
          } else if (error.context && error.context.json) {
            const errorJson = await error.context.json();
            if (errorJson && errorJson.error) {
              errorMessage = errorJson.error;
            }
          }
        } catch (e) {
          console.error('Erro ao extrair detalhes do erro:', e);
        }

        // Se a mensagem ainda for genérica, damos uma dica mais clara
        if (errorMessage.includes('non-2xx status code')) {
          errorMessage = 'O modelo de Inteligência Artificial recusou a requisição. Isso pode ocorrer se o modelo escolhido for incompatível, estiver fora do ar ou se houver falta de créditos na sua conta OpenRouter.';
        }

        toast.error(`Falha na Inteligência Artificial: ${errorMessage}`, {
          duration: 6000,
        });
        return;
      }
      
      if (data && !data.success) {
        console.error('Erro retornado pela IA:', data.error);
        toast.error(`Falha na Inteligência Artificial: ${data.error || 'Erro desconhecido'}`, {
          duration: 6000,
        });
        return;
      }
      
      console.log('Resposta da IA:', data);
      
      // LOG DE AUDITORIA DO PROMPT (Para fins de teste)
      if (data?.debug_prompt) {
        console.group('%c 🧪 AUDITORIA DE PROMPT IA ', 'background: #222; color: #bada55; font-size: 12px; font-weight: bold;');
        console.log('%c Prompt de Sistema Utilizado:', 'font-weight: bold; color: #4CAF50;');
        console.log(data.debug_prompt);
        console.log('%c Tipo de Processamento:', 'font-weight: bold; color: #2196F3;', type);
        console.log('%c ID do Modelo:', 'font-weight: bold; color: #FF9800;', selectedModelId || 'Nenhum (Global)');
        console.groupEnd();
      }
      
      // Consider success if we have EITHER processed_content OR individual_fields
      const hasProcessedContent = Boolean(data?.processed_content);
      const hasIndividualFields = Boolean(data?.individual_fields && Object.keys(data.individual_fields).length > 0);
      
      if (data?.success && (hasProcessedContent || hasIndividualFields)) {
        toast.success('Conteúdo processado com IA com sucesso!');
        
        // Pass empty string as fallback for processedContent if only individual_fields exist
        onSuccess(data.processed_content || '', data.individual_fields || null);
      } else {
        toast.error('Erro: Resposta inválida da IA');
        console.error('Resposta inválida da IA:', data);
      }
      
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