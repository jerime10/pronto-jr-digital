
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
  formData.append('examObservations', params.medicalRecord.exam_observations || '');
  formData.append('examResults', params.medicalRecord.exam_results || '');
  
  // Selected model title for exam results
  formData.append('selectedModelTitle', params.selectedModelTitle || '');
  
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
    attendance_start_at: params.medicalRecord.attendance_start_at || '',
    attendance_end_at: params.medicalRecord.attendance_end_at || '',
    created_at: params.medicalRecord.created_at || new Date().toISOString(),
    updated_at: params.medicalRecord.updated_at || new Date().toISOString()
  };
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
  
  console.log('FormData construído com sucesso');
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
