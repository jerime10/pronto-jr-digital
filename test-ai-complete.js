// Teste completo da IA - Execute no console do navegador na página /atendimento/novo
console.log('🧪 Iniciando teste completo da IA...');

// Função para aguardar elementos
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

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteAIFlow() {
  try {
    console.log('1️⃣ Navegando para a aba de Exames e Resultados...');
    
    // Procurar pela aba de exames
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent && el.textContent.toLowerCase().includes('exame')
    );
    
    if (!examTab) {
      console.error('❌ Aba de exames não encontrada');
      return;
    }
    
    console.log('✅ Aba de exames encontrada:', examTab.textContent);
    examTab.click();
    
    await sleep(1000);
    
    console.log('2️⃣ Procurando por modelos de exame...');
    
    // Procurar por select de modelos
    const modelSelect = document.querySelector('select[name*="model"], select[id*="model"], select[placeholder*="modelo"]');
    
    if (modelSelect && modelSelect.options.length > 1) {
      console.log('✅ Select de modelos encontrado');
      modelSelect.selectedIndex = 1; // Selecionar o primeiro modelo disponível
      modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      await sleep(1000);
      console.log('✅ Modelo selecionado:', modelSelect.options[modelSelect.selectedIndex].text);
    } else {
      console.log('⚠️ Select de modelos não encontrado ou vazio');
    }
    
    console.log('3️⃣ Procurando campo de resultados de exames...');
    
    // Procurar por textarea de resultados
    const resultTextarea = document.querySelector('textarea[placeholder*="resultado"], textarea[name*="result"], textarea[id*="result"]') ||
                          Array.from(document.querySelectorAll('textarea')).find(ta => 
                            ta.placeholder && ta.placeholder.toLowerCase().includes('resultado')
                          );
    
    if (!resultTextarea) {
      console.error('❌ Campo de resultados não encontrado');
      console.log('🔍 Textareas disponíveis:', Array.from(document.querySelectorAll('textarea')).map(ta => ta.placeholder || ta.name || ta.id));
      return;
    }
    
    console.log('✅ Campo de resultados encontrado');
    
    // Preencher com dados de teste
    const testContent = 'Hemograma completo: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL, Hematócrito 42%, Leucócitos 7.200/mm³, Plaquetas 280.000/mm³. Glicemia de jejum: 95 mg/dL. Colesterol total: 180 mg/dL.';
    
    resultTextarea.value = testContent;
    resultTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    resultTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Conteúdo de teste inserido');
    
    await sleep(500);
    
    console.log('4️⃣ Procurando botão de IA...');
    
    // Procurar botão de IA
    const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && (
        btn.textContent.toLowerCase().includes('ia') ||
        btn.textContent.toLowerCase().includes('ai') ||
        btn.textContent.toLowerCase().includes('processar')
      )
    );
    
    if (!aiButton) {
      console.error('❌ Botão de IA não encontrado');
      console.log('🔍 Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent));
      return;
    }
    
    console.log('✅ Botão de IA encontrado:', aiButton.textContent);
    
    console.log('5️⃣ Testando a IA diretamente primeiro...');
    
    // Testar a Edge Function diretamente
    try {
      const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
        body: {
          content: testContent,
          type: 'exam_result'
        }
      });
      
      if (error) {
        console.error('❌ Erro na Edge Function:', error);
      } else {
        console.log('✅ Edge Function funcionando:', data);
      }
    } catch (edgeError) {
      console.error('❌ Erro ao chamar Edge Function:', edgeError);
    }
    
    console.log('6️⃣ Clicando no botão de IA...');
    
    // Clicar no botão de IA
    aiButton.click();
    
    console.log('7️⃣ Aguardando processamento...');
    
    // Aguardar alguns segundos para ver o resultado
    await sleep(5000);
    
    // Verificar se o conteúdo foi alterado
    const newContent = resultTextarea.value;
    
    if (newContent !== testContent) {
      console.log('✅ Conteúdo foi processado pela IA!');
      console.log('📝 Conteúdo original:', testContent);
      console.log('🤖 Conteúdo processado:', newContent);
    } else {
      console.log('⚠️ Conteúdo não foi alterado');
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCompleteAIFlow();