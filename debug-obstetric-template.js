// Script para debugar o template obstétrico
// Execute no console do navegador

function debugObstetricTemplate() {
  console.log('🔍 DEBUGANDO TEMPLATE OBSTÉTRICO...');
  
  // Aguardar um pouco para garantir que a página carregou
  setTimeout(() => {
    console.log('📋 Instruções:');
    console.log('1. Vá para Exames → Resultados');
    console.log('2. Selecione "ULTRASSONOGRAFIA OBSTÉTRICA 2º E 3º TRI"');
    console.log('3. Observe os logs que aparecem');
    console.log('4. Procure por logs com [OBSTÉTRICO-SITUACAO-IG] e [UPDATE-OBSTÉTRICO]');
    console.log('5. Verifique se há uma linha que contém tanto SITUAÇÃO quanto IG');
    
    // Tentar encontrar o dropdown de modelos
    const dropdown = document.querySelector('select');
    if (dropdown) {
      console.log('✅ Dropdown encontrado:', dropdown);
      
      // Listar opções disponíveis
      const options = Array.from(dropdown.options);
      console.log('📋 Modelos disponíveis:');
      options.forEach((option, idx) => {
        console.log(`  ${idx}: ${option.text} (value: ${option.value})`);
      });
      
      // Procurar pelo modelo obstétrico
      const obstetricOption = options.find(opt => opt.text.includes('OBSTÉTRICA'));
      if (obstetricOption) {
        console.log('🎯 Modelo obstétrico encontrado:', obstetricOption.text);
        console.log('💡 Para selecionar automaticamente, execute:');
        console.log(`dropdown.value = "${obstetricOption.value}"; dropdown.dispatchEvent(new Event('change'));`);
      }
    } else {
      console.log('❌ Dropdown não encontrado. Certifique-se de estar na página de Resultados de Exames');
    }
  }, 1000);
}

// Executar automaticamente
debugObstetricTemplate();