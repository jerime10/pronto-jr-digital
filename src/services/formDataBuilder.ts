
import { FormDataBuilderParams } from '@/types/medicalRecordSubmissionTypes';

/**
 * Builds FormData for medical record submission with complete information
 */
export function buildMedicalRecordFormData(params: FormDataBuilderParams): FormData {
  const formData = new FormData();
  
  console.log('Construindo FormData com parâmetros:', params);
  
  // Basic identifiers
  formData.append('attendanceId', params.attendanceId);
  formData.append('recordId', params.medicalRecord.id);
  formData.append('additionalTimestamp', String(params.additionalTimestamp));
  formData.append('action', 'generate_medical_record');
  
  // Complete patient data
  const patient = params.medicalRecord.patient;
  formData.append('patientName', patient.name || '');
  formData.append('patientSus', patient.sus || '');
  formData.append('patientPhone', patient.phone || '');
  formData.append('patientAddress', patient.address || '');
  formData.append('patientGender', patient.gender || '');
  formData.append('patientDateOfBirth', patient.date_of_birth || '');
  
  const patientData = {
    name: patient.name || '',
    sus: patient.sus || '',
    phone: patient.phone || '',
    address: patient.address || '',
    gender: patient.gender || '',
    date_of_birth: patient.date_of_birth || ''
  };
  formData.append('patientData', JSON.stringify(patientData));
  
  // Complete medical record data
  formData.append('mainComplaint', params.medicalRecord.main_complaint || '');
  formData.append('history', params.medicalRecord.history || '');
  formData.append('allergies', params.medicalRecord.allergies || '');
  formData.append('evolution', params.medicalRecord.evolution || '');
  formData.append('prescription', params.medicalRecord.custom_prescription || '');
  
  // 🔍 DEBUG CRÍTICO: Observações dos Exames - MÚLTIPLAS VERSÕES
  console.log('🔍 [OBSERVAÇÕES] ===== DEBUG CAMPO OBSERVAÇÕES =====');
  console.log('🔍 [OBSERVAÇÕES] exam_observations VALOR:', params.medicalRecord.exam_observations);
  console.log('🔍 [OBSERVAÇÕES] exam_observations TYPE:', typeof params.medicalRecord.exam_observations);
  console.log('🔍 [OBSERVAÇÕES] exam_observations LENGTH:', params.medicalRecord.exam_observations?.length || 0);
  console.log('🔍 [OBSERVAÇÕES] exam_observations IS NULL?', params.medicalRecord.exam_observations === null);
  console.log('🔍 [OBSERVAÇÕES] exam_observations IS UNDEFINED?', params.medicalRecord.exam_observations === undefined);
  console.log('🔍 [OBSERVAÇÕES] exam_observations IS EMPTY?', params.medicalRecord.exam_observations === '');
  console.log('🔍 [OBSERVAÇÕES] dynamicFields:', params.dynamicFields);
  console.log('🔍 [OBSERVAÇÕES] dynamicFields.observacoes:', params.dynamicFields?.observacoes);
  
  // ⚠️ CRITICAL FIX: Se exam_observations estiver vazio, tentar usar campo dinâmico
  let observacoesValue = params.medicalRecord.exam_observations || '';
  
  // Se vazio, verificar se existe no dynamicFields
  if (!observacoesValue && params.dynamicFields?.observacoes) {
    console.log('🔧 [AUTO-FIX] exam_observations vazio, usando dynamicFields.observacoes');
    observacoesValue = params.dynamicFields.observacoes;
  }
  
  // Se ainda estiver vazio, usar placeholder para debug no n8n
  if (!observacoesValue) {
    observacoesValue = '[CAMPO_OBSERVACOES_VAZIO_OU_NAO_PREENCHIDO]';
  }
  
  const resultadosValue = params.medicalRecord.exam_results || '';
  
  console.log('🔍 [OBSERVAÇÕES] Valor processado para envio:', observacoesValue);
  console.log('🔍 [OBSERVAÇÕES] Valor é o placeholder?', observacoesValue === '[CAMPO_OBSERVACOES_VAZIO_OU_NAO_PREENCHIDO]');
  console.log('🔍 [OBSERVAÇÕES] Adicionando em múltiplos formatos...');
  
  // Observações dos Exames - 5 formatos diferentes
  formData.append('examObservations', observacoesValue);
  formData.append('exam_observations', observacoesValue);
  formData.append('observacoesExames', observacoesValue);
  formData.append('observacoes', observacoesValue);
  formData.append('exam_obs', observacoesValue);
  
  // Resultados dos Exames - 5 formatos diferentes
  formData.append('examResults', resultadosValue);
  formData.append('exam_results', resultadosValue);
  formData.append('resultadosExames', resultadosValue);
  formData.append('resultados', resultadosValue);
  formData.append('exam_res', resultadosValue);
  
  console.log('✅ [OBSERVAÇÕES] Campo observações adicionado em 5 formatos diferentes');
  console.log('✅ [OBSERVAÇÕES] Campo resultados adicionado em 5 formatos diferentes');
  console.log('🔍 [OBSERVAÇÕES] ===== FIM DEBUG OBSERVAÇÕES =====');
  
  // Selected model title for exam results - MÚLTIPLAS VERSÕES PARA COMPATIBILIDADE
  const modelTitle = params.selectedModelTitle || '';
  
  console.log('📋 [FormData] ===== ADICIONANDO TÍTULO DO MODELO =====');
  console.log('📋 [FormData] selectedModelTitle recebido:', params.selectedModelTitle);
  console.log('📋 [FormData] modelTitle processado:', modelTitle);
  console.log('📋 [FormData] modelTitle LENGTH:', modelTitle.length);
  console.log('📋 [FormData] modelTitle VAZIO?', modelTitle === '');
  
  formData.append('selectedModelTitle', modelTitle);
  formData.append('exam_model_title', modelTitle);
  formData.append('examModelTitle', modelTitle);
  formData.append('modelTitle', modelTitle);
  formData.append('titulo_modelo', modelTitle);
  
  console.log('✅ [FormData] Título do modelo adicionado em 5 formatos diferentes');
  console.log('📋 [FormData] ===== FIM ADIÇÃO TÍTULO DO MODELO =====');
  
  // Complete medical record object
  const medicalRecordData = {
    id: params.medicalRecord.id,
    main_complaint: params.medicalRecord.main_complaint || '',
    history: params.medicalRecord.history || '',
    allergies: params.medicalRecord.allergies || '',
    evolution: params.medicalRecord.evolution || '',
    custom_prescription: params.medicalRecord.custom_prescription || '',
    exam_observations: params.medicalRecord.exam_observations || '',
    exam_results: params.medicalRecord.exam_results || '',
    selected_model_title: params.selectedModelTitle || '',
    exam_model_title: params.selectedModelTitle || '',
    attendance_start_at: params.medicalRecord.attendance_start_at || '',
    attendance_end_at: params.medicalRecord.attendance_end_at || '',
    created_at: params.medicalRecord.created_at || new Date().toISOString(),
    updated_at: params.medicalRecord.updated_at || new Date().toISOString()
  };
  
  console.log('🔍 [MEDICAL_RECORD_DATA] exam_observations no objeto:', medicalRecordData.exam_observations);
  console.log('🔍 [MEDICAL_RECORD_DATA] exam_observations length:', medicalRecordData.exam_observations?.length || 0);
  
  formData.append('medicalRecordData', JSON.stringify(medicalRecordData));
  
  // Exam requests with proper formatting
  const examRequests = Array.isArray(params.medicalRecord.exam_requests) 
    ? params.medicalRecord.exam_requests 
    : params.medicalRecord.exam_requests ? [String(params.medicalRecord.exam_requests)] : [];
  
  formData.append('examRequests', examRequests.join(', '));
  formData.append('examRequestsArray', JSON.stringify(examRequests));
  
  // Attendance timing
  formData.append('attendanceStartAt', params.medicalRecord.attendance_start_at || '');
  formData.append('attendanceEndAt', params.medicalRecord.attendance_end_at || '');
  
  // Images with complete information
  if (params.images && params.images.length > 0) {
    formData.append('imagesCount', String(params.images.length));
    
    params.images.forEach((image, index) => {
      formData.append(`image_${index}_base64`, image.base64);
      formData.append(`image_${index}_description`, image.description);
      formData.append(`image_${index}_filename`, image.filename);
      formData.append(`image_${index}_size`, String(image.size));
      formData.append(`image_${index}_type`, image.type);
    });
    
    formData.append('imagesData', JSON.stringify(params.images.map(img => ({
      description: img.description,
      filename: img.filename,
      size: img.size,
      type: img.type,
      base64: img.base64
    }))));
  } else {
    formData.append('imagesCount', '0');
    formData.append('imagesData', '[]');
  }
  
  // Assets (logo and signature) with complete information
  const { assets } = params;
  
  if (assets.logoData) {
    formData.append('logoBase64', assets.logoData);
    formData.append('logoFilename', 'logo.png');
    formData.append('logoSize', String((assets.logoData.length * 3) / 4));
    formData.append('logoType', 'image/png');
    formData.append('hasLogo', 'true');
  } else {
    formData.append('hasLogo', 'false');
  }

  if (assets.signatureData) {
    formData.append('signatureBase64', assets.signatureData);
    formData.append('signatureFilename', 'assinatura.png');
    formData.append('signatureSize', String((assets.signatureData.length * 3) / 4));
    formData.append('signatureType', 'image/png');
    formData.append('hasSignature', 'true');
  } else {
    formData.append('hasSignature', 'false');
  }
  
  // Professional signature information - GARANTINDO QUE SEJAM ENVIADAS
  const professionalName = assets.signatureProfessionalName || 'JERIME REGO SOARES';
  const professionalTitle = assets.signatureProfessionalTitle || 'ENFERMEIRO ESPECIALISTA';
  const professionalRegistry = assets.signatureProfessionalRegistry || 'COREN - 502061-ENF';
  
  formData.append('signatureProfessionalName', professionalName);
  formData.append('signatureProfessionalTitle', professionalTitle);  
  formData.append('signatureProfessionalRegistry', professionalRegistry);
  
  // Dados adicionais do profissional para garantir compatibilidade
  formData.append('professionalName', professionalName);
  formData.append('professionalTitle', professionalTitle);
  formData.append('professionalRegistry', professionalRegistry);

  // Complete assets object for n8n processing
  formData.append('assetsData', JSON.stringify({
    logo: assets.logoData ? {
      base64: assets.logoData,
      filename: 'logo.png',
      size: (assets.logoData.length * 3) / 4,
      type: 'image/png'
    } : null,
    signature: assets.signatureData ? {
      base64: assets.signatureData,
      filename: 'assinatura.png',
      size: (assets.signatureData.length * 3) / 4,
      type: 'image/png',
      professional: {
        name: professionalName,
        title: professionalTitle,
        registry: professionalRegistry
      }
    } : null
  }));
  
  // URL generation helper data for n8n
  formData.append('urlGenerationData', JSON.stringify({
    patientName: params.medicalRecord.patient.name,
    patientSus: params.medicalRecord.patient.sus,
    attendanceId: params.attendanceId,
    timestamp: params.additionalTimestamp,
    recordId: params.medicalRecord.id
  }));
  
  // Metadata for n8n processing
  formData.append('timestamp', new Date().toISOString());
  formData.append('source', 'consultorio_jrs');
  formData.append('version', '1.0');
  
  // Request that n8n returns the actual file URL in the response
  formData.append('returnFileUrl', 'true');
  formData.append('documentType', 'prontuario');
  
  // Adicionar campos dinâmicos separados
  console.log('📋 [FormData] ===== ADICIONANDO CAMPOS DINÂMICOS =====');
  console.log('📋 [FormData] dynamicFields recebidos:', params.dynamicFields);
  console.log('📋 [FormData] Quantidade de campos:', params.dynamicFields ? Object.keys(params.dynamicFields).length : 0);
  
  if (params.dynamicFields && Object.keys(params.dynamicFields).length > 0) {
    console.log('✅ [FormData] Adicionando campos dinâmicos separados...');
    
    // Adicionar cada campo dinâmico como uma variável individual
    Object.entries(params.dynamicFields).forEach(([key, value]) => {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitizar nome do campo
      const fieldName = `dynamic_field_${sanitizedKey}`;
      formData.append(fieldName, value || '');
      console.log(`  ✅ Campo adicionado: ${fieldName} = ${value?.substring(0, 50)}...`);
    });
    
    // Também manter o objeto completo para compatibilidade
    formData.append('dynamicFields', JSON.stringify(params.dynamicFields));
    formData.append('dynamicFieldsCount', String(Object.keys(params.dynamicFields).length));
    console.log('✅ [FormData] Total de campos dinâmicos adicionados:', Object.keys(params.dynamicFields).length);
  } else {
    console.log('⚠️ [FormData] Nenhum campo dinâmico para adicionar');
    formData.append('dynamicFields', '{}');
    formData.append('dynamicFieldsCount', '0');
  }
  
  console.log('📋 [FormData] ===== FIM ADIÇÃO CAMPOS DINÂMICOS =====');
  
  console.log('FormData construído com sucesso');
  console.log('📋 [FormData] ===== RESUMO FINAL DO FORMDATA =====');
  console.log('📋 [FormData] selectedModelTitle:', params.selectedModelTitle);
  console.log('📋 [FormData] dynamicFields:', params.dynamicFields ? Object.keys(params.dynamicFields).length : 0);
  
  // 🔍 VERIFICAÇÃO FINAL: Confirmar que os campos de observações estão no FormData
  console.log('');
  console.log('📋 [FormData] ===== VERIFICAÇÃO FINAL - OBSERVAÇÕES =====');
  console.log('📋 [FormData] examObservations no FormData?', formData.has('examObservations'));
  console.log('📋 [FormData] examObservations valor:', formData.get('examObservations'));
  console.log('📋 [FormData] exam_observations no FormData?', formData.has('exam_observations'));
  console.log('📋 [FormData] exam_observations valor:', formData.get('exam_observations'));
  console.log('📋 [FormData] observacoesExames no FormData?', formData.has('observacoesExames'));
  console.log('📋 [FormData] observacoesExames valor:', formData.get('observacoesExames'));
  console.log('📋 [FormData] observacoes no FormData?', formData.has('observacoes'));
  console.log('📋 [FormData] observacoes valor:', formData.get('observacoes'));
  console.log('📋 [FormData] exam_obs no FormData?', formData.has('exam_obs'));
  console.log('📋 [FormData] exam_obs valor:', formData.get('exam_obs'));
  console.log('📋 [FormData] ===== FIM VERIFICAÇÃO FINAL =====');
  
  return formData;
}

/**
 * Logs FormData contents for debugging (without showing full base64)
 */
export function logFormData(formData: FormData): void {
  console.log('Enviando dados como FormData para n8n:');
  for (const [key, value] of (formData as any).entries()) {
    if (key.includes('base64') || key.includes('Base64')) {
      console.log(`${key}: [BASE64 DATA - ${String(value).length} characters]`);
    } else {
      console.log(`${key}:`, value);
    }
  }
}
