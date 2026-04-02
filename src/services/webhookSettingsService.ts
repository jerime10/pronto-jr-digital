
import { supabase } from '@/integrations/supabase/client';

export async function fetchWebhookSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('id, n8n_webhook_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching webhook settings:', error);
    throw error;
  }
  
  return {
    id: data?.id,
    webhookUrl: data?.n8n_webhook_url || ''
  };
}

import { upsertSiteSettings } from './siteSettingsSingleton';

export async function updateWebhookSettings(
  webhookUrl: string,
  settingsId: string | undefined
): Promise<void> {
  try {
    console.log('Updating webhook settings:', { webhookUrl, settingsId });
    
    // Use unified upsert utility to ensure singleton row and prevent key reset
    await upsertSiteSettings({
      n8n_webhook_url: webhookUrl,
    });
    
    console.log('Webhook settings updated successfully');
  } catch (error) {
    console.error('Error in updateWebhookSettings:', error);
    throw error;
  }
}
