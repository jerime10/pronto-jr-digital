// Script de diagnóstico profundo para campos individuais
// Execute no console do navegador após fazer login

let testResults = {
  n8nResponse: null,
  edgeFunctionResponse: null,
  frontendCallbacks: [],
  errors: []
};

function deepDiagnosis() {
  console.log('🔍 INICIANDO DIAGNÓSTICO PROFUNDO...');
  
  // Resetar resultados
  testResults = {
    n8nResponse: null,
    edgeFunctionResponse: null,
    frontendCallbacks: [],
    errors: []
  };
  
  // 1. Interceptar fetch para Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Request Body:', requestBody);
      
      // Verificar se tem campos dinâmicos
      const dynamicFields = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      console.log('🎯 Campos dinâmicos detectados:', dynamicFields);
      
      const response = await originalFetch.apply(this, args);
      
      // Clonar e analisar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        testResults.edgeFunctionResponse = responseData;
        
        console.log('📥 Edge Function Response:', responseData);
        console.log('✅ Success:', responseData.success);
        console.log('📄 Processed Content:', responseData.processed_content ? 'PRESENTE' : 'AUSENTE');
        console.log('🎯 Individual Fields:', responseData.individual_fields ? 'PRESENTE' : 'AUSENTE');
        
        if (responseData.individual_fields) {
          console.log('📊 Campos individuais:', Object.keys(responseData.individual_fields));
          Object.entries(responseData.individual_fields).forEach(([key, value]) => {
            console.log(`   ${key}: ${value.substring(0, 50)}...`);
          });
        } else {
          console.log('❌ PROBLEMA: Edge Function não retornou individual_fields');
          testResults.errors.push('Edge Function não retornou individual_fields');
        }
        
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
        testResults.errors.push('Erro ao fazer parse da resposta da Edge Function');
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  // 2. Interceptar console.log para capturar callbacks do frontend
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args[0];
    if (typeof message === 'string') {
      if (message.includes('[useAtendimentoHelpers]')) {
        console.log('\n🎯 === CALLBACK FRONTEND DETECTADO ===');
        testResults.frontendCallbacks.push(args);
        originalLog.apply(this, args);
      } else if (message.includes('[NovoAtendimento]')) {
        console.log('\n🎯 === NOVO ATENDIMENTO CALLBACK ===');
        testResults.frontendCallbacks.push(args);
        originalLog.apply(this, args);
      } else {
        originalLog.apply(this, args);
      }
    } else {
      originalLog.apply(this, args);
    }
  };
  
  console.log('✅ Diagnóstico ativo. Execute o processamento de IA agora.');
  console.log('📋 Aguardando interação do usuário...');
}

// Função para testar N8N diretamente
async function testN8NDirectly() {
  console.log('\n🔗 TESTANDO N8N DIRETAMENTE...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  const testPayload = {
    text: '',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica'
  };
  
  console.log('📤 Enviando para N8N:', testPayload);
  
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
    console.log('📥 Resposta bruta N8N:', responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      testResults.n8nResponse = jsonResponse;
      
      console.log('📊 Resposta JSON N8N:', jsonResponse);
      
      // Verificar campos individuais
      const expectedFields = ['IG', 'BCF', 'peso_fetal', 'apresentacao'];
      const foundFields = [];
      
      expectedFields.forEach(field => {
        if (jsonResponse[field]) {
          foundFields.push(field);
          console.log(`✅ ${field}: ${jsonResponse[field]}`);
        } else {
          console.log(`❌ ${field}: NÃO ENCONTRADO`);
        }
      });
      
      if (foundFields.length === 0) {
        console.log('🚨 PROBLEMA CRÍTICO: N8N não está retornando campos individuais!');
        testResults.errors.push('N8N não retorna campos individuais');
      } else {
        console.log(`✅ N8N retornou ${foundFields.length}/${expectedFields.length} campos`);
      }
      
      return jsonResponse;
      
    } catch (parseError) {
      console.log('📝 N8N retornou texto puro:', responseText);
      testResults.errors.push('N8N retornou texto em vez de JSON');
      return responseText;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N:', error);
    testResults.errors.push(`Erro ao testar N8N: ${error.message}`);
    return null;
  }
}

