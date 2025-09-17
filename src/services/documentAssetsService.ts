
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function uploadLogoAsset(logoData: string) {
  try {
    console.log('Logo data size:', logoData.length);
    
    // Buscar configurações existentes
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site settings:', fetchError);
      throw fetchError;
    }

    // Preparar dados para salvar
    const settingsData = {
      logo_data: logoData,
      signature_data: existingSettings?.signature_data || null,
      signature_professional_name: existingSettings?.signature_professional_name || null,
      signature_professional_title: existingSettings?.signature_professional_title || null,
      signature_professional_registry: existingSettings?.signature_professional_registry || null,
      primary_color: existingSettings?.primary_color || '#10b981',
      accent_color: existingSettings?.accent_color || '#3b82f6',
      font_family: existingSettings?.font_family || 'Inter',
      clinic_name: existingSettings?.clinic_name || '',
      clinic_address: existingSettings?.clinic_address || '',
      clinic_phone: existingSettings?.clinic_phone || '',
      n8n_webhook_url: existingSettings?.n8n_webhook_url || '',
      medical_record_webhook_url: existingSettings?.medical_record_webhook_url || '',
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingSettings?.id) {
      // Atualizar configurações existentes
      const { data, error } = await supabase
        .from('site_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar novas configurações
      const { data, error } = await supabase
        .from('site_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('Logo asset saved successfully');
    
    return { 
      success: true, 
      assets: {
        logoData,
        signatureData: result.signature_data,
        signatureProfessionalName: result.signature_professional_name,
        signatureProfessionalTitle: result.signature_professional_title,
        signatureProfessionalRegistry: result.signature_professional_registry
      }
    };
  } catch (error) {
    console.error('Error uploading logo asset:', error);
    toast.error('Erro ao salvar logo');
    throw error;
  }
}

export async function uploadSignatureAsset(
  signatureData: string,
  signatureProfessionalName?: string,
  signatureProfessionalTitle?: string,
  signatureProfessionalRegistry?: string
) {
  try {
    console.log('Signature data size:', signatureData.length);
    console.log('Professional info:', {
      name: signatureProfessionalName,
      title: signatureProfessionalTitle,
      registry: signatureProfessionalRegistry
    });
    
    // Buscar configurações existentes
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site settings:', fetchError);
      throw fetchError;
    }

    // Preparar dados para salvar
    const settingsData = {
      logo_data: existingSettings?.logo_data || null,
      signature_data: signatureData,
      signature_professional_name: signatureProfessionalName || null,
      signature_professional_title: signatureProfessionalTitle || null,
      signature_professional_registry: signatureProfessionalRegistry || null,
      primary_color: existingSettings?.primary_color || '#10b981',
      accent_color: existingSettings?.accent_color || '#3b82f6',
      font_family: existingSettings?.font_family || 'Inter',
      clinic_name: existingSettings?.clinic_name || '',
      clinic_address: existingSettings?.clinic_address || '',
      clinic_phone: existingSettings?.clinic_phone || '',
      n8n_webhook_url: existingSettings?.n8n_webhook_url || '',
      medical_record_webhook_url: existingSettings?.medical_record_webhook_url || '',
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingSettings?.id) {
      // Atualizar configurações existentes
      const { data, error } = await supabase
        .from('site_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar novas configurações
      const { data, error } = await supabase
        .from('site_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('Signature asset saved successfully');
    
    return { 
      success: true, 
      assets: {
        logoData: result.logo_data,
        signatureData,
        signatureProfessionalName,
        signatureProfessionalTitle,
        signatureProfessionalRegistry
      }
    };
  } catch (error) {
    console.error('Error uploading signature asset:', error);
    toast.error('Erro ao salvar assinatura');
    throw error;
  }
}

export async function fetchDocumentAssets() {
  try {
    console.log('Fetching document assets from site_settings...');
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('logo_data, signature_data, signature_professional_name, signature_professional_title, signature_professional_registry, attendant_logo_data')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document assets:', error);
      // Return empty assets on error to avoid breaking the app
      return {
        logoData: null,
        signatureData: null,
        signatureProfessionalName: null,
        signatureProfessionalTitle: null,
        signatureProfessionalRegistry: null,
        attendantLogoData: null
      };
    }

    if (!data) {
      console.log('No document assets found');
      return {
        logoData: null,
        signatureData: null,
        signatureProfessionalName: null,
        signatureProfessionalTitle: null,
        signatureProfessionalRegistry: null,
        attendantLogoData: null
      };
    }

    console.log('Document assets fetched successfully');
    return {
      logoData: data.logo_data,
      signatureData: data.signature_data,
      signatureProfessionalName: data.signature_professional_name,
      signatureProfessionalTitle: data.signature_professional_title,
      signatureProfessionalRegistry: data.signature_professional_registry,
      attendantLogoData: data.attendant_logo_data
    };
  } catch (error) {
    console.error('Error fetching document assets:', error);
    // Return empty assets on error to avoid breaking the app
    return {
      logoData: null,
      signatureData: null,
      signatureProfessionalName: null,
      signatureProfessionalTitle: null,
      signatureProfessionalRegistry: null,
      attendantLogoData: null
    };
  }
}

export async function saveDocumentAssets(assets: any) {
  try {
    console.log('Saving document assets to site_settings...');
    
    // Buscar configurações existentes
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site settings:', fetchError);
      throw fetchError;
    }

    // Preparar dados para salvar
    const settingsData = {
      logo_data: assets.logoData || null,
      signature_data: assets.signatureData || null,
      signature_professional_name: assets.signatureProfessionalName || null,
      signature_professional_title: assets.signatureProfessionalTitle || null,
      signature_professional_registry: assets.signatureProfessionalRegistry || null,
      attendant_logo_data: assets.attendantLogoData || null,
      primary_color: existingSettings?.primary_color || '#10b981',
      accent_color: existingSettings?.accent_color || '#3b82f6',
      font_family: existingSettings?.font_family || 'Inter',
      clinic_name: existingSettings?.clinic_name || '',
      clinic_address: existingSettings?.clinic_address || '',
      clinic_phone: existingSettings?.clinic_phone || '',
      n8n_webhook_url: existingSettings?.n8n_webhook_url || '',
      medical_record_webhook_url: existingSettings?.medical_record_webhook_url || '',
      updated_at: new Date().toISOString()
    };

    if (existingSettings?.id) {
      // Atualizar configurações existentes
      const { error } = await supabase
        .from('site_settings')
        .update(settingsData)
        .eq('id', existingSettings.id);

      if (error) throw error;
    } else {
      // Criar novas configurações
      const { error } = await supabase
        .from('site_settings')
        .insert(settingsData);

      if (error) throw error;
    }

    console.log('Document assets saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving document assets:', error);
    toast.error('Erro ao salvar assets');
    throw error;
  }
}
