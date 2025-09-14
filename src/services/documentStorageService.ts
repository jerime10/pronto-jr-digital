
import { supabase } from '@/integrations/supabase/client';
import { DocumentStorageParams } from '@/types/medicalRecordSubmissionTypes';

/**
 * Stores generated document in the database
 */
export async function storeGeneratedDocument(params: DocumentStorageParams) {
  try {
    console.log('Armazenando documento na tabela generated_documents:', {
      title: params.title,
      documentType: params.documentType,
      patientId: params.patientId,
      professionalId: params.professionalId,
      medicalRecordId: params.medicalRecordId,
      fileUrl: params.fileUrl
    });
    
    // Verificar se a URL está correta (deve ser do Supabase Storage ou 'processing')
    let correctUrl = params.fileUrl;
    if (params.fileUrl !== 'processing' && !params.fileUrl.includes('supabase.co')) {
      correctUrl = `https://vtthxoovjswtrwfrdlha.supabase.co/storage/v1/object/public/documents/prontuarios/${encodeURIComponent(params.title)}.pdf`;
    }
    
    console.log('URL final para armazenamento:', correctUrl);
    
    // Insert document into generated_documents table
    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        title: params.title,
        file_url: correctUrl,
        document_type: params.documentType,
        patient_id: params.patientId,
        professional_id: params.professionalId,
        medical_record_id: params.medicalRecordId,
        attendance_start_at: params.attendanceStartAt,
        attendance_end_at: params.attendanceEndAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir documento na tabela generated_documents:', error);
      throw new Error(`Erro ao salvar documento: ${error.message}`);
    }

    if (!data) {
      throw new Error('Falha ao inserir documento - nenhum dado retornado');
    }
    
    console.log('Documento salvo com sucesso na tabela generated_documents:', data);
    return data;
  } catch (error) {
    console.error('Falha ao armazenar documento gerado:', error);
    throw error;
  }
}
