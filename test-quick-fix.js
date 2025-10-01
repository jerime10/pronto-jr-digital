// Script de teste rápido para verificar se a correção funcionou
// Execute no console do navegador após fazer login

function quickTestFix() {
  console.log('⚡ TESTE RÁPIDO DA CORREÇÃO...');
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      
      console.log('\\n🚀 PAYLOAD INTERCEPTADO:');
      console.log('Body completo:', requestBody);
      
      const hasText = !!requestBody.text;
      const hasContent = !!requestBody.content;
      const hasType = !!requestBody.type;
      const dynamicKeys = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      const hasDynamicFields = dynamicKeys.length > 0;
      
      console.log('\\n📊 ANÁLISE RÁPIDA:');
      console.log('   Tem text:', hasText);
      console.log('   Tem content:', hasContent);
      console.log('   Tem type:', hasType);
      console.log('   Campos dinâmicos:', dynamicKeys);
      console.log('   Tem campos dinâmicos:', hasDynamicFields);
      
      if (hasDynamicFields && (hasText || hasContent || hasType)) {
        console.error('❌ PROBLEMA PERSISTE: Enviando text/content/type com campos dinâmicos!');
        console.error('   Campos problemáticos:', {
          text: requestBody.text,
          content: requestBody.content,
          type: requestBody.type
        });
      } else if (hasDynamicFields && !hasText && !hasContent && !hasType) {
        console.log('✅ CORREÇÃO FUNCIONOU: Apenas campos dinâmicos!');
      } else if (!hasDynamicFields && (hasText || hasContent || hasType)) {
        console.log('✅ OK: Requisição individual com text/content/type');
      } else {
        console.warn('⚠️ Situação inesperada:', requestBody);
      }
      
      return originalFetch.apply(this, args);
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo. Execute o teste agora!');
}

console.log('⚡ Script de teste rápido carregado!');
console.log('Execute: quickTestFix()');

// Auto-executar
if (typeof window !== 'undefined') {
  quickTestFix();
}