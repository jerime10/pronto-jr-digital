// Script para reproduzir e testar o erro de foreign key
// Execute este script no console do navegador na página de atendimento

console.log('🧪 INICIANDO TESTE DE FOREIGN KEY ERROR');

// Função para aguardar um elemento aparecer
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
    }, timeout);
  });
}

// Função para simular clique
function simulateClick(element) {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

// Função para simular digitação
function simulateTyping(element, text) {
  element.focus();
  element.value = text;
  
  // Disparar eventos de input
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
}

// Função principal de teste
async function testForeignKeyError() {
  try {
    console.log('📋 Passo 1: Aguardando página carregar...');
    
    // Aguardar campo de busca de paciente
    const searchInput = await waitForElement('input[placeholder*="paciente" i], input[placeholder*="buscar" i]');
    console.log('✅ Campo de busca encontrado:', searchInput);
    
    // Simular busca por paciente
    console.log('📋 Passo 2: Buscando paciente...');
    simulateClick(searchInput);
    simulateTyping(searchInput, 'ANTONIO');
    
    // Aguardar resultados da busca
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar selecionar primeiro resultado
    const firstResult = document.querySelector('[data-testid="patient-result"], .patient-item, .search-result');
    if (firstResult) {
      console.log('📋 Passo 3: Selecionando paciente...');
      simulateClick(firstResult);
    } else {
      console.log('⚠️ Nenhum resultado de busca encontrado, tentando criar paciente temporário...');
      
      // Simular criação de paciente temporário
      const tempPatient = {
        id: `temp-test-${Date.now()}`,
        name: 'PACIENTE TESTE TEMPORÁRIO',
        sus: '12345678901'
      };
      
      // Tentar definir paciente via React state (se disponível)
      if (window.React && window.ReactDOM) {
        console.log('🔧 Tentando definir paciente via React...');
        // Aqui tentaríamos acessar o state do React, mas é complexo
      }
    }
    
    // Aguardar seleção
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Preencher queixa principal
    console.log('📋 Passo 4: Preenchendo queixa principal...');
    const queixaInput = await waitForElement('textarea[placeholder*="queixa" i], input[placeholder*="queixa" i]');
    simulateTyping(queixaInput, 'Teste de queixa principal para reproduzir erro de foreign key');
    
    // Aguardar preenchimento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Tentar salvar rascunho
    console.log('📋 Passo 5: Tentando salvar rascunho...');
    const saveButton = await waitForElement('button[title*="salvar" i], button:contains("Salvar"), [data-testid="save-draft"]');
    
    if (saveButton) {
      console.log('🔍 Monitorando console para logs de debug...');
      
      // Capturar logs do console
      const originalLog = console.log;
      const originalError = console.error;
      const logs = [];
      
      console.log = (...args) => {
        logs.push({ type: 'log', args });
        originalLog.apply(console, args);
      };
      
      console.error = (...args) => {
        logs.push({ type: 'error', args });
        originalError.apply(console, args);
      };
      
      // Clicar no botão salvar
      simulateClick(saveButton);
      
      // Aguardar resposta
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Restaurar console
      console.log = originalLog;
      console.error = originalError;
      
      // Analisar logs
      console.log('📊 LOGS CAPTURADOS:');
      logs.forEach((log, index) => {
        console.log(`${index + 1}. [${log.type.toUpperCase()}]`, ...log.args);
      });
      
      // Verificar se houve erro de foreign key
      const foreignKeyError = logs.find(log => 
        log.args.some(arg => 
          typeof arg === 'string' && arg.includes('23503') ||
          typeof arg === 'object' && JSON.stringify(arg).includes('23503')
        )
      );
      
      if (foreignKeyError) {
        console.log('❌ ERRO DE FOREIGN KEY REPRODUZIDO!');
        console.log('🔍 Detalhes do erro:', foreignKeyError);
      } else {
        console.log('✅ Nenhum erro de foreign key detectado');
      }
      
    } else {
      console.log('❌ Botão de salvar não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
console.log('🚀 Iniciando teste em 2 segundos...');
setTimeout(testForeignKeyError, 2000);