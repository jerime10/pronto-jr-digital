
import { buildMedicalRecordFormData } from './formDataBuilder';
import { SubmitMedicalRecordParams, MedicalRecordResponse } from '@/types/medicalRecordSubmissionTypes';
import { storeGeneratedDocument } from './documentStorageService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendToWebhook, WebhookResponseData } from './webhookClient';

/**
 * Fetches site settings including logo and professional data
 */
async function fetchSiteSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar configurações do site:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
}

/**
 * Submits medical record to webhook and stores document
 */
export async function submitMedicalRecordToWebhook(params: SubmitMedicalRecordParams): Promise<MedicalRecordResponse> {
  try {
    console.log('Iniciando envio do prontuário médico:', params);

    // Fetch site settings for logo and professional data
    const siteSettings = await fetchSiteSettings();
    console.log('Configurações do site carregadas:', siteSettings);

    // Get webhook URL from site settings or use default
    const webhookUrl = siteSettings?.medical_record_webhook_url || 'https://n8n.lovableproject.com/webhook/prontuario-jrs';
    console.log('URL do webhook a ser usada:', webhookUrl);
    
    // Log do selectedModelTitle antes de construir o FormData
    console.log('📋 [SUBMISSION] selectedModelTitle recebido:', params.selectedModelTitle);
    console.log('📋 [SUBMISSION] dynamicFields recebidos:', (params as any).dynamicFields);
    
    // Build complete FormData for webhook with all required information
    const formData = buildMedicalRecordFormData({
      medicalRecord: params.medicalRecord,
      attendanceId: `attendance-${Date.now()}`,
      additionalTimestamp: Date.now(),
      images: params.images || [],
      assets: {
        logoData: siteSettings?.logo_data || undefined,
        signatureData: siteSettings?.signature_data || undefined,
        signatureProfessionalName: siteSettings?.signature_professional_name || params.medicalRecord.professional?.name || 'Jérime Soares',
        signatureProfessionalTitle: siteSettings?.signature_professional_title || params.medicalRecord.professional?.specialty || 'Enfermeiro Obstetra',
        signatureProfessionalRegistry: siteSettings?.signature_professional_registry || params.medicalRecord.professional?.license_number || 'Coren 542061',
      },
      selectedModelTitle: params.selectedModelTitle,
      dynamicFields: (params as any).dynamicFields
    });

    // Add clinic information to FormData
    if (siteSettings) {
      formData.append('clinicName', siteSettings.clinic_name || 'Consultório JRS');
      formData.append('clinicAddress', siteSettings.clinic_address || 'Trav. José Soares, nº 152, Bairro: Fazendão');
      formData.append('clinicPhone', siteSettings.clinic_phone || '91-98595-8042');
    }

    // Add complete professional information
    const professionalData = {
      name: params.medicalRecord.professional?.name || 'Jérime Soares',
      specialty: params.medicalRecord.professional?.specialty || 'Enfermeiro Obstetra',
      license_type: params.medicalRecord.professional?.license_type || 'Coren',
      license_number: params.medicalRecord.professional?.license_number || '542061'
    };
    
    formData.append('professionalData', JSON.stringify(professionalData));
    
    // Send to webhook with proper error handling
    console.log('Enviando dados para o webhook...');
    
    let response: Response;
    let webhookData: WebhookResponseData | undefined;
    try {
      const webhookResult = await sendToWebhook(webhookUrl, formData);
      response = webhookResult.response;
      webhookData = webhookResult.data;
    } catch (fetchError) {
      console.error('Erro na requisição fetch:', fetchError);
      throw new Error(`Erro de conexão com o webhook: ${fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'}`);
    }

    console.log('Status da resposta do webhook:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    console.log('Dados processados do webhook:', webhookData);

    // Special handling for no-cors responses (status 0 means the request was sent but we can't read the response)
    const isProdUrl = webhookUrl.includes('n8n.mentoriajrs.com');
    if (isProdUrl && response.status === 0) {
      console.log('no-cors mode: Request sent successfully, cannot verify response');
      // For no-cors mode, if fetch didn't throw an error, assume success
    } else if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('Texto de erro da resposta:', errorText);
      } catch (textError) {
        console.error('Erro ao ler texto da resposta:', textError);
        errorText = 'Não foi possível ler a resposta de erro';
      }
      throw new Error(`Erro no webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }

    let webhookResponse;
    try {
      const responseText = await response.text();
      console.log('Resposta completa do webhook:', responseText);
      
      try {
        webhookResponse = JSON.parse(responseText);
        console.log('Resposta do webhook parseada:', webhookResponse);
      } catch (parseError) {
        console.log('Resposta não é JSON válido, tratando como sucesso');
        webhookResponse = { success: true, message: responseText };
      }
    } catch (responseError) {
      console.error('Erro ao processar resposta:', responseError);
      webhookResponse = { success: true };
    }

    // Determinar a URL correta do documento (NOVO: Agora centralizado no PDF Premium)
    const medicalRecordId = params.medicalRecord.id;
    let storageUrl = params.medicalRecord.file_url_storage || '';
    
    console.log('URL do documento (Premium) preservada:', storageUrl);

    // O sistema antigo de buscar arquivo no Storage e atualizar medical_records foi removido
    // pois a Edge Function generate-pdf-premium já faz isso de forma mais eficiente e correta.
    
    toast.success('Dados sincronizados com sucesso!');

    return {
      success: true,
      message: 'Prontuário processado com sucesso!',
      document: {
        fileUrl: storageUrl,
        documentType: 'prontuario'
      }
    };

  } catch (error) {
    console.error('Erro durante envio do prontuário:', error);
    
    // Try to update medical_records with error status even on error
    try {
      console.log('Marcando erro na medical_records devido ao erro...');
      await supabase
        .from('medical_records')
        .update({ file_url_storage: 'processing_error' })
        .eq('id', params.medicalRecord.id);
    } catch (placeholderError) {
      console.error('Erro ao marcar erro na medical_records:', placeholderError);
    }

    // Throw a more descriptive error
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Falha ao enviar prontuário: ${errorMessage}`);
  }
}
