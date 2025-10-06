
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
 * Interface for webhook response data
 */
export interface WebhookResponseData {
  success: boolean;
  processed_content?: string;
  individual_fields?: Record<string, string>;
  [key: string]: any;
}

/**
 * Sends FormData to webhook and returns parsed response data
 */
export async function sendToWebhook(webhookUrl: string, formData: FormData): Promise<{ response: Response; data?: WebhookResponseData }> {
  const isProdUrl = webhookUrl.includes('n8n.mentoriajrs.com');
  console.log('Production URL detected:', isProdUrl, 'for URL:', webhookUrl);
  
  // Log dos campos importantes do FormData antes de enviar
  console.log('📋 [WEBHOOK-CLIENT] ===== ENVIANDO FORMDATA =====');
  console.log('📋 [WEBHOOK-CLIENT] selectedModelTitle:', formData.get('selectedModelTitle'));
  console.log('📋 [WEBHOOK-CLIENT] exam_model_title:', formData.get('exam_model_title'));
  console.log('📋 [WEBHOOK-CLIENT] modelTitle:', formData.get('modelTitle'));
  console.log('📋 [WEBHOOK-CLIENT] titulo_modelo:', formData.get('titulo_modelo'));
  
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
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
      return { response: mockResponse, data: { success: true } };
    }
    
    // Try to parse response data when not in no-cors mode
    let responseData: WebhookResponseData | undefined;
    try {
      if (response.ok) {
        const text = await response.text();
        if (text) {
          responseData = JSON.parse(text);
          console.log('📋 [WEBHOOK-CLIENT] Resposta do webhook:', responseData);
          
          // Log specific fields we're interested in
          if (responseData?.individual_fields) {
            console.log('📋 [WEBHOOK-CLIENT] Campos individuais recebidos:', responseData.individual_fields);
            if (responseData.individual_fields.observacoes) {
              console.log('📋 [WEBHOOK-CLIENT] Observações processadas:', responseData.individual_fields.observacoes);
            }
          }
        }
      }
    } catch (parseError) {
      console.warn('Não foi possível fazer parse da resposta do webhook:', parseError);
    }
    
    return { response, data: responseData };
  } catch (error) {
    console.error('Error sending to webhook:', error);
    throw error;
  }
}
