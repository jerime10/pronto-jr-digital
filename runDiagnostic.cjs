const { diagnoseRecentMedicalRecords, fixIncorrectUrls } = require('./dist/pdfUrlDiagnostic');

async function runDiagnostics() {
  console.log('🔍 Iniciando diagnóstico de URLs dos prontuários...');
  console.log('='.repeat(60));
  
  try {
    // Primeiro, diagnosticar os registros recentes
    const results = await diagnoseRecentMedicalRecords();
    
    console.log('\n📊 Resumo do diagnóstico:');
    results.forEach(result => {
      console.log(`ID: ${result.medicalRecordId}`);
      console.log(`  Paciente: ${result.patientName}`);
      console.log(`  URL Atual: ${result.currentFileUrlStorage}`);
      console.log(`  URL Correta: ${result.correctUrl}`);
      console.log(`  Status: ${result.status}`);
      console.log('---');
    });
    
    console.log('\n🔧 Corrigindo URLs incorretas...');
    console.log('='.repeat(60));
    
    // Depois, corrigir as URLs que estão erradas
    await fixIncorrectUrls();
    
    console.log('\n✅ Diagnóstico completo!');
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

runDiagnostics();