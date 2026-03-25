/**
 * Script de diagnóstico detalhado para rastrear URLs de PDFs
 * Usado para identificar problemas na geração e salvamento de URLs
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase para diagnóstico
const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseKey = ((globalThis as any).process?.env?.SUPABASE_SERVICE_KEY) || ((globalThis as any).process?.env?.SUPABASE_ANON_KEY) || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DiagnosticResult {
  medicalRecordId: string;
  patientName: string;
  phone: string;
  sus: string;
  currentFileUrlStorage: string | null;
  storageFiles: any[];
  matchedFile: any | null;
  generatedUrl: string;
  correctUrl: string | null;
  status: 'found' | 'not_found' | 'error';
  error?: string;
}

/**
 * Busca informações detalhadas sobre um atendimento específico
 */
export async function diagnoseMedicalRecord(medicalRecordId: string): Promise<DiagnosticResult> {
  console.log('🔍 [DIAGNOSTIC] Iniciando diagnóstico para medical_record:', medicalRecordId);
  
  try {
    // Buscar o registro médico
    const { data: medicalRecord, error: recordError } = await supabase
      .from('medical_records')
      .select(`
        id,
        file_url_storage,
        patient_id,
        patients!inner(
          id,
          name,
          phone,
          sus
        )
      `)
      .eq('id', medicalRecordId)
      .single();

    if (recordError || !medicalRecord) {
      throw new Error(`Registro médico não encontrado: ${recordError?.message}`);
    }

    const patient = (medicalRecord as any).patients;
    const patientName = patient.name || '';
    const phoneDigits = String(patient.phone || '').replace(/\D/g, '');
    const susDigits = String(patient.sus || '').replace(/\D/g, '');
    const currentFileUrlStorage = medicalRecord.file_url_storage;

    console.log('🔍 [DIAGNOSTIC] Dados do paciente:', {
      name: patientName,
      phone: patient.phone,
      phoneDigits,
      sus: patient.sus,
      susDigits,
      currentFileUrlStorage
    });

    // Buscar arquivos no Storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('documents')
      .list('prontuarios', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      throw new Error(`Erro ao buscar arquivos no Storage: ${storageError.message}`);
    }

    console.log('🔍 [DIAGNOSTIC] Arquivos encontrados no Storage:', storageFiles?.length || 0);

    // Procurar arquivo correspondente
    let matchedFile = null;
    let correctUrl = null;

    if (storageFiles && storageFiles.length > 0) {
      // Primeiro, tentar encontrar pelo medicalRecordId
      matchedFile = storageFiles.find(file => 
        file.name.includes(medicalRecordId) && file.name.endsWith('.pdf')
      );

      if (matchedFile) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(`prontuarios/${matchedFile.name}`);
        
        correctUrl = urlData?.publicUrl || null;
        console.log('🔍 [DIAGNOSTIC] Arquivo encontrado pelo ID:', {
          filename: matchedFile.name,
          correctUrl
        });
      } else {
        // Se não encontrou pelo ID, tentar pelo padrão nome-telefone
        const encodedPatientName = encodeURIComponent(patientName);
        const expectedPattern = `${encodedPatientName}-${phoneDigits || susDigits}`;
        
        matchedFile = storageFiles.find(file => 
          file.name.includes(expectedPattern) && file.name.endsWith('.pdf')
        );

        if (matchedFile) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`prontuarios/${matchedFile.name}`);
          
          correctUrl = urlData?.publicUrl || null;
          console.log('🔍 [DIAGNOSTIC] Arquivo encontrado pelo padrão:', {
            expectedPattern,
            filename: matchedFile.name,
            correctUrl
          });
        }
      }
    }

    // Gerar URL que seria criada pelo sistema atual
    const encodedPatientName = encodeURIComponent(patientName);
    const generatedUrl = `https://vtthxoovjswtrwfrdlha.supabase.co/storage/v1/object/public/documents/prontuarios/${encodedPatientName}-${phoneDigits || susDigits}-${medicalRecordId}.pdf`;

    console.log('🔍 [DIAGNOSTIC] Resumo do diagnóstico:', {
      medicalRecordId,
      patientName,
      currentFileUrlStorage,
      generatedUrl,
      correctUrl,
      matchedFile: matchedFile ? matchedFile.name : null,
      status: correctUrl ? 'found' : 'not_found'
    });

    return {
      medicalRecordId,
      patientName,
      phone: patient.phone || '',
      sus: patient.sus || '',
      currentFileUrlStorage,
      storageFiles: storageFiles || [],
      matchedFile,
      generatedUrl,
      correctUrl,
      status: correctUrl ? 'found' : 'not_found'
    };

  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Erro no diagnóstico:', error);
    return {
      medicalRecordId,
      patientName: '',
      phone: '',
      sus: '',
      currentFileUrlStorage: null,
      storageFiles: [],
      matchedFile: null,
      generatedUrl: '',
      correctUrl: null,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Diagnóstico para múltiplos registros (últimos 10)
 */
export async function diagnoseRecentMedicalRecords(): Promise<DiagnosticResult[]> {
  console.log('🔍 [DIAGNOSTIC] Iniciando diagnóstico para registros recentes...');
  
  try {
    // Buscar registros médicos recentes
    const { data: medicalRecords, error: recordsError } = await supabase
      .from('medical_records')
      .select(`
        id,
        file_url_storage,
        patient_id,
        patients!inner(
          id,
          name,
          phone,
          sus
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recordsError || !medicalRecords) {
      throw new Error(`Erro ao buscar registros: ${recordsError?.message}`);
    }

    console.log(`🔍 [DIAGNOSTIC] Encontrados ${medicalRecords.length} registros para diagnóstico`);

    // Executar diagnóstico para cada registro
    const results: DiagnosticResult[] = [];
    for (const record of medicalRecords) {
      const result = await diagnoseMedicalRecord(record.id);
      results.push(result);
    }

    return results;

  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Erro ao buscar registros recentes:', error);
    return [];
  }
}

/**
 * Função para corrigir URLs incorretas
 */
export async function fixIncorrectUrls(): Promise<void> {
  console.log('🔧 [DIAGNOSTIC] Iniciando correção de URLs incorretas...');
  
  const results = await diagnoseRecentMedicalRecords();
  let fixedCount = 0;

  for (const result of results) {
    if (result.status === 'found' && result.correctUrl && result.currentFileUrlStorage !== result.correctUrl) {
      console.log(`🔧 [DIAGNOSTIC] Corrigindo URL para ${result.medicalRecordId}:`);
      console.log(`  De: ${result.currentFileUrlStorage}`);
      console.log(`  Para: ${result.correctUrl}`);

      try {
        const { error } = await supabase
          .from('medical_records')
          .update({ file_url_storage: result.correctUrl })
          .eq('id', result.medicalRecordId);

        if (error) {
          console.error(`❌ [DIAGNOSTIC] Erro ao atualizar URL: ${error.message}`);
        } else {
          console.log(`✅ [DIAGNOSTIC] URL corrigida com sucesso!`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ [DIAGNOSTIC] Erro ao corrigir URL:`, error);
      }
    }
  }

  console.log(`🔧 [DIAGNOSTIC] Correção concluída. ${fixedCount} URLs corrigidas.`);
}