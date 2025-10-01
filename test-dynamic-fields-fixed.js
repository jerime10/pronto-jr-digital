// Script de teste para verificar se os campos dinâmicos estão sendo enviados separadamente
// Execute este script no console do navegador após preencher os campos dinâmicos

console.log('🧪 TESTE: Verificando envio de campos dinâmicos separadamente');

// Interceptar chamadas para a Edge Function
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Verificar se é uma chamada para ai-webhook
  if (url && url.includes('ai-webhook')) {
    console.log('🔍 INTERCEPTADO: Chamada para ai-webhook');
    console.log('📤 URL:', url);
    console.log('📤 Options:', options);
    
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        console.log('📤 BODY COMPLETO:', body);
        
        // Verificar se há campos dinâmicos separados
        const dynamicFieldsKeys = Object.keys(body).filter(key => 
          key !== 'field' && 
          key !== 'text' && 
          key !== 'patientId'
        );
        
        console.log('🔍 CAMPOS DINÂMICOS ENCONTRADOS:', dynamicFieldsKeys);
        console.log('📝 CONTEÚDO DO PARÂMETRO TEXT:', body.text);
        
        if (dynamicFieldsKeys.length > 0) {
          console.log('✅ SUCESSO: Campos dinâmicos estão sendo enviados separadamente!');
          dynamicFieldsKeys.forEach(key => {
            console.log(`   - ${key}: ${body[key]}`);
          });
        } else {
          console.log('❌ PROBLEMA: Nenhum campo dinâmico encontrado como parâmetro separado');
        }
        
        if (body.text && body.text.trim()) {
          console.log('⚠️ ATENÇÃO: Ainda há conteúdo no parâmetro text:', body.text);
        } else {
          console.log('✅ CORRETO: Parâmetro text está vazio ou não enviado');
        }
        
      } catch (e) {
        console.log('❌ ERRO ao parsear body:', e);
      }
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('🎯 INSTRUÇÕES:');
console.log('1. Vá para a página de Novo Atendimento');
console.log('2. Vá para a aba Exames');
console.log('3. Selecione um modelo de exame');
console.log('4. Preencha alguns campos dinâmicos');
console.log('5. Clique em "Processar com IA"');
console.log('6. Observe os logs acima para verificar se os campos estão sendo enviados separadamente');

// Restaurar fetch original após 5 minutos
setTimeout(() => {
  window.fetch = originalFetch;
  console.log('🔄 Fetch original restaurado');
}, 5 * 60 * 1000);