// Função para testar Edge Function diretamente
async function testEdgeFunctionDirectly() {
  console.log('\n🔧 TESTANDO EDGE FUNCTION DIRETAMENTE...');
  
  const testPayload = {
    content: '',
    type: 'exam_result',
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica'
  };
  
  console.log('📤 Enviando para Edge Function:', testPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro Edge Function:', error);
      testResults.errors.push(`Erro Edge Function: ${error.message}`);
      return null;
    }
    
    testResults.edgeFunctionResponse = data;
    console.log('📥 Resposta Edge Function:', data);
    
    if (data.individual_fields) {
      console.log('✅ Edge Function retornou campos individuais:', Object.keys(data.individual_fields));
      return data;
    } else {
      console.log('❌ Edge Function NÃO retornou campos individuais');
      testResults.errors.push('Edge Function não retornou individual_fields');
      return data;
    }
    
  } catch (err) {
    console.error('❌ Erro ao testar Edge Function:', err);
    testResults.errors.push(`Erro ao testar Edge Function: ${err.message}`);
    return null;
  }
}

// Função para gerar relatório completo
function generateDiagnosisReport() {
  console.log('\n📋 === RELATÓRIO DE DIAGNÓSTICO ===');
  
  console.log('\n1️⃣ TESTE N8N:');
  if (testResults.n8nResponse) {
    console.log('✅ N8N respondeu');
    const hasIndividualFields = Object.keys(testResults.n8nResponse).some(key => 
      ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
    );
    console.log(`${hasIndividualFields ? '✅' : '❌'} Campos individuais: ${hasIndividualFields ? 'PRESENTES' : 'AUSENTES'}`);
  } else {
    console.log('❌ N8N não respondeu ou erro');
  }
  
  console.log('\n2️⃣ TESTE EDGE FUNCTION:');
  if (testResults.edgeFunctionResponse) {
    console.log('✅ Edge Function respondeu');
    console.log(`${testResults.edgeFunctionResponse.individual_fields ? '✅' : '❌'} Individual fields: ${testResults.edgeFunctionResponse.individual_fields ? 'PRESENTES' : 'AUSENTES'}`);
  } else {
    console.log('❌ Edge Function não respondeu ou erro');
  }
  
  console.log('\n3️⃣ CALLBACKS FRONTEND:');
  console.log(`📊 Total de callbacks capturados: ${testResults.frontendCallbacks.length}`);
  testResults.frontendCallbacks.forEach((callback, index) => {
    console.log(`   ${index + 1}. ${callback[0]}`);
  });
  
  console.log('\n4️⃣ ERROS IDENTIFICADOS:');
  if (testResults.errors.length === 0) {
    console.log('✅ Nenhum erro identificado');
  } else {
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n5️⃣ DIAGNÓSTICO:');
  if (testResults.errors.includes('N8N não retorna campos individuais')) {
    console.log('🚨 PROBLEMA PRINCIPAL: N8N não está configurado para retornar campos individuais');
    console.log('💡 SOLUÇÃO: Configurar workflow N8N para retornar JSON com campos separados');
  } else if (testResults.errors.includes('Edge Function não retornou individual_fields')) {
    console.log('🚨 PROBLEMA PRINCIPAL: Edge Function não está extraindo campos individuais');
    console.log('💡 SOLUÇÃO: Verificar lógica de extração na Edge Function');
  } else if (testResults.frontendCallbacks.length === 0) {
    console.log('🚨 PROBLEMA PRINCIPAL: Callbacks do frontend não estão sendo chamados');
    console.log('💡 SOLUÇÃO: Verificar fluxo de processAIContent e onIndividualFieldsUpdate');
  } else {
    console.log('🤔 Problema não identificado claramente. Executar testes manuais.');
  }
}

// Função para executar todos os testes
async function runFullDiagnosis() {
  console.log('🔍 EXECUTANDO DIAGNÓSTICO COMPLETO...');
  
  // Ativar monitoramento
  deepDiagnosis();
  
  // Testar N8N
  await testN8NDirectly();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Testar Edge Function
  await testEdgeFunctionDirectly();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gerar relatório
  generateDiagnosisReport();
}

console.log('🚀 Scripts de diagnóstico disponíveis:');
console.log('deepDiagnosis() - Ativa monitoramento profundo');
console.log('testN8NDirectly() - Testa N8N diretamente');
console.log('testEdgeFunctionDirectly() - Testa Edge Function diretamente');
console.log('generateDiagnosisReport() - Gera relatório completo');
console.log('runFullDiagnosis() - Executa todos os testes');

// Auto-executar diagnóstico completo
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando diagnóstico automático...');
  runFullDiagnosis();
}