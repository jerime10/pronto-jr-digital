
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

    // Determinar a URL correta do documento
    const medicalRecordId = params.medicalRecord.id;
    const patientName = params.medicalRecord.patient.name || '';
    const encodedPatientName = encodeURIComponent(patientName);
    const phoneDigits = String(params.medicalRecord.patient.phone || '').replace(/\D/g, '');
    const susDigits = String(params.medicalRecord.patient.sus || '').replace(/\D/g, '');
    
    // Preferir URL retornada pelo webhook quando disponível
    const webhookFileUrl = (webhookData && (
      (webhookData as any).fileUrl ||
      (webhookData as any).file_url ||
      (webhookData as any).publicUrl ||
      (webhookData as any).url
    )) as string | undefined;
    
    // Fallback para padrão real do Storage (ex.: SAMILA DOS SANTOS RODRIGUES-91985556733-6e72f2db-bb7d-4c58-b094-9399b7b04c38.pdf)
    const fallbackFilename = `${encodedPatientName}-${phoneDigits || susDigits}-${medicalRecordId}.pdf`;
    const fallbackUrl = `https://vtthxoovjswtrwfrdlha.supabase.co/storage/v1/object/public/documents/prontuarios/${fallbackFilename}`;
    
    // Se o webhook não retornou URL, tentar obter a URL real do arquivo no Storage
    let storageUrl = webhookFileUrl && typeof webhookFileUrl === 'string' && webhookFileUrl.includes('/storage/')
      ? webhookFileUrl
      : fallbackUrl;
    
    // Se não há URL do webhook, tentar buscar o arquivo real no Storage
    if (!webhookFileUrl) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('documents')
          .list('prontuarios', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (!listError && files && files.length > 0) {
          // Procurar arquivo que contenha o medicalRecordId no nome
          const foundFile = files.find(file => 
            file.name.includes(medicalRecordId) && file.name.endsWith('.pdf')
          );
          
          if (foundFile) {
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(`prontuarios/${foundFile.name}`);
            
            if (urlData?.publicUrl) {
              storageUrl = urlData.publicUrl;
              console.log('URL real do arquivo encontrada no Storage:', storageUrl);
            }
          }
        }
      } catch (storageError) {
        console.error('Erro ao buscar arquivo no Storage:', storageError);
      }
    }
    
    console.log('URL do documento definida para persistência:', storageUrl);

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
      
      // Update exam_observations with processed observacoes if available
      if (webhookData?.individual_fields?.observacoes) {
        console.log('🔄 [OBSERVACOES] Atualizando exam_observations com dados processados do N8N...');
        console.log('🔄 [OBSERVACOES] Valor original:', params.medicalRecord.exam_observations);
        console.log('🔄 [OBSERVACOES] Valor processado:', webhookData.individual_fields.observacoes);
        
        try {
          const { error: observacoesUpdateError } = await supabase
            .from('medical_records')
            .update({ exam_observations: webhookData.individual_fields.observacoes })
            .eq('id', medicalRecordId);
          
          if (observacoesUpdateError) {
            console.error('❌ [OBSERVACOES] Erro ao atualizar exam_observations:', observacoesUpdateError);
          } else {
            console.log('✅ [OBSERVACOES] exam_observations atualizado com sucesso!');
          }
        } catch (observacoesError) {
          console.error('❌ [OBSERVACOES] Erro ao processar atualização de observações:', observacoesError);
        }
      } else {
        console.log('⚠️ [OBSERVACOES] Nenhuma observação processada encontrada na resposta do webhook');
        console.log('⚠️ [OBSERVACOES] webhookData:', webhookData);
        console.log('⚠️ [OBSERVACOES] individual_fields:', webhookData?.individual_fields);
      }
      
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
