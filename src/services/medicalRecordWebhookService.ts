
import { supabase } from '@/integrations/supabase/client';

export async function fetchMedicalRecordWebhookSettings() {
  try {
    console.log('📖 [Webhook Settings] Buscando configurações com client administrativo...');
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, medical_record_webhook_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('❌ [Webhook Settings] Erro na consulta:', error);
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }
    
    console.log('✅ [Webhook Settings] Configurações obtidas com sucesso');
    return {
      id: data?.id,
      medicalRecordWebhookUrl: data?.medical_record_webhook_url || ''
    };
    
  } catch (error: any) {
    console.error('💥 [Webhook Settings] Erro crítico na busca:', error);
    throw new Error(`Falha ao acessar configurações: ${error?.message || 'Erro desconhecido'}`);
  }
}

export async function updateMedicalRecordWebhookSettings(
  medicalRecordWebhookUrl: string,
  settingsId: string | undefined
): Promise<void> {
  console.log('🔧 [Webhook Settings] Iniciando atualização com client administrativo:', { 
    url: medicalRecordWebhookUrl, 
    settingsId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Primeiro, tentar buscar configurações existentes
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [Webhook Settings] Erro ao buscar configurações:', fetchError);
      throw new Error(`Falha ao verificar configurações existentes: ${fetchError.message}`);
    }

    const updateData = {
      medical_record_webhook_url: medicalRecordWebhookUrl,
      updated_at: new Date().toISOString(),
    };

    if (existingSettings?.id) {
      console.log('📝 [Webhook Settings] Atualizando registro existente:', existingSettings.id);
      
      const { error: updateError } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', existingSettings.id);
      
      if (updateError) {
        console.error('❌ [Webhook Settings] Erro na atualização:', updateError);
        throw new Error(`Falha ao atualizar configuração: ${updateError.message}`);
      }
      
      console.log('✅ [Webhook Settings] Configuração atualizada com sucesso!');
      
    } else {
      console.log('🆕 [Webhook Settings] Criando novo registro de configuração');
      
      const { error: insertError } = await supabase
        .from('site_settings')
        .insert({
          ...updateData,
          primary_color: '#10b981',
          accent_color: '#3b82f6', 
          font_family: 'Inter',
          clinic_name: 'Clínica Exemplo',
          clinic_address: '',
          clinic_phone: '',
          n8n_webhook_url: ''
        });
      
      if (insertError) {
        console.error('❌ [Webhook Settings] Erro na criação:', insertError);
        throw new Error(`Falha ao criar configuração: ${insertError.message}`);
      }
      
      console.log('✅ [Webhook Settings] Nova configuração criada com sucesso!');
    }
    
  } catch (error: any) {
    console.error('💥 [Webhook Settings] Erro crítico:', {
      message: error?.message || 'Erro desconhecido',
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    
    // Re-throw with user-friendly message
    throw new Error(error?.message || 'Erro interno na operação de webhook');
  }
}

// Service function to submit medical record data to webhook
export async function submitMedicalRecordToWebhook(medicalRecordData: any) {
  try {
    console.log('Mocking medical record submission for pharmacy system:', medicalRecordData);
    
    // Mock: Return a successful response for the pharmacy system
    const mockResult = {
      success: true,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: 'Medical record submitted successfully (mocked)'
    };
    
    return mockResult;
  } catch (error) {
    console.error('Error submitting medical record to webhook:', error);
    throw error;
  }
}
