// Script de debug profundo para identificar onde está o problema
// Execute no console do navegador após fazer login

let deepDebugResults = {
  interceptedCalls: [],
  frontendLogs: [],
  edgeFunctionLogs: []
};

function deepDebugPayload() {
  console.log('🔍 INICIANDO DEBUG PROFUNDO...');
  
  // Resetar resultados
  deepDebugResults = {
    interceptedCalls: [],
    frontendLogs: [],
    edgeFunctionLogs: []
  };
  
  // Interceptar console.log para capturar logs do frontend
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('🎯')) {
      deepDebugResults.frontendLogs.push({
        timestamp: new Date().toISOString(),
        message: args.join(' ')
      });
    }
    return originalConsoleLog.apply(this, args);
  };
  
  // Interceptar fetch para Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTAÇÃO DETALHADA ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      
      // Análise super detalhada
      const analysis = {
        timestamp: new Date().toISOString(),
        url,
        method: options?.method || 'GET',
        headers: options?.headers || {},
        body: requestBody,
        bodyString: options?.body || '',
        allKeys: Object.keys(requestBody || {}),
        dynamicKeys: [],
        controlKeys: [],
        hasText: false,
        hasContent: false,
        hasType: false,
        hasDynamicFields: false
      };
      
      if (requestBody) {
        analysis.allKeys.forEach(key => {
          if (['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)) {
            analysis.controlKeys.push(key);
            if (key === 'text') analysis.hasText = true;
            if (key === 'content') analysis.hasContent = true;
            if (key === 'type') analysis.hasType = true;
          } else {
            analysis.dynamicKeys.push(key);
          }
        });
        
        analysis.hasDynamicFields = analysis.dynamicKeys.length > 0 && 
          analysis.dynamicKeys.some(key => requestBody[key] && requestBody[key].toString().trim());
      }
      
      console.log('📊 ANÁLISE SUPER DETALHADA:');
      console.log('   URL:', analysis.url);
      console.log('   Method:', analysis.method);
      console.log('   Body String:', analysis.bodyString);
      console.log('   Todas as chaves:', analysis.allKeys);
      console.log('   Chaves dinâmicas:', analysis.dynamicKeys);
      console.log('   Chaves de controle:', analysis.controlKeys);
      console.log('   Tem text:', analysis.hasText);
      console.log('   Tem content:', analysis.hasContent);
      console.log('   Tem type:', analysis.hasType);
      console.log('   Tem campos dinâmicos:', analysis.hasDynamicFields);
      
      // Verificar se é o problema que estamos procurando
      if (analysis.hasDynamicFields && (analysis.hasText || analysis.hasContent || analysis.hasType)) {
        console.error('❌ PROBLEMA CONFIRMADO: Enviando text/content/type junto com campos dinâmicos!');
        console.error('   Campos dinâmicos:', analysis.dynamicKeys);
        console.error('   Campos de controle presentes:', analysis.controlKeys);
        
        // Mostrar valores exatos
        analysis.controlKeys.forEach(key => {
          console.error(`   ${key}: "${requestBody[key]}"`);
        });
        analysis.dynamicKeys.forEach(key => {
          console.log(`   ${key}: "${requestBody[key]}"`);
        });
      } else if (analysis.hasDynamicFields && !analysis.hasText && !analysis.hasContent && !analysis.hasType) {
        console.log('✅ CORRETO: Enviando apenas campos dinâmicos');
      } else if (!analysis.hasDynamicFields && (analysis.hasText || analysis.hasContent || analysis.hasType)) {
        console.log('✅ CORRETO: Enviando apenas text/content/type (requisição individual)');
      } else {
        console.warn('⚠️ SITUAÇÃO INESPERADA:', analysis);
      }
      
      deepDebugResults.interceptedCalls.push(analysis);
      
      const response = await originalFetch.apply(this, args);
      
      // Analisar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\\n📥 === RESPOSTA DETALHADA ===');
        console.log('Status:', response.status);
        console.log('OK:', response.ok);
        console.log('Success:', responseData.success);
        console.log('Error:', responseData.error);
        console.log('Processed Content:', !!responseData.processed_content);
        console.log('Individual Fields:', !!responseData.individual_fields);
        
        if (responseData.individual_fields) {
          console.log('Campos individuais:', Object.keys(responseData.individual_fields));
        }
        
        analysis.response = {
          status: response.status,
          ok: response.ok,
          success: responseData.success,
          error: responseData.error,
          hasProcessedContent: !!responseData.processed_content,
          hasIndividualFields: !!responseData.individual_fields,
          individualFieldsKeys: responseData.individual_fields ? Object.keys(responseData.individual_fields) : []
        };
        
      } catch (e) {
        console.error('❌ Erro ao analisar resposta:', e);
        analysis.response = { error: e.message };
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Debug profundo ativo.');
  console.log('📋 Execute o teste e observe os logs detalhados.');
}

