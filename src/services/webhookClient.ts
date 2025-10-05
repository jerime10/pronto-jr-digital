
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches webhook URL from database
 */
export async function fetchWebhookUrl(): Promise<string> {
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('medical_record_webhook_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (settingsError) {
    console.error('Error fetching webhook URL:', settingsError);
    throw new Error(`Erro ao buscar configurações: ${settingsError.message}`);
  }
  
  const webhookUrl = settings?.medical_record_webhook_url;
  
  if (!webhookUrl) {
    const errorMessage = 'URL do webhook para prontuários não configurada. Configure em Administração > Configurações > Envio Prontuário.';
    console.error(errorMessage);
    throw new Error('URL do webhook para prontuários não configurada');
  }
  
  console.log('Using webhook URL from database:', webhookUrl);
  return webhookUrl;
}

/**
 * Sends FormData to webhook
 */
export async function sendToWebhook(webhookUrl: string, formData: FormData): Promise<Response> {
  const isProdUrl = webhookUrl.includes('n8n.mentoriajrs.com');
  console.log('Production URL detected:', isProdUrl, 'for URL:', webhookUrl);
  
  // 🔍 CRITICAL: Log COMPLETO do FormData antes de enviar
  console.log('📤 [WEBHOOK-CLIENT] ===== FORMDATA COMPLETO ANTES DO ENVIO =====');
  
  // Log de TODOS os campos do FormData
  console.log('📤 [WEBHOOK-CLIENT] Total de campos no FormData:', Array.from(formData.entries()).length);
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      if (value.length > 200) {
        console.log(`📤 [WEBHOOK-CLIENT] ${key}:`, value.substring(0, 200) + '... [TRUNCADO - ' + value.length + ' chars]');
      } else {
        console.log(`📤 [WEBHOOK-CLIENT] ${key}:`, value);
      }
    } else {
      console.log(`📤 [WEBHOOK-CLIENT] ${key}:`, value);
    }
  }
  
  console.log('');
  console.log('📤 [WEBHOOK-CLIENT] ===== CAMPOS CRÍTICOS DE OBSERVAÇÕES =====');
  console.log('📤 [WEBHOOK-CLIENT] examObservations:', formData.get('examObservations'));
  console.log('📤 [WEBHOOK-CLIENT] exam_observations:', formData.get('exam_observations'));
  console.log('📤 [WEBHOOK-CLIENT] observacoesExames:', formData.get('observacoesExames'));
  console.log('📤 [WEBHOOK-CLIENT] observacoes:', formData.get('observacoes'));
  console.log('📤 [WEBHOOK-CLIENT] exam_obs:', formData.get('exam_obs'));
  
  console.log('');
  console.log('📤 [WEBHOOK-CLIENT] ===== CAMPOS CRÍTICOS DE RESULTADOS =====');
  console.log('📤 [WEBHOOK-CLIENT] examResults:', formData.get('examResults'));
  console.log('📤 [WEBHOOK-CLIENT] exam_results:', formData.get('exam_results'));
  console.log('📤 [WEBHOOK-CLIENT] resultadosExames:', formData.get('resultadosExames'));
  console.log('📤 [WEBHOOK-CLIENT] resultados:', formData.get('resultados'));
  console.log('📤 [WEBHOOK-CLIENT] exam_res:', formData.get('exam_res'));
  
  console.log('');
  console.log('📤 [WEBHOOK-CLIENT] ===== CAMPOS DO MODELO =====');
  console.log('📤 [WEBHOOK-CLIENT] selectedModelTitle:', formData.get('selectedModelTitle'));
  console.log('📤 [WEBHOOK-CLIENT] exam_model_title:', formData.get('exam_model_title'));
  console.log('📤 [WEBHOOK-CLIENT] modelTitle:', formData.get('modelTitle'));
  console.log('📤 [WEBHOOK-CLIENT] titulo_modelo:', formData.get('titulo_modelo'));
  
  console.log('📤 [WEBHOOK-CLIENT] ===== FIM FORMDATA COMPLETO =====');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: isProdUrl ? 'no-cors' : undefined,
      body: formData,
    });
    
    // With no-cors mode, we can't read the response status or body
    // If the fetch didn't throw an error, we assume success
    if (isProdUrl && response.status === 0) {
      console.log('no-cors mode: Assuming success since fetch completed without error');
      // Create a mock successful response for no-cors mode
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error sending to webhook:', error);
    throw error;
  }
}
