// Script de teste para verificar se os campos de autocompletar estão funcionando
// Este script deve ser executado no console do navegador (F12)

console.log('🔍 Iniciando teste de autocompletar...');

// Função para testar se os campos aceitam texto
function testarCamposTexto() {
  console.log('📝 Testando campos de texto...');
  
  // Procurar por campos de entrada
  const inputs = document.querySelectorAll('input[type="text"], textarea');
  console.log(`📊 Encontrados ${inputs.length} campos de entrada`);
  
  inputs.forEach((input, index) => {
    console.log(`Campo ${index + 1}:`, {
      tag: input.tagName,
      type: input.type,
      placeholder: input.placeholder,
      disabled: input.disabled,
      value: input.value.substring(0, 50) + (input.value.length > 50 ? '...' : '')
    });
    
    // Testar se o campo aceita digitação
    const eventoInput = new Event('input', { bubbles: true });
    const valorTeste = 'teste';
    const valorOriginal = input.value;
    
    input.value = valorTeste;
    input.dispatchEvent(eventoInput);
    
    if (input.value === valorTeste) {
      console.log(`✅ Campo ${index + 1} aceita digitação`);
      input.value = valorOriginal; // Restaurar valor original
    } else {
      console.log(`❌ Campo ${index + 1} NÃO aceita digitação`);
    }
  });
}

// Função para testar dropdowns
function testarDropdowns() {
  console.log('🎯 Testando dropdowns...');
  
  // Procurar por elementos que podem ser dropdowns
  const dropdowns = document.querySelectorAll('[class*="dropdown"], [class*="suggest"], [role="listbox"]');
  console.log(`📊 Encontrados ${dropdowns.length} possíveis dropdowns`);
  
  dropdowns.forEach((dropdown, index) => {
    console.log(`Dropdown ${index + 1}:`, {
      className: dropdown.className,
      visible: dropdown.offsetParent !== null
    });
  });
}

// Função para testar comportamento de foco
function testarFoco() {
  console.log('🔍 Testando comportamento de foco...');
  
  const inputs = document.querySelectorAll('input[type="text"], textarea');
  
  inputs.forEach((input, index) => {
    input.addEventListener('focus', () => {
      console.log(`🎯 Campo ${index + 1} recebeu foco`);
    });
    
    input.addEventListener('blur', () => {
      console.log(`❌ Campo ${index + 1} perdeu foco`);
    });
  });
}

// Executar testes
testarCamposTexto();
testarDropdowns();
testarFoco();

console.log('✅ Script de teste carregado. Interaja com os campos para ver os resultados.');
console.log('💡 Dica: Tente digitar nos campos de "Antecedentes" e "Alergias" para verificar se estão funcionando.');