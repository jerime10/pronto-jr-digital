// Script para testar se o selectedModelTitle está sendo enviado no corpo da requisição
console.log('🧪 Iniciando teste do selectedModelTitle...');

// Interceptar requisições fetch para capturar o corpo da requisição
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Verificar se é uma requisição para a Edge Function ai-webhook
  if (url && url.includes('ai-webhook')) {
    console.log('🔍 Requisição interceptada para ai-webhook:');
    console.log('URL:', url);
    console.log('Options:', options);
    
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        console.log('📦 Corpo da requisição:', body);
        
        // Verificar se selectedModelTitle está presente
        if (body.selectedModelTitle) {
          console.log('✅ selectedModelTitle encontrado:', body.selectedModelTitle);
        } else {
          console.log('❌ selectedModelTitle NÃO encontrado no corpo da requisição');
          console.log('🔍 Propriedades disponíveis:', Object.keys(body));
        }
      } catch (e) {
        console.log('⚠️ Erro ao parsear o corpo da requisição:', e);
        console.log('📄 Corpo bruto:', options.body);
      }
    }
  }
  
  return originalFetch.apply(this, args);
};

// Simular seleção de modelo e processamento
setTimeout(() => {
  console.log('🎯 Simulando seleção de modelo de exame...');
  
  // Encontrar o select de modelo de exame
  const modelSelect = document.querySelector('select');
  if (modelSelect) {
    // Selecionar uma opção (se houver)
    const options = modelSelect.querySelectorAll('option');
    if (options.length > 1) {
      modelSelect.value = options[1].value;
      modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('📋 Modelo selecionado:', options[1].textContent);
      
      // Aguardar um pouco e tentar processar com IA
      setTimeout(() => {
        console.log('🤖 Tentando processar com IA...');
        
        // Encontrar o botão "Processar com IA"
        const processButton = document.querySelector('button[class*="Processar"]') || 
                             Array.from(document.querySelectorAll('button')).find(btn => 
                               btn.textContent.includes('Processar com IA') || 
                               btn.textContent.includes('Processar')
                             );
        
        if (processButton) {
          console.log('🔘 Botão encontrado, clicando...');
          processButton.click();
        } else {
          console.log('❌ Botão "Processar com IA" não encontrado');
          console.log('🔍 Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent));
        }
      }, 1000);
    } else {
      console.log('❌ Nenhuma opção de modelo encontrada');
    }
  } else {
    console.log('❌ Select de modelo não encontrado');
  }
}, 2000);

console.log('✅ Script de teste carregado. Aguardando interações...');