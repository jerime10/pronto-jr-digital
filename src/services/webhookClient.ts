
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
  
  // ===== ETAPA 2: LOGS COMPLETOS DO FORMDATA =====
  console.log('📤 [WEBHOOK-CLIENT] ===== TODOS OS DADOS DO FORMDATA =====');
  
  // Contar campos dinâmicos (começam com letra minúscula, exceto campos especiais)
  let dynamicFieldsCount = 0;
  const dynamicFieldsPreview: Record<string, any> = {};
  
  for (const [key, value] of formData.entries()) {
    // Identificar campos dinâmicos
    if (key.charAt(0) === key.charAt(0).toLowerCase() && 
        !['selectedModelTitle', 'timestamp'].includes(key)) {
      dynamicFieldsCount++;
      const strValue = String(value);
      dynamicFieldsPreview[key] = strValue.substring(0, 100); // Preview de 100 chars
    }
    
    // Logar todos os campos
    const displayValue = typeof value === 'string' 
      ? (value.length > 150 ? value.substring(0, 150) + '...' : value)
      : value;
    console.log(`📤 [WEBHOOK-CLIENT] ${key}:`, displayValue);
  }
  
  console.log(`📤 [WEBHOOK-CLIENT] ===== RESUMO =====`);
  console.log(`📤 [WEBHOOK-CLIENT] Total de campos dinâmicos: ${dynamicFieldsCount}`);
  console.log(`📤 [WEBHOOK-CLIENT] Campos dinâmicos (preview):`, dynamicFieldsPreview);
  console.log(`📤 [WEBHOOK-CLIENT] selectedModelTitle:`, formData.get('selectedModelTitle'));
  console.log(`📤 [WEBHOOK-CLIENT] ===== FIM DOS LOGS =====\n`);
  
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
