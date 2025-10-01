// Teste da Edge Function ai-webhook
// Execute no console do navegador na página /atendimento/novo

console.log('🧪 Testando Edge Function ai-webhook...');

async function testEdgeFunction() {
  try {
    console.log('1️⃣ Verificando disponibilidade do Supabase...');
    
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    
    console.log('✅ Supabase disponível');
    
    console.log('2️⃣ Testando Edge Function com dados de exemplo...');
    
    const testData = {
      content: 'Hemograma completo: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL, Hematócrito 42%, Leucócitos 7.200/mm³, Plaquetas 280.000/mm³. Valores dentro da normalidade.',
      type: 'exam_result'
    };
    
    console.log('📤 Enviando dados:', testData);
    
    const startTime = Date.now();
    
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testData
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Tempo de resposta: ${duration}ms`);
    
    if (error) {
      console.error('❌ Erro na Edge Function:');
      console.error('📋 Detalhes do erro:', error);
      console.error('📋 Código:', error.code);
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Detalhes:', error.details);
      
      // Verificar se é erro de configuração
      if (error.message && error.message.includes('webhook')) {
        console.log('🔧 Possível problema de configuração do webhook N8N');
      }
      
      return false;
    } else {
      console.log('✅ Edge Function respondeu com sucesso!');
      console.log('📥 Resposta completa:', data);
      
      if (data.success) {
        console.log('✅ Processamento bem-sucedido');
        if (data.processed_content) {
          console.log('📝 Conteúdo processado:', data.processed_content);
        }
      } else {
        console.log('⚠️ Processamento falhou:', data.error);
      }
      
      return data.success;
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return false;
  }
}

// Executar o teste
testEdgeFunction().then(success => {
  console.log('🏁 Teste concluído:', success ? '✅ Sucesso' : '❌ Falha');
});