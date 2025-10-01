// Teste específico para verificar o funcionamento da IA
// Execute este script no console do navegador na página /atendimento/novo

console.log('🤖 === TESTE DE PROCESSAMENTO IA ===');

// Função para aguardar elemento
function waitForElement(selector, timeout = 10000) {
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

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste principal
async function testAIProcessing() {
  try {
    console.log('1️⃣ Verificando se estamos na página correta...');
    if (!window.location.pathname.includes('/atendimento/novo')) {
      console.error('❌ Navegue para /atendimento/novo primeiro');
      return;
    }

    console.log('2️⃣ Navegando para a aba de Exames...');
    
    // Procurar pela aba de exames
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent?.toLowerCase().includes('exame')
    );
    
    if (!examTab) {
      console.error('❌ Aba de Exames não encontrada');
      return;
    }
    
    examTab.click();
    await sleep(1000);
    
    console.log('3️⃣ Navegando para a aba de Resultados...');
    
    // Procurar pela aba de resultados
    const resultTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent?.toLowerCase().includes('resultado')
    );
    
    if (!resultTab) {
      console.error('❌ Aba de Resultados não encontrada');
      return;
    }
    
    resultTab.click();
    await sleep(2000);
    
    console.log('4️⃣ Procurando pelo select de modelos...');
    
    // Procurar pelo select de modelos
    const modelSelect = document.querySelector('select, [role="combobox"], button[role="combobox"]');
    
    if (!modelSelect) {
      console.error('❌ Select de modelos não encontrado');
      return;
    }
    
    modelSelect.click();
    await sleep(1000);
    
    console.log('5️⃣ Selecionando um modelo de exame...');
    
    // Procurar pelas opções de modelos
    const modelOptions = document.querySelectorAll('[role="option"], option, [data-value]');
    console.log(`🔍 Encontradas ${modelOptions.length} opções de modelos`);
    
    if (modelOptions.length === 0) {
      console.error('❌ Nenhuma opção de modelo encontrada');
      return;
    }
    
    // Selecionar a primeira opção disponível
    const firstOption = modelOptions[0];
    console.log('✅ Selecionando modelo:', firstOption.textContent);
    firstOption.click();
    
    await sleep(2000);
    
    console.log('6️⃣ Preenchendo campos dinâmicos...');
    
    // Procurar por campos de input e textarea
    const inputs = document.querySelectorAll('input[type="text"], input[type="date"], textarea');
    console.log(`🔍 Encontrados ${inputs.length} campos para preencher`);
    
    // Preencher alguns campos com dados de teste
    inputs.forEach((input, index) => {
      if (input.type === 'date') {
        input.value = '2024-01-15';
      } else if (input.tagName.toLowerCase() === 'textarea') {
        input.value = `Resultado de exame ${index + 1}: Valores dentro da normalidade. Observações importantes para processamento com IA.`;
      } else {
        input.value = `Valor ${index + 1}`;
      }
      
      // Disparar evento de mudança
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await sleep(1000);
    
    console.log('7️⃣ Procurando pelo botão de IA...');
    
    // Procurar pelo botão de IA
    const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.toLowerCase().includes('ia') || 
      btn.textContent?.toLowerCase().includes('inteligência') ||
      btn.querySelector('svg') // Pode ter um ícone
    );
    
    if (!aiButton) {
      console.error('❌ Botão de IA não encontrado');
      console.log('🔍 Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent));
      return;
    }
    
    console.log('✅ Botão de IA encontrado:', aiButton.textContent);
    
    console.log('8️⃣ Testando o processamento com IA...');
    
    // Verificar se há conteúdo no campo de resultados
    const resultTextarea = document.querySelector('textarea[placeholder*="resultado"], textarea[placeholder*="exame"]');
    
    if (!resultTextarea || !resultTextarea.value.trim()) {
      console.log('⚠️ Adicionando conteúdo de teste no campo de resultados...');
      if (resultTextarea) {
        resultTextarea.value = 'Hemograma completo: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL, Hematócrito 42%, Leucócitos 7.200/mm³, Plaquetas 280.000/mm³. Glicemia de jejum: 95 mg/dL. Colesterol total: 180 mg/dL.';
        resultTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        resultTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    
    // Clicar no botão de IA
    console.log('🤖 Clicando no botão de IA...');
    aiButton.click();
    
    console.log('9️⃣ Aguardando processamento...');
    
    // Aguardar alguns segundos para ver o resultado
    await sleep(5000);
    
    console.log('✅ Teste concluído! Verifique:');
    console.log('- Se apareceu uma mensagem de sucesso ou erro');
    console.log('- Se o conteúdo foi processado e modificado');
    console.log('- Se há logs no console sobre o processamento');
    console.log('- Se o botão ficou em estado de carregamento');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAIProcessing();