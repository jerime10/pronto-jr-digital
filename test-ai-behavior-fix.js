// Script para diagnosticar e testar os problemas específicos de IA
// Execute no console do navegador após fazer login

let testResults = {
  generalButtonTest: null,
  individualButtonTest: null,
  n8nResponse: null,
  frontendCallbacks: []
};

function testAIBehaviorProblems() {
  console.log('🔍 TESTANDO PROBLEMAS ESPECÍFICOS DE IA...');
  
  // Resetar resultados
  testResults = {
    generalButtonTest: null,
    individualButtonTest: null,
    n8nResponse: null,
    frontendCallbacks: []
  };
  
  // Interceptar fetch para monitorar chamadas
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\n🚀 === INTERCEPTANDO CHAMADA AI ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Request Body:', requestBody);
      
      // Identificar tipo de chamada
      const dynamicFields = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      const isGeneralButton = dynamicFields.length > 0 && !requestBody.content;
      const isIndividualButton = requestBody.content && requestBody.content.includes('Gere uma descrição médica');
      
      if (isGeneralButton) {
        console.log('🎯 TIPO: Botão GERAL (deveria popular Resultado Final + campos individuais)');
        console.log('📊 Campos dinâmicos enviados:', dynamicFields);
        testResults.generalButtonTest = { type: 'general', fields: dynamicFields, payload: requestBody };
      } else if (isIndividualButton) {
        console.log('🎯 TIPO: Botão INDIVIDUAL (deveria popular apenas campo específico)');
        console.log('📝 Prompt:', requestBody.content);
        testResults.individualButtonTest = { type: 'individual', prompt: requestBody.content, payload: requestBody };
      } else {
        console.log('🎯 TIPO: Outro processamento');
      }
      
      const response = await originalFetch.apply(this, args);
      
      // Analisar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\n📥 === RESPOSTA RECEBIDA ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        
        if (responseData.processed_content) {
          console.log('📄 Processed Content:', responseData.processed_content.substring(0, 100) + '...');
        }
        
        if (responseData.individual_fields) {
          console.log('🎯 Individual Fields PRESENTES:', Object.keys(responseData.individual_fields));
          Object.entries(responseData.individual_fields).forEach(([key, value]) => {
            console.log(`  ${key}: ${value.substring(0, 50)}...`);
          });
        } else {
          console.log('❌ Individual Fields AUSENTES');
        }
        
        // Armazenar resposta baseada no tipo
        if (isGeneralButton) {
          testResults.generalButtonTest.response = responseData;
          console.log('\n🔍 ANÁLISE BOTÃO GERAL:');
          console.log('✅ Processed Content:', !!responseData.processed_content);
          console.log('❓ Individual Fields:', !!responseData.individual_fields);
          
          if (!responseData.individual_fields) {
            console.log('🚨 PROBLEMA: Botão geral não retornou campos individuais!');
          }
        } else if (isIndividualButton) {
          testResults.individualButtonTest.response = responseData;
          console.log('\n🔍 ANÁLISE BOTÃO INDIVIDUAL:');
          console.log('✅ Processed Content:', !!responseData.processed_content);
          console.log('❓ Individual Fields:', !!responseData.individual_fields);
          
          if (responseData.individual_fields) {
            console.log('🚨 PROBLEMA: Botão individual retornou campos individuais (deveria ser só texto)!');
          }
        }
        
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Interceptar logs do frontend
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args[0];
    if (typeof message === 'string') {
      if (message.includes('[useAtendimentoHelpers]') || 
          message.includes('[NovoAtendimento]') || 
          message.includes('[ResultadoExames]')) {
        testResults.frontendCallbacks.push(args);
        console.log('\n🎯 === CALLBACK FRONTEND ===');
        originalLog.apply(this, args);
      } else {
        originalLog.apply(this, args);
      }
    } else {
      originalLog.apply(this, args);
    }
  };
  
  console.log('✅ Monitoramento ativo.');
  console.log('📋 Execute os testes:');
  console.log('1. Preencha campos e clique "Processar com IA" (botão geral)');
  console.log('2. Clique no ícone de IA de um campo específico (botão individual)');
}

