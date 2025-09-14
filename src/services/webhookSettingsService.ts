
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

export async function updateWebhookSettings(
  webhookUrl: string,
  settingsId: string | undefined
): Promise<void> {
  try {
    console.log('Updating webhook settings:', { webhookUrl, settingsId });
    
    // Always get the current record to ensure we're updating the right one
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const updateData = {
      n8n_webhook_url: webhookUrl,
      updated_at: new Date().toISOString(),
    };
    
    if (currentSettings?.id) {
      // Update existing settings using the most recent record
      const { error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', currentSettings.id);
      
      if (error) {
        console.error('Error updating webhook settings:', error);
        throw error;
      }
    } else {
      // Create new settings if none exist
      const { error } = await supabase
        .from('site_settings')
        .insert({
          ...updateData,
          primary_color: '#10b981',
          accent_color: '#3b82f6',
          font_family: 'Inter',
          clinic_name: '',
          clinic_address: '',
          clinic_phone: '',
          medical_record_webhook_url: ''
        });
      
      if (error) {
        console.error('Error creating webhook settings:', error);
        throw error;
      }
    }
    
    console.log('Webhook settings updated successfully');
  } catch (error) {
    console.error('Error in updateWebhookSettings:', error);
    throw error;
  }
}
