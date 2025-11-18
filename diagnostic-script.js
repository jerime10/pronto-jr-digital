// SCRIPT DE DIAGNÓSTICO DETALHADO - Executar no console do navegador (F12)
// Este script irá rastrear exatamente onde está o bloqueio

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO SISTEMA');
console.log('================================================');

// 1. VERIFICAR SE OS COMPONENTES ESTÃO RENDERIZADOS
console.log('\n📋 1. VERIFICANDO COMPONENTES RENDERIZADOS');
console.log('================================================');

// Procurar por FieldAutocompleteMulti
const autocompleteComponents = document.querySelectorAll('[class*="field-autocomplete"], .relative');
console.log(`✅ Encontrados ${autocompleteComponents.length} possíveis componentes de autocomplete`);

autocompleteComponents.forEach((comp, index) => {
  console.log(`\n📍 Componente ${index + 1}:`);
  console.log('  - Classe:', comp.className);
  console.log('  - Visível:', comp.offsetParent !== null);
  console.log('  - HTML:', comp.outerHTML.substring(0, 200) + '...');
});

// 2. VERIFICAR INPUTS E TEXTAREAS
console.log('\n\n⌨️  2. VERIFICANDO CAMPOS DE ENTRADA');
console.log('================================================');

const allInputs = document.querySelectorAll('input[type="text"], textarea');
console.log(`✅ Encontrados ${allInputs.length} campos de entrada`);

allInputs.forEach((input, index) => {
  const label = input.closest('label') || input.previousElementSibling || input.parentElement;
  console.log(`\n📝 Campo ${index + 1}:`);
  console.log('  - Tipo:', input.tagName, input.type);
  console.log('  - Placeholder:', input.placeholder);
  console.log('  - Valor atual:', input.value.substring(0, 50) + (input.value.length > 50 ? '...' : ''));
  console.log('  - Desabilitado:', input.disabled);
  console.log('  - Readonly:', input.readOnly);
  console.log('  - Label próximo:', label ? label.textContent?.trim() : 'Nenhum');
  
  // Testar se o campo aceita entrada
  const valorOriginal = input.value;
  input.value = 'TESTE_DIAGNOSTICO';
  const evento = new Event('input', { bubbles: true });
  input.dispatchEvent(evento);
  
  if (input.value === 'TESTE_DIAGNOSTICO') {
    console.log('  - ✅ ACEITA ENTRADA (teste bem-sucedido)');
    input.value = valorOriginal;
  } else {
    console.log('  - ❌ BLOQUEIA ENTRADA (teste falhou)');
  }
});

// 3. VERIFICAR EVENT LISTENERS
console.log('\n\n🎯 3. VERIFICANDO EVENT LISTENERS');
console.log('================================================');

allInputs.forEach((input, index) => {
  const listeners = getEventListeners(input);
  console.log(`\n🔍 Campo ${index + 1}:`);
  console.log('  - Event listeners:', Object.keys(listeners));
  console.log('  - Quantidade de listeners:', Object.keys(listeners).length);
  
  Object.keys(listeners).forEach(eventType => {
    console.log(`  - ${eventType}: ${listeners[eventType].length} listeners`);
  });
});

// 4. VERIFICAR SE HÁ ERROS NO CONSOLE
console.log('\n\n⚠️  4. VERIFICANDO ERROS RECENTES');
console.log('================================================');

// Capturar erros futuros
const erros = [];
const consoleErroOriginal = console.error;
console.error = function(...args) {
  erros.push(args);
  consoleErroOriginal.apply(console, args);
};

console.log('Monitorando erros por 5 segundos...');
setTimeout(() => {
  console.log(`✅ Capturados ${erros.length} erros:`);
  erros.forEach((erro, i) => {
    console.log(`  Erro ${i + 1}:`, erro);
  });
}, 5000);

// 5. TESTAR COMPONENTES ESPECÍFICOS
console.log('\n\n🔧 5. TESTANDO COMPONENTES ESPECÍFICOS');
console.log('================================================');

// Testar FieldAutocompleteMulti especificamente
function testarAutocomplete() {
  console.log('\n🧪 Testando FieldAutocompleteMulti...');
  
  // Procurar inputs dentro de containers de autocomplete
  const autocompleteContainers = document.querySelectorAll('.relative, [class*="autocomplete"]');
  
  autocompleteContainers.forEach((container, index) => {
    const input = container.querySelector('input[type="text"]');
    if (input) {
      console.log(`\n📍 Container ${index + 1}:`);
      console.log('  - Input encontrado:', input.placeholder || 'sem placeholder');
      
      // Simular digitação
      input.focus();
      input.value = 'dor';
      const eventoInput = new Event('input', { bubbles: true });
      input.dispatchEvent(eventoInput);
      
      console.log('  - Valor após simulação:', input.value);
      console.log('  - Focado:', document.activeElement === input);
      
      // Verificar se aparecem sugestões
      setTimeout(() => {
        const sugestoes = container.querySelectorAll('[class*="suggest"], .bg-popover');
        console.log('  - Sugestões encontradas:', sugestoes.length);
        
        if (sugestoes.length > 0) {
          console.log('  - ✅ Autocomplete está respondendo');
        } else {
          console.log('  - ❌ Autocomplete não está respondendo');
        }
      }, 1000);
    }
  });
}

// Executar teste
setTimeout(testarAutocomplete, 1000);

// 6. VERIFICAR ESTADO GLOBAL
console.log('\n\n🌍 6. VERIFICANDO ESTADO GLOBAL');
console.log('================================================');

// Verificar se há alguma variável global que possa estar interferindo
console.log('Verificando window...');
console.log('  - React:', !!window.React);
console.log('  - ReactDOM:', !!window.ReactDOM);

// Verificar se há algum erro de CORS ou network
console.log('\nVerificando network requests...');
fetch('/api/health').then(() => {
  console.log('  - ✅ API está respondendo');
}).catch(() => {
  console.log('  - ❌ API não está respondendo');
});

console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
console.log('Aguarde os resultados dos testes acima...');

// INSTRUÇÕES PARA O USUÁRIO
console.log('\n\n📖 INSTRUÇÕES:');
console.log('1. Copie todo este script (Ctrl+A, Ctrl+C)');
console.log('2. Abra o console do navegador (F12)');
console.log('3. Cole o script e pressione Enter');
console.log('4. Aguarde os resultados e me envie os logs');
console.log('5. Especialmente importante: os logs dos testes de autocomplete');