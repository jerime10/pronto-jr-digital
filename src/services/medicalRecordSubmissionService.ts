
import { buildMedicalRecordFormData } from './formDataBuilder';
import { SubmitMedicalRecordParams, MedicalRecordResponse } from '@/types/medicalRecordSubmissionTypes';
import { storeGeneratedDocument } from './documentStorageService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendToWebhook } from './webhookClient';

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

    // 🔍 DEBUG CRÍTICO: Verificar campo exam_observations NO INÍCIO
    console.log('🔍 [SUBMISSION] ===== DEBUG CAMPO OBSERVAÇÕES =====');
    console.log('🔍 [SUBMISSION] params.medicalRecord.exam_observations:', params.medicalRecord.exam_observations);
    console.log('🔍 [SUBMISSION] exam_observations TYPE:', typeof params.medicalRecord.exam_observations);
    console.log('🔍 [SUBMISSION] exam_observations LENGTH:', params.medicalRecord.exam_observations?.length || 0);
    console.log('🔍 [SUBMISSION] exam_observations IS NULL?', params.medicalRecord.exam_observations === null);
    console.log('🔍 [SUBMISSION] exam_observations IS UNDEFINED?', params.medicalRecord.exam_observations === undefined);
    console.log('🔍 [SUBMISSION] exam_observations IS EMPTY?', params.medicalRecord.exam_observations === '');
    console.log('🔍 [SUBMISSION] ===== FIM DEBUG OBSERVAÇÕES =====');

    // Fetch site settings for logo and professional data
    const siteSettings = await fetchSiteSettings();
    console.log('Configurações do site carregadas:', siteSettings);

    // Get webhook URL from site settings or use default
    const webhookUrl = siteSettings?.medical_record_webhook_url || 'https://n8n.lovableproject.com/webhook/prontuario-jrs';
    console.log('URL do webhook a ser usada:', webhookUrl);
    
    // Log do selectedModelTitle antes de construir o FormData
    console.log('📋 [SUBMISSION] selectedModelTitle recebido:', params.selectedModelTitle);
    console.log('📋 [SUBMISSION] dynamicFields recebidos:', (params as any).dynamicFields);
    
    // 🔍 DEBUG FINAL: Verificar medicalRecord completo ANTES de construir FormData
    console.log('🔍 [FORMDATA-PRE] ===== OBJETO COMPLETO ANTES DO FORMDATA =====');
    console.log('🔍 [FORMDATA-PRE] params.medicalRecord.id:', params.medicalRecord.id);
    console.log('🔍 [FORMDATA-PRE] params.medicalRecord.exam_observations:', params.medicalRecord.exam_observations);
    console.log('🔍 [FORMDATA-PRE] params.medicalRecord.exam_results:', params.medicalRecord.exam_results);
    console.log('🔍 [FORMDATA-PRE] params.medicalRecord completo:', JSON.stringify(params.medicalRecord, null, 2));
    console.log('🔍 [FORMDATA-PRE] ===== FIM OBJETO ANTES DO FORMDATA =====');
    
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
    try {
      response = await sendToWebhook(webhookUrl, formData);
    } catch (fetchError) {
      console.error('Erro na requisição fetch:', fetchError);
      throw new Error(`Erro de conexão com o webhook: ${fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'}`);
    }

    console.log('Status da resposta do webhook:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

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

    // Generate correct storage URL for the document
    const patientName = params.medicalRecord.patient.name;
    const encodedPatientName = encodeURIComponent(patientName);
    const medicalRecordId = params.medicalRecord.id;
    const storageUrl = `https://vtthxoovjswtrwfrdlha.supabase.co/storage/v1/object/public/documents/prontuarios/${encodedPatientName}_${medicalRecordId}.pdf`;
    
    console.log('URL do documento gerada:', storageUrl);

    // Update medical_records table with the file URL
    try {
      console.log('Atualizando medical_records com file_url_storage...');
      
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ file_url_storage: storageUrl })
        .eq('id', medicalRecordId);
      
      if (updateError) {
        console.error('Erro ao atualizar medical_records:', updateError);
        throw updateError;
      }
      
      console.log('URL salva com sucesso na tabela medical_records');
      toast.success('Prontuário enviado e processado com sucesso!');
      
    } catch (storageError) {
      console.error('Erro ao salvar URL na medical_records:', storageError);
      toast.warning('Prontuário enviado, mas houve erro ao salvar a URL. Verifique novamente em alguns instantes.');
      
      // Não falhar a operação por causa deste erro
    }

    return {
      success: true,
      message: 'Prontuário gerado e processado com sucesso!',
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