// Função para testar N8N diretamente
async function testN8NDirectResponse() {
  console.log('\n🔗 TESTANDO N8N DIRETAMENTE...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  // Teste 1: Simular botão geral (com campos dinâmicos)
  console.log('\n1️⃣ Teste botão geral:');
  const generalPayload = {
    text: '',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  try {
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generalPayload)
    });
    
    const result1 = await response1.text();
    console.log('📥 Resposta N8N (geral):', result1);
    
    try {
      const json1 = JSON.parse(result1);
      const hasIndividualFields = Object.keys(json1).some(key => 
        ['IG', 'BCF', 'peso_fetal'].includes(key)
      );
      console.log('🎯 N8N retorna campos individuais:', hasIndividualFields);
      if (hasIndividualFields) {
        console.log('✅ N8N está funcionando corretamente para botão geral');
      } else {
        console.log('❌ N8N NÃO está retornando campos individuais');
      }
    } catch (e) {
      console.log('📝 N8N retornou texto puro (não JSON)');
    }
  } catch (error) {
    console.error('❌ Erro ao testar N8N geral:', error);
  }
  
  // Teste 2: Simular botão individual
  console.log('\n2️⃣ Teste botão individual:');
  const individualPayload = {
    text: 'Gere uma descrição médica normal/padrão para idade gestacional em um exame de ultrassonografia abdominal. Seja conciso e use terminologia médica apropriada.',
    type: 'exam_result',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(individualPayload)
    });
    
    const result2 = await response2.text();
    console.log('📥 Resposta N8N (individual):', result2);
    
    try {
      const json2 = JSON.parse(result2);
      const hasIndividualFields = Object.keys(json2).some(key => 
        ['IG', 'BCF', 'peso_fetal'].includes(key)
      );
      console.log('🎯 N8N retorna campos individuais:', hasIndividualFields);
      if (!hasIndividualFields) {
        console.log('✅ N8N está funcionando corretamente para botão individual');
      } else {
        console.log('❌ N8N está retornando campos individuais (deveria ser só texto)');
      }
    } catch (e) {
      console.log('📝 N8N retornou texto puro (correto para botão individual)');
    }
  } catch (error) {
    console.error('❌ Erro ao testar N8N individual:', error);
  }
}

// Função para gerar relatório dos problemas
function generateProblemReport() {
  console.log('\n📋 === RELATÓRIO DOS PROBLEMAS ===');
  
  console.log('\n🔍 PROBLEMA 1: Botão geral não popula campos individuais');
  if (testResults.generalButtonTest) {
    const hasIndividualFields = testResults.generalButtonTest.response?.individual_fields;
    console.log('Status:', hasIndividualFields ? '✅ Edge Function retorna campos' : '❌ Edge Function NÃO retorna campos');
    
    if (!hasIndividualFields) {
      console.log('💡 Possíveis causas:');
      console.log('   - N8N não está retornando campos individuais');
      console.log('   - Edge Function não está extraindo campos corretamente');
      console.log('   - Lógica de mapeamento de campos está incorreta');
    }
  } else {
    console.log('⚠️ Teste do botão geral não foi executado');
  }
  
  console.log('\n🔍 PROBLEMA 2: Botão individual retorna resposta completa');
  if (testResults.individualButtonTest) {
    const hasIndividualFields = testResults.individualButtonTest.response?.individual_fields;
    console.log('Status:', !hasIndividualFields ? '✅ Não retorna campos extras' : '❌ Retorna campos extras');
    
    if (hasIndividualFields) {
      console.log('💡 Possíveis causas:');
      console.log('   - Botão individual está usando mesmo fluxo do botão geral');
      console.log('   - N8N está processando prompt individual como múltiplos campos');
      console.log('   - Edge Function está extraindo campos mesmo sem campos dinâmicos');
    }
  } else {
    console.log('⚠️ Teste do botão individual não foi executado');
  }
  
  console.log('\n📊 Callbacks do frontend capturados:', testResults.frontendCallbacks.length);
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se N8N está configurado corretamente');
  console.log('2. Verificar lógica da Edge Function');
  console.log('3. Verificar fluxo de callbacks no frontend');
  console.log('4. Implementar correções específicas');
}

// Função para simular comportamento correto
function simulateCorrectBehavior() {
  console.log('\n🎭 COMPORTAMENTO CORRETO ESPERADO:');
  
  console.log('\n1️⃣ Botão "Processar com IA" GERAL:');
  console.log('📤 Envia: { content: "", type: "exam_result", IG: "32 semanas", BCF: "140 bpm" }');
  console.log('📥 N8N retorna: { processed_content: "texto completo", IG: "resposta IG", BCF: "resposta BCF" }');
  console.log('🎯 Resultado: Resultado Final + campos IG e BCF preenchidos');
  
  console.log('\n2️⃣ Botão de IA INDIVIDUAL:');
  console.log('📤 Envia: { content: "prompt específico para IG", type: "exam_result" }');
  console.log('📥 N8N retorna: { processed_content: "resposta específica para IG" }');
  console.log('🎯 Resultado: Apenas campo IG preenchido');
}

console.log('🚀 Scripts disponíveis:');
console.log('testAIBehaviorProblems() - Monitora comportamento atual');
console.log('testN8NDirectResponse() - Testa N8N diretamente');
console.log('generateProblemReport() - Gera relatório dos problemas');
console.log('simulateCorrectBehavior() - Mostra comportamento esperado');

// Auto-ativar monitoramento
if (typeof window !== 'undefined' && window.supabase) {
  testAIBehaviorProblems();
}