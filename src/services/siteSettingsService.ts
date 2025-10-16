
import { supabase } from '@/integrations/supabase/client';
import { SiteSettings } from '@/types/siteSettingsTypes';

// Fetch settings from the database
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching site settings:', error);
      throw error;
    }
    
    if (!data) {
      console.log('No site settings found, returning defaults');
      // Return default values if no settings exist
      return {
        primaryColor: '#10b981',
        accentColor: '#3b82f6',
        fontFamily: 'Inter',
        logoUrl: null,
        logoData: null,
        signatureData: null,
        signatureProfessionalName: null,
        signatureProfessionalTitle: null,
        signatureProfessionalRegistry: null,
        clinicName: '',
        clinicAddress: '',
        clinicPhone: '',
        n8nWebhookUrl: '',
        medicalRecordWebhookUrl: '',
        pixKey: null,
      } as SiteSettings;
    }
    
    return {
      id: data.id,
      primaryColor: data.primary_color || '#10b981',
      accentColor: data.accent_color || '#3b82f6',
      fontFamily: data.font_family || 'Inter',
      logoUrl: data.logo_url,
      logoData: data.logo_data,
      signatureData: data.signature_data,
      signatureProfessionalName: data.signature_professional_name,
      signatureProfessionalTitle: data.signature_professional_title,
      signatureProfessionalRegistry: data.signature_professional_registry,
      clinicName: data.clinic_name || '',
      clinicAddress: data.clinic_address || '',
      clinicPhone: data.clinic_phone || '',
      n8nWebhookUrl: data.n8n_webhook_url || '',
      medicalRecordWebhookUrl: data.medical_record_webhook_url || '',
      pixKey: data.pix_key || null,
      whatsapp_reminder_webhook_url: data.whatsapp_reminder_webhook_url || null,
      whatsapp_recurring_reminder_webhook_url: data.whatsapp_recurring_reminder_webhook_url || null,
    } as SiteSettings;
  } catch (err) {
    console.error('Error in site settings query:', err);
    // Return default values in case of error
    return {
      primaryColor: '#10b981',
      accentColor: '#3b82f6',
      fontFamily: 'Inter',
      logoUrl: null,
      logoData: null,
      signatureData: null,
      signatureProfessionalName: null,
      signatureProfessionalTitle: null,
      signatureProfessionalRegistry: null,
      clinicName: '',
      clinicAddress: '',
      clinicPhone: '',
      n8nWebhookUrl: '',
      medicalRecordWebhookUrl: '',
      pixKey: null,
      whatsapp_reminder_webhook_url: null,
      whatsapp_recurring_reminder_webhook_url: null,
    } as SiteSettings;
  }
}