// Função para verificar o estado atual do useAIProcessing
function checkUseAIProcessingState() {
  console.log('\\n🔍 VERIFICANDO ESTADO DO useAIProcessing...');
  
  // Tentar acessar o código do useAIProcessing através do React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detectado');
  } else {
    console.log('⚠️ React DevTools não detectado');
  }
  
  // Verificar se há algum cache ou estado persistente
  console.log('🔍 Verificando localStorage:', Object.keys(localStorage));
  console.log('🔍 Verificando sessionStorage:', Object.keys(sessionStorage));
  
  // Verificar se o service worker está interferindo
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('🔍 Service Workers:', registrations.length);
      registrations.forEach(registration => {
        console.log('   SW:', registration.scope);
      });
    });
  }
}

// Função para forçar reload sem cache
function forceReloadWithoutCache() {
  console.log('🔄 FORÇANDO RELOAD SEM CACHE...');
  window.location.reload(true);
}

// Função para testar diretamente o useAIProcessing
async function testUseAIProcessingDirectly() {
  console.log('\\n🧪 TESTANDO useAIProcessing DIRETAMENTE...');
  
  // Simular chamada com campos dinâmicos
  const testPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  console.log('📤 Testando payload:', testPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testPayload
    });
    
    console.log('📥 Resposta direta:', { data, error });
    
    if (error) {
      console.error('❌ Erro na chamada direta:', error);
    } else {
      console.log('✅ Chamada direta bem-sucedida');
      if (data.individual_fields) {
        console.log('🎯 Campos individuais retornados:', Object.keys(data.individual_fields));
      } else {
        console.log('⚠️ Nenhum campo individual retornado');
      }
    }
  } catch (err) {
    console.error('❌ Exceção na chamada direta:', err);
  }
}

// Função para gerar relatório completo
function generateDeepReport() {
  console.log('\\n📋 === RELATÓRIO PROFUNDO ===');
  
  console.log('\\n1️⃣ LOGS DO FRONTEND:');
  if (deepDebugResults.frontendLogs.length === 0) {
    console.log('   ⚠️ Nenhum log do frontend capturado');
  } else {
    deepDebugResults.frontendLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.message}`);
    });
  }
  
  console.log('\\n2️⃣ CHAMADAS INTERCEPTADAS:');
  if (deepDebugResults.interceptedCalls.length === 0) {
    console.log('   ⚠️ Nenhuma chamada interceptada');
  } else {
    const lastCall = deepDebugResults.interceptedCalls[deepDebugResults.interceptedCalls.length - 1];
    console.log('   Última chamada:');
    console.log('     Chaves dinâmicas:', lastCall.dynamicKeys);
    console.log('     Chaves de controle:', lastCall.controlKeys);
    console.log('     Tem campos dinâmicos:', lastCall.hasDynamicFields);
    console.log('     Tem text/content/type:', lastCall.hasText || lastCall.hasContent || lastCall.hasType);
    console.log('     Status resposta:', lastCall.response?.status);
    console.log('     Campos individuais:', lastCall.response?.individualFieldsKeys);
  }
  
  console.log('\\n3️⃣ DIAGNÓSTICO:');
  if (deepDebugResults.interceptedCalls.length > 0) {
    const lastCall = deepDebugResults.interceptedCalls[deepDebugResults.interceptedCalls.length - 1];
    if (lastCall.hasDynamicFields && (lastCall.hasText || lastCall.hasContent || lastCall.hasType)) {
      console.log('   ❌ PROBLEMA CONFIRMADO: useAIProcessing ainda está enviando text/content/type');
      console.log('   🔧 AÇÃO: Verificar se a correção foi aplicada corretamente');
      console.log('   💡 SUGESTÃO: Pode ser necessário hard refresh ou verificar cache');
    } else if (lastCall.hasDynamicFields && !lastCall.hasText && !lastCall.hasContent && !lastCall.hasType) {
      console.log('   ✅ CORREÇÃO APLICADA: Enviando apenas campos dinâmicos');
      if (!lastCall.response?.hasIndividualFields) {
        console.log('   ⚠️ MAS: N8N não está retornando campos individuais');
        console.log('   🔧 AÇÃO: Verificar configuração do N8N');
      }
    } else {
      console.log('   ⚠️ SITUAÇÃO INESPERADA: Verificar logs acima');
    }
  }
}

// Função para executar debug completo
async function runDeepDebug() {
  console.log('🔍 EXECUTANDO DEBUG PROFUNDO COMPLETO...');
  
  // Verificar estado
  checkUseAIProcessingState();
  
  // Ativar monitoramento
  deepDebugPayload();
  
  // Testar diretamente
  await testUseAIProcessingDirectly();
  
  console.log('\\n✅ Debug profundo configurado.');
  console.log('📋 Execute o processamento no navegador e depois use generateDeepReport()');
}

console.log('🚀 Scripts de debug profundo disponíveis:');
console.log('deepDebugPayload() - Monitora com detalhes extremos');
console.log('checkUseAIProcessingState() - Verifica estado do sistema');
console.log('testUseAIProcessingDirectly() - Testa chamada direta');
console.log('forceReloadWithoutCache() - Força reload sem cache');
console.log('generateDeepReport() - Gera relatório completo');
console.log('runDeepDebug() - Executa debug completo');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando debug profundo automático...');
  runDeepDebug();
}