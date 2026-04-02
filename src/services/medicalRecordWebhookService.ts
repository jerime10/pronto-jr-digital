
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

import { upsertSiteSettings } from './siteSettingsSingleton';

export async function updateMedicalRecordWebhookSettings(
  medicalRecordWebhookUrl: string,
  settingsId: string | undefined
): Promise<void> {
  console.log('🔧 [Webhook Settings] Iniciando atualização com utility singleton:', { 
    url: medicalRecordWebhookUrl, 
    settingsId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Use unified upsert utility to ensure singleton row and prevent key reset
    await upsertSiteSettings({
      medical_record_webhook_url: medicalRecordWebhookUrl,
    });
    
    console.log('✅ [Webhook Settings] Configuração atualizada com sucesso!');
    
  } catch (error: any) {
    console.error('💥 [Webhook Settings] Erro crítico:', error);
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
