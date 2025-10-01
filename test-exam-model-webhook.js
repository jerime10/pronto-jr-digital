// Script para testar o envio do modelo de exame selecionado para o n8n
// Execute este script no console do navegador na página /atendimento/novo

console.log('🚀 [WEBHOOK INTERCEPTOR] Script carregado!');

// Interceptar requisições para o webhook
let webhookRequests = [];
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const [url, options] = args;
  
  // Verificar se é uma requisição para o webhook do Supabase
  if (url && url.includes('ai-webhook')) {
    console.log('🎯 [WEBHOOK] Interceptando requisição para ai-webhook:', url);
    console.log('🎯 [WEBHOOK] Opções da requisição:', options);
    
    // Verificar o corpo da requisição
    if (options && options.body) {
      console.log('🎯 [WEBHOOK] Tipo do corpo:', typeof options.body);
      console.log('🎯 [WEBHOOK] Corpo da requisição:', options.body);
      
      // Se for string (JSON), tentar parsear
      if (typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
          console.log('🎯 [WEBHOOK] Corpo parseado:', parsedBody);
          
          // Verificar se selectedModelTitle está presente
          if (parsedBody.selectedModelTitle) {
            console.log('✅ [WEBHOOK] selectedModelTitle encontrado:', parsedBody.selectedModelTitle);
          } else {
            console.log('❌ [WEBHOOK] selectedModelTitle NÃO encontrado no corpo JSON');
          }
          
          // Verificar campos dinâmicos
          if (parsedBody.dynamicFields) {
            console.log('✅ [WEBHOOK] dynamicFields encontrado:', parsedBody.dynamicFields);
          } else {
            console.log('❌ [WEBHOOK] dynamicFields NÃO encontrado no corpo JSON');
          }
          
          // Verificar outros campos relevantes
          console.log('📋 [WEBHOOK] Campos encontrados no corpo:', Object.keys(parsedBody));
          
        } catch (e) {
          console.log('❌ [WEBHOOK] Erro ao parsear corpo JSON:', e);
          console.log('📄 [WEBHOOK] Corpo bruto:', options.body);
        }
      }
      
      // Se for FormData
      if (options.body instanceof FormData) {
        console.log('📋 [WEBHOOK] FormData detectado, extraindo dados...');
        const formDataEntries = {};
        for (let [key, value] of options.body.entries()) {
          formDataEntries[key] = value;
        }
        console.log('📋 [WEBHOOK] Dados do FormData:', formDataEntries);
        
        // Verificar selectedModelTitle
        if (formDataEntries.selectedModelTitle) {
          console.log('✅ [WEBHOOK] selectedModelTitle encontrado:', formDataEntries.selectedModelTitle);
        } else {
          console.log('❌ [WEBHOOK] selectedModelTitle NÃO encontrado no FormData');
        }
      }
      
      webhookRequests.push({
        url,
        body: options.body,
        timestamp: new Date().toISOString(),
        headers: options.headers
      });
    }
  }
  
  return originalFetch.apply(this, args);
};

// Função para verificar requisições interceptadas
function checkWebhookRequests() {
  console.log('📊 [CHECK] Total de requisições interceptadas:', webhookRequests.length);
  webhookRequests.forEach((req, index) => {
    console.log(`\n📋 [REQUISIÇÃO ${index + 1}] ===== DETALHES =====`);
    console.log('🔗 URL:', req.url);
    console.log('⏰ Timestamp:', req.timestamp);
    console.log('📄 Corpo:', req.body);
    console.log('📋 [REQUISIÇÃO] ===== FIM DETALHES =====\n');
  });
  return webhookRequests;
}

// Função para limpar requisições
function clearWebhookRequests() {
  webhookRequests = [];
  console.log('🧹 [CLEAR] Requisições limpas');
}

// Função para simular seleção de modelo e envio
async function testModelSelection() {
  console.log('🧪 [TEST] ===== INICIANDO TESTE DE SELEÇÃO DE MODELO =====');
  
  try {
    // Limpar requisições anteriores
    clearWebhookRequests();
    
    // 1. Verificar se estamos na página correta
    if (!window.location.pathname.includes('/atendimento/novo')) {
      console.error('❌ Navegue para /atendimento/novo primeiro');
      return;
    }
    
    // 2. Navegar para a aba de Exames
    console.log('1️⃣ Navegando para aba de Exames...');
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent && el.textContent.toLowerCase().includes('exame')
    );
    
    if (examTab) {
      examTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Aba de Exames ativada');
    }
    
    // 3. Navegar para a aba de Resultados
    console.log('2️⃣ Navegando para aba de Resultados...');
    const resultTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent && el.textContent.toLowerCase().includes('resultado')
    );
    
    if (resultTab) {
      resultTab.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Aba de Resultados ativada');
    }
    
    // 4. Procurar pelo botão "Processar com IA"
    console.log('3️⃣ Procurando botão "Processar com IA"...');
    const processButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.toLowerCase().includes('processar com ia')
    );
    
    if (!processButton) {
      console.error('❌ Botão "Processar com IA" não encontrado');
      return;
    }
    
    console.log('✅ Botão "Processar com IA" encontrado');
    
    // 5. Verificar se há um modelo selecionado
    const modelSelect = document.querySelector('select, [role="combobox"], button[role="combobox"]');
    if (modelSelect) {
      console.log('4️⃣ Select de modelos encontrado, verificando seleção...');
      
      // Se for um select HTML
      if (modelSelect.tagName === 'SELECT') {
        if (modelSelect.selectedIndex <= 0) {
          console.log('⚠️ Nenhum modelo selecionado, selecionando o primeiro disponível...');
          if (modelSelect.options.length > 1) {
            modelSelect.selectedIndex = 1;
            modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Modelo selecionado:', modelSelect.options[modelSelect.selectedIndex].text);
          }
        } else {
          console.log('✅ Modelo já selecionado:', modelSelect.options[modelSelect.selectedIndex].text);
        }
      }
    }
    
    // 6. Clicar no botão "Processar com IA"
    console.log('5️⃣ Clicando em "Processar com IA"...');
    processButton.click();
    
    // 7. Aguardar requisições
    console.log('6️⃣ Aguardando requisições para webhook...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 8. Verificar resultados
    checkWebhookRequests();
    
    console.log('🧪 [TEST] ===== TESTE CONCLUÍDO =====');
    
  } catch (error) {
    console.error('❌ [TEST] Erro durante o teste:', error);
  }
}

console.log('📋 [INSTRUÇÕES] Comandos disponíveis:');
console.log('  - testModelSelection(): Testa a seleção de modelo e envio');
console.log('  - checkWebhookRequests(): Verifica requisições interceptadas');
console.log('  - clearWebhookRequests(): Limpa requisições interceptadas');
console.log('');
console.log('🚀 Execute testModelSelection() para iniciar o teste automatizado');