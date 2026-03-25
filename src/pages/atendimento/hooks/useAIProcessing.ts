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
    dynamicFields?: Record<string, string>
  ) => {
    // Early validation - aceitar campos dinâmicos mesmo com content vazio ou null
    const hasValidContent = content && content !== null && content.trim() !== '';
    const hasDynamicFields = dynamicFields && Object.values(dynamicFields).some(value => value?.trim());
    
    if (!hasValidContent && !hasDynamicFields) {
      toast.error('Por favor, forneça algum conteúdo para processar com IA.');
      return;
    }
    
    try {
      // Set the processing state for this specific field
      const fieldKey = type === 'main_complaint' ? 'mainComplaint' : type === 'evolution' ? 'evolution' : 'examResults';
      setIsProcessingAI(prev => ({ ...prev, [fieldKey]: true }));
      
      console.log(`🤖 Processando ${type} com IA:`, content);
      console.log('🔍 [useAIProcessing] Análise de entrada:');
      console.log('   content:', content);
      console.log('   content type:', typeof content);
      console.log('   content === null:', content === null);
      console.log('   content === "":', content === '');
      console.log('   dynamicFields:', dynamicFields);
      
      // Verificar se há campos dinâmicos válidos
      const hasDynamicFields = dynamicFields && Object.keys(dynamicFields).length > 0 && 
        Object.values(dynamicFields).some(value => value && value.trim());
      
      // Verificar se há conteúdo válido (não vazio e não null)
      const hasValidContent = content && content !== null && content.trim();
      
      console.log('🔍 [useAIProcessing] Resultado da análise:');
      console.log('   hasDynamicFields:', hasDynamicFields);
      console.log('   hasValidContent:', hasValidContent);
      
      // Call the Edge Function ai-webhook
      const requestBody: any = {};
      
      if (hasDynamicFields) {
        // Se há campos dinâmicos, enviar apenas eles (comportamento novo)
        console.log("🎯 Enviando apenas campos dinâmicos (sem content/type)");
        console.log("🔍 Campos dinâmicos detectados:", Object.keys(dynamicFields).filter(key => dynamicFields[key]?.trim()));
        Object.entries(dynamicFields).forEach(([key, value]) => {
          if (value && value.trim()) {
            requestBody[key] = value;
          }
        });
        
        // Incluir selectedModelTitle também para campos dinâmicos
        if (selectedModelTitle) {
          console.log("🔍 Incluindo selectedModelTitle:", selectedModelTitle);
          requestBody.selectedModelTitle = selectedModelTitle;
        }
        
        // NÃO incluir Resultado Final - apenas campos dinâmicos individuais
        console.log("🎯 Enviando APENAS campos dinâmicos individuais (sem Resultado Final)");
      } else if (hasValidContent) {
        // Se não há campos dinâmicos mas há conteúdo válido, enviar content/type (botões individuais)
        console.log("🎯 Enviando content/type (requisição individual)");
        requestBody.content = content;
        requestBody.type = type;
        
        // Incluir selectedModelTitle se disponível
        if (selectedModelTitle) {
          requestBody.selectedModelTitle = selectedModelTitle;
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