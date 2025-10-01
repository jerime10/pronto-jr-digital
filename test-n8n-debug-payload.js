// Script para debugar o payload enviado para N8N
// Execute no console do navegador após fazer login

let debugResults = {
  edgeFunctionCalls: [],
  n8nPayloads: [],
  detectedIssues: []
};

function debugN8NPayload() {
  console.log('🔍 DEBUGANDO PAYLOAD PARA N8N...');
  
  // Resetar resultados
  debugResults = {
    edgeFunctionCalls: [],
    n8nPayloads: [],
    detectedIssues: []
  };
  
  // Interceptar fetch para Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado para Edge Function:', requestBody);
      
      // Analisar campos
      const allFields = Object.keys(requestBody || {});
      const dynamicFields = allFields.filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      const controlFields = allFields.filter(key => 
        ['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      console.log('📊 ANÁLISE DO PAYLOAD:');
      console.log('   Todos os campos:', allFields);
      console.log('   Campos dinâmicos:', dynamicFields);
      console.log('   Campos de controle:', controlFields);
      
      // Verificar se há campos dinâmicos válidos
      const hasValidDynamicFields = dynamicFields.length > 0 && 
        dynamicFields.some(key => requestBody[key] && requestBody[key].toString().trim());
      
      console.log('   Tem campos dinâmicos válidos:', hasValidDynamicFields);
      
      if (hasValidDynamicFields) {
        console.log('✅ ESPERADO: N8N deve receber apenas campos dinâmicos');
        dynamicFields.forEach(field => {
          console.log(`      ${field}: "${requestBody[field]}"`);
        });
      } else {
        console.log('⚠️ ESPERADO: N8N deve receber text/type (requisição individual)');
        console.log(`      text: "${requestBody.text || requestBody.content || 'ausente'}"`);
        console.log(`      type: "${requestBody.type || 'ausente'}"`);
      }
      
      debugResults.edgeFunctionCalls.push({
        timestamp: new Date().toISOString(),
        payload: requestBody,
        allFields,
        dynamicFields,
        controlFields,
        hasValidDynamicFields,
        expectedBehavior: hasValidDynamicFields ? 'campos_dinamicos' : 'text_type'
      });
      
      const response = await originalFetch.apply(this, args);
      
      // Analisar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\\n📥 === RESPOSTA DA EDGE FUNCTION ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        
        if (responseData.success) {
          console.log('Processed Content:', !!responseData.processed_content);
          console.log('Individual Fields:', !!responseData.individual_fields);
          
          if (responseData.individual_fields) {
            console.log('🎯 Campos individuais retornados:', Object.keys(responseData.individual_fields));
          } else if (hasValidDynamicFields) {
            console.log('❌ PROBLEMA: Esperava campos individuais mas não foram retornados');
            debugResults.detectedIssues.push('N8N não retornou campos individuais para requisição com campos dinâmicos');
          }
        } else {
          console.error('❌ Edge Function retornou erro:', responseData.error);
          debugResults.detectedIssues.push(`Edge Function erro: ${responseData.error}`);
        }
        
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
        debugResults.detectedIssues.push('Erro ao fazer parse da resposta da Edge Function');
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Debug ativo. Execute o processamento de IA agora.');
}

// Função para testar N8N diretamente com diferentes payloads
async function testN8NDirectPayloads() {
  console.log('\\n🔗 TESTANDO N8N DIRETAMENTE...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  // Teste 1: Payload com campos dinâmicos (como deveria ser)
  console.log('\\n1️⃣ Teste com campos dinâmicos apenas:');
  const dynamicOnlyPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Enviando:', dynamicOnlyPayload);
  
  try {
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dynamicOnlyPayload)
    });
    
    const result1 = await response1.text();
    console.log('📥 Resposta N8N:', result1);
    
    try {
      const json1 = JSON.parse(result1);
      const returnedFields = Object.keys(json1).filter(key => 
        ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
      );
      
      console.log('🎯 Campos individuais retornados:', returnedFields);
      
      if (returnedFields.length > 0) {
        console.log('✅ N8N retorna campos individuais com payload limpo!');
      } else {
        console.log('❌ N8N NÃO retorna campos individuais mesmo com payload limpo');
        debugResults.detectedIssues.push('N8N não retorna campos individuais mesmo com payload correto');
      }
      
    } catch (e) {
      console.log('📝 N8N retornou texto puro (não JSON)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N:', error);
    debugResults.detectedIssues.push(`Erro ao testar N8N: ${error.message}`);
  }
  
  // Teste 2: Payload com text/type (como estava antes)
  console.log('\\n2️⃣ Teste com text/type (formato antigo):');
  const textTypePayload = {
    text: 'Gere descrições médicas para os campos de exame',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  console.log('📤 Enviando:', textTypePayload);
  
  try {
    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textTypePayload)
    });
    
    const result2 = await response2.text();
    console.log('📥 Resposta N8N:', result2);
    
    try {
      const json2 = JSON.parse(result2);
      const returnedFields = Object.keys(json2).filter(key => 
        ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
      );
      
      console.log('🎯 Campos individuais retornados:', returnedFields);
      
      if (returnedFields.length > 0) {
        console.log('✅ N8N retorna campos individuais com formato antigo');
        debugResults.detectedIssues.push('N8N só funciona com formato antigo (text/type)');
      } else {
        console.log('❌ N8N NÃO retorna campos individuais nem com formato antigo');
      }
      
    } catch (e) {
      console.log('📝 N8N retornou texto puro (não JSON)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N:', error);
  }
}

