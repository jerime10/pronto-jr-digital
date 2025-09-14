
import { MedicalRecordResponse } from '@/types/medicalRecordSubmissionTypes';

/**
 * Simple response processor for webhook responses
 */
export function processWebhookResponse(response: any): MedicalRecordResponse {
  if (response.success === false) {
    return {
      success: false,
      error: response.error || response.message || 'Erro desconhecido'
    };
  }

  return {
    success: true,
    message: response.message || 'Prontuário processado com sucesso',
    document: response.document || {
      fileUrl: 'processing',
      documentType: 'prontuario'
    }
  };
}
