// Script para testar se a Edge Function está enviando apenas campos dinâmicos para o N8N
// Execute no console do navegador após fazer login

let testResults = {
  interceptedCalls: [],
  n8nPayloads: [],
  edgeFunctionResponses: []
};

function testCleanN8NPayload() {
  console.log('🧪 TESTANDO PAYLOAD LIMPO PARA N8N...');
  
  // Resetar resultados
  testResults = {
    interceptedCalls: [],
    n8nPayloads: [],
    edgeFunctionResponses: []
  };
  
  // Interceptar fetch para monitorar chamadas
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado para Edge Function:', requestBody);
      
      // Verificar campos enviados
      const allFields = Object.keys(requestBody || {});
      const dynamicFields = allFields.filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      console.log('📊 Todos os campos:', allFields);
      console.log('🎯 Campos dinâmicos:', dynamicFields);
      console.log('❌ Campos de controle:', allFields.filter(key => 
        ['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      ));
      
      testResults.interceptedCalls.push({
        timestamp: new Date().toISOString(),
        allFields,
        dynamicFields,
        payload: requestBody
      });
      
      const response = await originalFetch.apply(this, args);
      
      // Analisar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        testResults.edgeFunctionResponses.push(responseData);
        
        console.log('\\n📥 === RESPOSTA DA EDGE FUNCTION ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        console.log('Processed Content:', !!responseData.processed_content);
        console.log('Individual Fields:', !!responseData.individual_fields);
        
        if (responseData.individual_fields) {
          console.log('🎯 Campos individuais retornados:', Object.keys(responseData.individual_fields));
        }
        
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo.');
  console.log('📋 Execute o processamento de IA agora.');
  console.log('🎯 Verificando se apenas campos dinâmicos são enviados para N8N...');
}

// Função para testar N8N diretamente com payload limpo
async function testN8NDirectClean() {
  console.log('\\n🔗 TESTANDO N8N COM PAYLOAD LIMPO...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  // Payload limpo - apenas campos dinâmicos
  const cleanPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Enviando payload limpo para N8N:', cleanPayload);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sistema.saude.app'
      },
      body: JSON.stringify(cleanPayload)
    });
    
    console.log('📊 Status N8N:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Resposta N8N:', responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      
      console.log('\\n🔍 ANÁLISE DA RESPOSTA:');
      console.log('✅ Processed Content:', !!jsonResponse.processed_content);
      
      // Verificar se N8N retornou campos individuais
      const returnedFields = Object.keys(jsonResponse).filter(key => 
        ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
      );
      
      console.log('🎯 Campos individuais retornados:', returnedFields);
      
      if (returnedFields.length > 0) {
        console.log('✅ N8N está processando e retornando campos individuais corretamente!');
        returnedFields.forEach(field => {
          console.log(`   ${field}: ${jsonResponse[field]}`);
        });
      } else {
        console.log('⚠️ N8N não retornou campos individuais');
      }
      
      return jsonResponse;
      
    } catch (parseError) {
      console.log('📝 N8N retornou texto puro:', responseText);
      return responseText;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N:', error);
    return null;
  }
}

// Função para comparar payloads antigo vs novo
function comparePayloads() {
  console.log('\\n📊 === COMPARAÇÃO DE PAYLOADS ===');
  
  console.log('\\n🔴 PAYLOAD ANTIGO (com text e type):');
  console.log('{');
  console.log('  \"text\": \"Gere uma descrição médica...\",');
  console.log('  \"type\": \"exam_result\",');
  console.log('  \"timestamp\": \"2024-01-20T10:00:00Z\",');
  console.log('  \"selectedModelTitle\": \"Ultrassom Obstétrico\",');
  console.log('  \"IG\": \"32 semanas\",');
  console.log('  \"BCF\": \"140 bpm\",');
  console.log('  \"peso_fetal\": \"1800g\"');
  console.log('}');
  
  console.log('\\n🟢 PAYLOAD NOVO (apenas campos dinâmicos):');
  console.log('{');
  console.log('  \"IG\": \"32 semanas\",');
  console.log('  \"BCF\": \"140 bpm\",');
  console.log('  \"peso_fetal\": \"1800g\",');
  console.log('  \"timestamp\": \"2024-01-20T10:00:00Z\"');
  console.log('}');
  
  console.log('\\n✅ CAMPOS REMOVIDOS:');
  console.log('   ❌ text (conteúdo do Resultado Final)');
  console.log('   ❌ type (tipo de processamento)');
  console.log('   ❌ selectedModelTitle (título do modelo)');
  console.log('   ❌ content (conteúdo alternativo)');
  
  console.log('\\n✅ CAMPOS MANTIDOS:');
  console.log('   ✅ Campos dinâmicos (IG, BCF, peso_fetal, etc.)');
  console.log('   ✅ timestamp (para controle)');
}

// Função para gerar relatório final
function generateCleanPayloadReport() {
  console.log('\\n📋 === RELATÓRIO PAYLOAD LIMPO ===');
  
  if (testResults.interceptedCalls.length === 0) {
    console.log('⚠️ Nenhuma chamada interceptada. Execute o teste primeiro.');
    return;
  }
  
  const lastCall = testResults.interceptedCalls[testResults.interceptedCalls.length - 1];
  
  console.log('\\n1️⃣ CAMPOS ENVIADOS PARA EDGE FUNCTION:');
  console.log('   Todos os campos:', lastCall.allFields);
  console.log('   Campos dinâmicos:', lastCall.dynamicFields);
  
  console.log('\\n2️⃣ VERIFICAÇÃO DE LIMPEZA:');
  const hasText = lastCall.allFields.includes('text');
  const hasType = lastCall.allFields.includes('type');
  const hasContent = lastCall.allFields.includes('content');
  
  console.log(`   text: ${hasText ? '❌ PRESENTE' : '✅ REMOVIDO'}`);
  console.log(`   type: ${hasType ? '❌ PRESENTE' : '✅ REMOVIDO'}`);
  console.log(`   content: ${hasContent ? '❌ PRESENTE' : '✅ REMOVIDO'}`);
  
  console.log('\\n3️⃣ CAMPOS DINÂMICOS:');
  if (lastCall.dynamicFields.length > 0) {
    console.log('   ✅ Campos dinâmicos presentes:', lastCall.dynamicFields);
  } else {
    console.log('   ❌ Nenhum campo dinâmico encontrado');
  }
  
  console.log('\\n4️⃣ RESULTADO:');
  if (!hasText && !hasType && !hasContent && lastCall.dynamicFields.length > 0) {
    console.log('   ✅ SUCESSO: Payload está limpo e contém apenas campos dinâmicos!');
  } else {
    console.log('   ❌ PROBLEMA: Payload ainda contém campos desnecessários ou faltam campos dinâmicos');
  }
}

// Função para executar todos os testes
async function runFullCleanTest() {
  console.log('🧪 EXECUTANDO TESTE COMPLETO DE PAYLOAD LIMPO...');
  
  // Ativar monitoramento
  testCleanN8NPayload();
  
  // Mostrar comparação
  comparePayloads();
  
  // Testar N8N diretamente
  await testN8NDirectClean();
  
  console.log('\\n✅ Teste completo executado. Use generateCleanPayloadReport() após testar no navegador.');
}

console.log('🚀 Scripts de teste de payload limpo disponíveis:');
console.log('testCleanN8NPayload() - Monitora chamadas da Edge Function');
console.log('testN8NDirectClean() - Testa N8N com payload limpo');
console.log('comparePayloads() - Compara payload antigo vs novo');
console.log('generateCleanPayloadReport() - Gera relatório final');
console.log('runFullCleanTest() - Executa todos os testes');

// Auto-executar teste completo
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático...');
  runFullCleanTest();
}