// Script para testar a IA no console do navegador
// Execute este código no console do navegador na página /atendimento/novo

console.log('🧪 Iniciando teste da IA...');

async function testAI() {
  try {
    console.log('1️⃣ Verificando se o Supabase está disponível...');
    
    if (!window.supabase) {
      console.error('❌ Supabase não está disponível no window');
      return;
    }
    
    console.log('✅ Supabase encontrado');
    
    // Dados de teste
    const testContent = 'Hemograma completo: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL, Hematócrito 42%, Leucócitos 7.200/mm³, Plaquetas 280.000/mm³. Glicemia de jejum: 95 mg/dL. Colesterol total: 180 mg/dL.';
    const testType = 'exam_result';
    
    console.log('2️⃣ Testando Edge Function ai-webhook...');
    console.log('📝 Conteúdo:', testContent);
    console.log('🏷️ Tipo:', testType);
    
    // Chamar a Edge Function
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: {
        content: testContent,
        type: testType
      }
    });
    
    console.log('3️⃣ Resultado da Edge Function:');
    
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Sucesso:', data);
      
      if (data?.success && data?.processed_content) {
        console.log('🎯 Conteúdo processado:', data.processed_content);
      } else {
        console.log('⚠️ Resposta sem conteúdo processado:', data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAI();