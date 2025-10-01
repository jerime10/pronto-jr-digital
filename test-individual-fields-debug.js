// Script para debugar especificamente o problema dos campos individuais
// Execute no console do navegador após fazer login

let debugData = {
  edgeFunctionResponse: null,
  useAtendimentoHelpersFlow: [],
  resultadoExamesFlow: []
};

function debugIndividualFields() {
  console.log('🔍 DEBUGANDO CAMPOS INDIVIDUAIS...');
  
  // Resetar dados
  debugData = {
    edgeFunctionResponse: null,
    useAtendimentoHelpersFlow: [],
    resultadoExamesFlow: []
  };
  
  // Interceptar console.log para capturar logs específicos
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Capturar logs do useAtendimentoHelpers
    if (message.includes('[useAtendimentoHelpers]')) {
      debugData.useAtendimentoHelpersFlow.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
    }
    
    // Capturar logs do ResultadoExames
    if (message.includes('[ResultadoExames]')) {
      debugData.resultadoExamesFlow.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
    }
    
    return originalConsoleLog.apply(this, args);
  };
  
  // Interceptar fetch para Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload para Edge Function:', requestBody);
      
      const response = await originalFetch.apply(this, args);
      
      // Analisar resposta da Edge Function
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        debugData.edgeFunctionResponse = responseData;
        
        console.log('\\n📥 === RESPOSTA DA EDGE FUNCTION ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        console.log('Processed Content:', !!responseData.processed_content);
        console.log('Individual Fields:', !!responseData.individual_fields);
        
        if (responseData.individual_fields) {
          console.log('🎯 CAMPOS INDIVIDUAIS NA RESPOSTA:');
          Object.entries(responseData.individual_fields).forEach(([key, value]) => {
            console.log(`   ${key}: "${value}"`);
          });
        } else {
          console.log('❌ NENHUM CAMPO INDIVIDUAL NA RESPOSTA');
          console.log('Resposta completa:', responseData);
        }
        
        // Verificar se o problema está na Edge Function ou no N8N
        if (!responseData.individual_fields && responseData.processed_content) {
          console.log('⚠️ PROBLEMA: N8N retornou apenas processed_content, sem individual_fields');
          console.log('Isso indica que o N8N não está processando os campos individuais corretamente');
        }
        
      } catch (e) {
        console.error('❌ Erro ao analisar resposta da Edge Function:', e);
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Debug ativo. Execute o teste agora!');
}

// Função para testar N8N diretamente
async function testN8NDirectly() {
  console.log('\\n🔗 TESTANDO N8N DIRETAMENTE...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  // Payload exato que deveria ser enviado
  const testPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    selectedModelTitle: 'Ultrassom Obstétrico',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Testando N8N com payload:', testPayload);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sistema.saude.app'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Status N8N:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Resposta N8N (texto):', responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📥 Resposta N8N (JSON):', jsonResponse);
      
      // Verificar campos individuais
      const individualFields = {};
      const expectedFields = ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'];
      
      expectedFields.forEach(field => {
        if (jsonResponse[field]) {
          individualFields[field] = jsonResponse[field];
        }
      });
      
      console.log('\\n🔍 ANÁLISE DA RESPOSTA N8N:');
      console.log('Campos individuais encontrados:', Object.keys(individualFields));
      console.log('Valores:', individualFields);
      
      if (Object.keys(individualFields).length > 0) {
        console.log('✅ N8N ESTÁ retornando campos individuais!');
        console.log('O problema pode estar na Edge Function não extraindo corretamente');
      } else {
        console.log('❌ N8N NÃO está retornando campos individuais');
        console.log('O problema está no N8N ou na configuração do workflow');
      }
      
      return jsonResponse;
      
    } catch (parseError) {
      console.log('📝 N8N retornou texto puro (não JSON)');
      return responseText;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N:', error);
    return null;
  }
}

// Função para verificar o fluxo do useAtendimentoHelpers
function analyzeUseAtendimentoHelpersFlow() {
  console.log('\\n🔍 ANALISANDO FLUXO useAtendimentoHelpers...');
  
  if (debugData.useAtendimentoHelpersFlow.length === 0) {
    console.log('⚠️ Nenhum log do useAtendimentoHelpers capturado');
    return;
  }
  
  debugData.useAtendimentoHelpersFlow.forEach((log, index) => {
    console.log(`${index + 1}. ${log.message}`);
  });
  
  // Verificar se detectou campos individuais
  const hasIndividualFieldsLog = debugData.useAtendimentoHelpersFlow.some(log => 
    log.message.includes('Processando APENAS campos individuais')
  );
  
  const hasResultadoFinalLog = debugData.useAtendimentoHelpersFlow.some(log => 
    log.message.includes('Atualizando campo principal')
  );
  
  console.log('\\n📊 ANÁLISE:');
  console.log('Detectou campos individuais:', hasIndividualFieldsLog);
  console.log('Atualizou Resultado Final:', hasResultadoFinalLog);
  
  if (!hasIndividualFieldsLog && hasResultadoFinalLog) {
    console.log('❌ PROBLEMA: useAtendimentoHelpers não detectou campos individuais');
    console.log('Isso indica que a Edge Function não está retornando individual_fields');
  }
}

// Função para gerar relatório completo
function generateDebugReport() {
  console.log('\\n📋 === RELATÓRIO DE DEBUG ===');
  
  console.log('\\n1️⃣ RESPOSTA DA EDGE FUNCTION:');
  if (debugData.edgeFunctionResponse) {
    console.log('   Success:', debugData.edgeFunctionResponse.success);
    console.log('   Tem processed_content:', !!debugData.edgeFunctionResponse.processed_content);
    console.log('   Tem individual_fields:', !!debugData.edgeFunctionResponse.individual_fields);
    
    if (debugData.edgeFunctionResponse.individual_fields) {
      console.log('   Campos individuais:', Object.keys(debugData.edgeFunctionResponse.individual_fields));
    }
  } else {
    console.log('   ⚠️ Nenhuma resposta capturada');
  }
  
  console.log('\\n2️⃣ FLUXO useAtendimentoHelpers:');
  analyzeUseAtendimentoHelpersFlow();
  
  console.log('\\n3️⃣ DIAGNÓSTICO:');
  if (debugData.edgeFunctionResponse) {
    if (!debugData.edgeFunctionResponse.individual_fields) {
      console.log('   🎯 PROBLEMA PRINCIPAL: Edge Function não retorna individual_fields');
      console.log('   🔧 AÇÃO: Verificar extração de campos na Edge Function');
    } else if (debugData.useAtendimentoHelpersFlow.length === 0) {
      console.log('   🎯 PROBLEMA: useAtendimentoHelpers não está sendo chamado');
      console.log('   🔧 AÇÃO: Verificar fluxo de callbacks');
    } else {
      console.log('   🎯 PROBLEMA: Lógica do useAtendimentoHelpers');
      console.log('   🔧 AÇÃO: Verificar condições de detecção de campos individuais');
    }
  }
}

// Função para executar debug completo
async function runCompleteDebug() {
  console.log('🔍 EXECUTANDO DEBUG COMPLETO...');
  
  // Ativar monitoramento
  debugIndividualFields();
  
  // Testar N8N diretamente
  await testN8NDirectly();
  
  console.log('\\n✅ Debug configurado.');
  console.log('📋 Execute o processamento no navegador e depois use generateDebugReport()');
}

console.log('🚀 Scripts de debug de campos individuais disponíveis:');
console.log('debugIndividualFields() - Monitora fluxo completo');
console.log('testN8NDirectly() - Testa N8N diretamente');
console.log('analyzeUseAtendimentoHelpersFlow() - Analisa logs do useAtendimentoHelpers');
console.log('generateDebugReport() - Gera relatório completo');
console.log('runCompleteDebug() - Executa debug completo');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando debug automático...');
  runCompleteDebug();
}