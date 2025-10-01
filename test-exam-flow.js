// Teste específico para campos dinâmicos de exames
// Execute este script no console do navegador na página /atendimento/novo

console.log('🧪 === TESTE DE CAMPOS DINÂMICOS DE EXAMES ===');

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
async function testExamFlow() {
  try {
    console.log('1️⃣ Verificando se estamos na página correta...');
    if (!window.location.pathname.includes('/atendimento/novo')) {
      console.error('❌ Navegue para /atendimento/novo primeiro');
      return;
    }

    console.log('2️⃣ Procurando pela aba de Exames...');
    
    // Procurar pela aba de exames
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent?.toLowerCase().includes('exame')
    );
    
    if (!examTab) {
      console.error('❌ Aba de Exames não encontrada');
      return;
    }
    
    console.log('✅ Aba de Exames encontrada:', examTab.textContent);
    
    // Clicar na aba de exames
    examTab.click();
    console.log('🖱️ Clicou na aba de Exames');
    
    await sleep(1000);
    
    console.log('3️⃣ Procurando pela aba de Resultados...');
    
    // Aguardar e procurar pela aba de resultados
    await sleep(2000);
    const resultTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent?.toLowerCase().includes('resultado')
    );
    
    if (!resultTab) {
      console.error('❌ Aba de Resultados não encontrada');
      return;
    }
    
    console.log('✅ Aba de Resultados encontrada:', resultTab.textContent);
    
    // Clicar na aba de resultados
    resultTab.click();
    console.log('🖱️ Clicou na aba de Resultados');
    
    await sleep(2000);
    
    console.log('4️⃣ Procurando pelo select de modelos...');
    
    // Procurar pelo select de modelos de exames
    const modelSelect = document.querySelector('select, [role="combobox"], button[role="combobox"]');
    
    if (!modelSelect) {
      console.error('❌ Select de modelos não encontrado');
      console.log('🔍 Elementos select encontrados:', document.querySelectorAll('select').length);
      console.log('🔍 Elementos combobox encontrados:', document.querySelectorAll('[role="combobox"]').length);
      return;
    }
    
    console.log('✅ Select de modelos encontrado:', modelSelect);
    
    // Clicar no select para abrir as opções
    modelSelect.click();
    console.log('🖱️ Clicou no select de modelos');
    
    await sleep(1000);
    
    console.log('5️⃣ Procurando pelas opções de modelos...');
    
    // Procurar pelas opções de modelos
    const modelOptions = document.querySelectorAll('[role="option"], option, [data-value]');
    console.log(`🔍 Encontradas ${modelOptions.length} opções de modelos`);
    
    if (modelOptions.length === 0) {
      console.error('❌ Nenhuma opção de modelo encontrada');
      return;
    }
    
    // Selecionar a primeira opção disponível
    const firstOption = Array.from(modelOptions).find(option => 
      option.textContent && option.textContent.trim() !== ''
    );
    
    if (!firstOption) {
      console.error('❌ Nenhuma opção válida encontrada');
      return;
    }
    
    console.log('✅ Primeira opção encontrada:', firstOption.textContent);
    
    // Clicar na primeira opção
    firstOption.click();
    console.log('🖱️ Selecionou o modelo:', firstOption.textContent);
    
    await sleep(3000);
    
    console.log('6️⃣ Verificando se campos dinâmicos foram gerados...');
    
    // Procurar por campos dinâmicos gerados
    const dynamicInputs = document.querySelectorAll('input[placeholder*="Valor"], input[placeholder*="valor"]');
    const dynamicTextareas = document.querySelectorAll('textarea[placeholder*="Descrição"], textarea[placeholder*="descrição"]');
    const dynamicDates = document.querySelectorAll('input[type="date"], input[placeholder*="DD/MM"]');
    
    console.log(`📊 Campos dinâmicos encontrados:
    - Inputs: ${dynamicInputs.length}
    - Textareas: ${dynamicTextareas.length}
    - Dates: ${dynamicDates.length}
    - Total: ${dynamicInputs.length + dynamicTextareas.length + dynamicDates.length}`);
    
    if (dynamicInputs.length + dynamicTextareas.length + dynamicDates.length === 0) {
      console.error('❌ Nenhum campo dinâmico foi gerado');
      return;
    }
    
    console.log('7️⃣ Testando preenchimento dos campos...');
    
    // Testar preenchimento dos campos
    let filledFields = 0;
    
    // Preencher inputs
    dynamicInputs.forEach((input, index) => {
      if (input.type !== 'date') {
        input.value = `Valor teste ${index + 1}`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        filledFields++;
      }
    });
    
    // Preencher textareas
    dynamicTextareas.forEach((textarea, index) => {
      textarea.value = `Descrição teste ${index + 1}`;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      filledFields++;
    });
    
    // Preencher campos de data
    dynamicDates.forEach((dateInput, index) => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      dateInput.value = dateStr;
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      filledFields++;
    });
    
    console.log(`✅ Preenchidos ${filledFields} campos dinâmicos`);
    
    await sleep(2000);
    
    console.log('8️⃣ Verificando área de resultado final...');
    
    // Procurar pela área de resultado final
    const resultArea = document.querySelector('textarea[placeholder*="resultado"], textarea[placeholder*="Resultado"]');
    
    if (!resultArea) {
      console.error('❌ Área de resultado final não encontrada');
      return;
    }
    
    console.log('✅ Área de resultado encontrada');
    console.log('📝 Conteúdo atual:', resultArea.value.substring(0, 200) + '...');
    
    console.log('9️⃣ Procurando pelo botão de IA...');
    
    // Procurar pelo botão de IA
    const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('IA') || 
      btn.querySelector('svg') || 
      btn.textContent?.includes('Processar')
    );
    
    if (aiButton) {
      console.log('✅ Botão de IA encontrado:', aiButton.textContent);
    } else {
      console.log('⚠️ Botão de IA não encontrado');
    }
    
    console.log('🎉 === TESTE CONCLUÍDO ===');
    console.log(`
📊 RESUMO DO TESTE:
✅ Aba de Exames: Encontrada e clicada
✅ Aba de Resultados: Encontrada e clicada
✅ Select de Modelos: Encontrado e usado
✅ Modelo Selecionado: ${firstOption.textContent}
✅ Campos Dinâmicos: ${dynamicInputs.length + dynamicTextareas.length + dynamicDates.length} gerados
✅ Campos Preenchidos: ${filledFields}
✅ Área de Resultado: Encontrada
${aiButton ? '✅' : '⚠️'} Botão de IA: ${aiButton ? 'Encontrado' : 'Não encontrado'}

🔧 PRÓXIMOS PASSOS MANUAIS:
1. Verifique se os valores preenchidos aparecem na área de resultado
2. Teste o botão de IA se disponível
3. Verifique se não há erros no console
4. Teste a navegação entre abas
    `);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testExamFlow();