// Função para gerar relatório de debug
function generateDebugReport() {
  console.log('\\n📋 === RELATÓRIO DE DEBUG ===');
  
  if (debugResults.edgeFunctionCalls.length === 0) {
    console.log('⚠️ Nenhuma chamada interceptada. Execute o teste primeiro.');
    return;
  }
  
  const lastCall = debugResults.edgeFunctionCalls[debugResults.edgeFunctionCalls.length - 1];
  
  console.log('\\n1️⃣ PAYLOAD ENVIADO PARA EDGE FUNCTION:');
  console.log('   Campos dinâmicos:', lastCall.dynamicFields);
  console.log('   Campos de controle:', lastCall.controlFields);
  console.log('   Tem campos dinâmicos válidos:', lastCall.hasValidDynamicFields);
  console.log('   Comportamento esperado:', lastCall.expectedBehavior);
  
  console.log('\\n2️⃣ ANÁLISE DO PROBLEMA:');
  
  if (lastCall.hasValidDynamicFields && lastCall.expectedBehavior === 'campos_dinamicos') {
    console.log('   ✅ Frontend está enviando campos dinâmicos corretamente');
    console.log('   🎯 Edge Function deveria enviar apenas campos dinâmicos para N8N');
  } else {
    console.log('   ❌ Frontend NÃO está enviando campos dinâmicos');
    console.log('   🎯 Edge Function está enviando text/type para N8N');
  }
  
  console.log('\\n3️⃣ PROBLEMAS DETECTADOS:');
  if (debugResults.detectedIssues.length === 0) {
    console.log('   ✅ Nenhum problema detectado');
  } else {
    debugResults.detectedIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\\n4️⃣ DIAGNÓSTICO:');
  if (lastCall.hasValidDynamicFields) {
    console.log('   🔍 O problema pode estar:');
    console.log('      - N8N não está configurado para processar apenas campos dinâmicos');
    console.log('      - N8N precisa de text/type para funcionar corretamente');
    console.log('      - Configuração do workflow N8N precisa ser ajustada');
  } else {
    console.log('   🔍 O problema está no frontend:');
    console.log('      - Campos dinâmicos não estão sendo enviados');
    console.log('      - Validação de campos dinâmicos pode estar falhando');
  }
}

// Função para executar debug completo
async function runFullDebug() {
  console.log('🔍 EXECUTANDO DEBUG COMPLETO...');
  
  // Ativar monitoramento
  debugN8NPayload();
  
  // Testar N8N diretamente
  await testN8NDirectPayloads();
  
  console.log('\\n✅ Debug completo executado.');
  console.log('📋 Execute o processamento de IA no navegador e depois use generateDebugReport()');
}

console.log('🚀 Scripts de debug disponíveis:');
console.log('debugN8NPayload() - Monitora payloads enviados');
console.log('testN8NDirectPayloads() - Testa N8N com diferentes formatos');
console.log('generateDebugReport() - Gera relatório de debug');
console.log('runFullDebug() - Executa debug completo');

// Auto-executar debug
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando debug automático...');
  runFullDebug();
}