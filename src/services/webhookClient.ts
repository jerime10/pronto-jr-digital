
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
