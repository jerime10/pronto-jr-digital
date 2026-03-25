
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
        rtSignatureData: null,
        rtName: null,
        rtTitle: null,
        rtRegistry: null,
        clinicName: '',
        clinicAddress: '',
        clinicPhone: '',
        n8nWebhookUrl: '',
        medicalRecordWebhookUrl: '',
      pixKey: null,
      openrouterApiKey: null,
      openrouterModel: 'openai/gpt-4o-mini',
      openaiApiKey: null,
      groqApiKey: null,
      promptQueixa: 'Você é um assistente médico especializado em estruturar a Queixa Principal e História da Moléstia Atual. Organize o texto recebido em um formato profissional, claro e objetivo.',
      promptEvolucao: 'Você é um assistente médico. Organize a evolução clínica do paciente com clareza, destacando estado geral, sinais vitais, e progressão do quadro.',
      promptExames: 'Você é um assistente médico. Analise e estruture os resultados de exames recebidos, extraindo parâmetros-chave e formatando em um laudo estruturado.',
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
      rtSignatureData: data.rt_signature_data,
      rtName: data.rt_name,
      rtTitle: data.rt_title,
      rtRegistry: data.rt_registry,
      clinicName: data.clinic_name || '',
      clinicAddress: data.clinic_address || '',
      clinicPhone: data.clinic_phone || '',
      n8nWebhookUrl: data.n8n_webhook_url || '',
      medicalRecordWebhookUrl: data.medical_record_webhook_url || '',
      pixKey: data.pix_key || null,
      whatsapp_reminder_webhook_url: data.whatsapp_reminder_webhook_url || null,
      whatsapp_recurring_reminder_webhook_url: data.whatsapp_recurring_reminder_webhook_url || null,
      openrouterApiKey: data.openrouter_api_key || null,
      openrouterModel: data.openrouter_model || 'openai/gpt-4o-mini',
      openaiApiKey: data.openai_api_key || null,
      groqApiKey: data.groq_api_key || null,
      promptQueixa: data.prompt_queixa || 'Você é um assistente médico especializado em estruturar a Queixa Principal e História da Moléstia Atual. Organize o texto recebido em um formato profissional, claro e objetivo.',
      promptEvolucao: data.prompt_evolucao || 'Você é um assistente médico. Organize a evolução clínica do paciente com clareza, destacando estado geral, sinais vitais, e progressão do quadro.',
      promptExames: data.prompt_exames || 'Você é um assistente médico. Analise e estruture os resultados de exames recebidos, extraindo parâmetros-chave e formatando em um laudo estruturado.',
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
      rtSignatureData: null,
      rtName: null,
      rtTitle: null,
      rtRegistry: null,
      clinicName: '',
      clinicAddress: '',
      clinicPhone: '',
      n8nWebhookUrl: '',
      medicalRecordWebhookUrl: '',
      pixKey: null,
      whatsapp_reminder_webhook_url: null,
      whatsapp_recurring_reminder_webhook_url: null,
      openrouterApiKey: null,
      openrouterModel: 'openai/gpt-4o-mini',
      promptQueixa: 'Você é um assistente médico especializado em estruturar a Queixa Principal e História da Moléstia Atual. Organize o texto recebido em um formato profissional, claro e objetivo.',
      promptEvolucao: 'Você é um assistente médico. Organize a evolução clínica do paciente com clareza, destacando estado geral, sinais vitais, e progressão do quadro.',
      promptExames: 'Você é um assistente médico. Analise e estruture os resultados de exames recebidos, extraindo parâmetros-chave e formatando em um laudo estruturado.',
    } as SiteSettings;
  }
}
