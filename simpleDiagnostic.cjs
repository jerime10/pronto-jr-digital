const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjczNTEzNiwiZXhwIjoyMDYyMzExMTM2fQ.OgcYU4MB7TTFWbcGX1Cnakc-rS2kxJ-IkWviOLySOLs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseRecentRecords(limit = 10) {
  console.log('🔍 Iniciando diagnóstico para registros recentes...');
  
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
      .limit(limit);

    if (recordsError || !medicalRecords) {
      throw new Error(`Erro ao buscar registros: ${recordsError?.message}`);
    }

    console.log(`🔍 Encontrados ${medicalRecords.length} registros para diagnóstico`);

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

    console.log(`🔍 Encontrados ${storageFiles?.length || 0} arquivos no Storage`);

    // Analisar cada registro
    for (const record of medicalRecords) {
      const patient = record.patients;
      const patientName = patient.name || '';
      const phoneDigits = String(patient.phone || '').replace(/\D/g, '');
      const susDigits = String(patient.sus || '').replace(/\D/g, '');
      const currentFileUrlStorage = record.file_url_storage;

      console.log('\n' + '='.repeat(60));
      console.log(`📋 Registro: ${record.id}`);
      console.log(`👤 Paciente: ${patientName}`);
      console.log(`📱 Telefone: ${patient.phone} (${phoneDigits})`);
      console.log(`🆔 SUS: ${patient.sus} (${susDigits})`);
      console.log(`🔗 URL Atual: ${currentFileUrlStorage}`);

      // Procurar arquivo correspondente no Storage
      let matchedFile = null;
      let correctUrl = null;

      if (storageFiles && storageFiles.length > 0) {
        // Primeiro, tentar encontrar pelo medicalRecordId
        matchedFile = storageFiles.find(file => 
          file.name.includes(record.id) && file.name.endsWith('.pdf')
        );

        if (matchedFile) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`prontuarios/${matchedFile.name}`);
          
          correctUrl = urlData?.publicUrl || null;
          console.log(`✅ Arquivo encontrado pelo ID: ${matchedFile.name}`);
          console.log(`🔗 URL Correta: ${correctUrl}`);
        } else {
          console.log(`❌ Arquivo não encontrado pelo ID: ${record.id}`);
        }
      }

      // Comparar URLs
      if (correctUrl && currentFileUrlStorage !== correctUrl) {
        console.log(`⚠️  URL INCORRETA DETECTADA!`);
        console.log(`   Deve ser: ${correctUrl}`);
        console.log(`   Atual é:  ${currentFileUrlStorage}`);
        
        // Corrigir URL
        console.log(`🔧 Corrigindo URL...`);
        const { error: updateError } = await supabase
          .from('medical_records')
          .update({ file_url_storage: correctUrl })
          .eq('id', record.id);

        if (updateError) {
          console.log(`❌ Erro ao corrigir: ${updateError.message}`);
        } else {
          console.log(`✅ URL corrigida com sucesso!`);
        }
      } else if (correctUrl) {
        console.log(`✅ URL está correta!`);
      } else {
        console.log(`⚠️  Arquivo não encontrado no Storage`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseRecentRecords(10).then(() => {
  console.log('\n✅ Diagnóstico completo!');
}).catch(console.error);