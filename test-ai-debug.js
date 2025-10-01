// Teste de debug da IA - Execute no console do navegador na página /atendimento/novo
console.log('🔍 Iniciando debug da IA...');

// Verificar se o Supabase está disponível
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase não está disponível no window');
} else {
  console.log('✅ Supabase disponível');
}

// Testar a Edge Function diretamente
async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function ai-webhook...');
  
  try {
    const testData = {
      content: 'Hemograma: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL',
      type: 'exam_result'
    };
    
    console.log('📤 Enviando dados:', testData);
    
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      console.error('📋 Detalhes do erro:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Edge Function respondeu com sucesso!');
      console.log('📥 Resposta:', data);
    }
    
    return { data, error };
    
  } catch (err) {
    console.error('❌ Exceção ao chamar Edge Function:', err);
    return { data: null, error: err };
  }
}

// Verificar se há hooks React disponíveis
function checkReactHooks() {
  console.log('🔍 Verificando hooks React...');
  
  // Procurar por elementos React
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
  console.log('⚛️ Elementos React encontrados:', reactElements.length);
  
  // Verificar se há componentes com props
  const buttons = Array.from(document.querySelectorAll('button'));
  console.log('🔘 Botões encontrados:', buttons.length);
  
  buttons.forEach((btn, index) => {
    if (btn.textContent && (btn.textContent.includes('IA') || btn.textContent.includes('AI'))) {
      console.log(`🤖 Botão de IA ${index}:`, btn.textContent, btn);
    }
  });
}

// Verificar textareas
function checkTextareas() {
  console.log('📝 Verificando textareas...');
  
  const textareas = Array.from(document.querySelectorAll('textarea'));
  console.log('📄 Textareas encontradas:', textareas.length);
  
  textareas.forEach((ta, index) => {
    console.log(`📝 Textarea ${index}:`, {
      placeholder: ta.placeholder,
      name: ta.name,
      id: ta.id,
      value: ta.value.substring(0, 50) + (ta.value.length > 50 ? '...' : '')
    });
  });
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes...');
  
  checkReactHooks();
  checkTextareas();
  
  const result = await testEdgeFunction();
  
  console.log('📊 Resultado final:', result);
  
  return result;
}

// Executar
runAllTests();