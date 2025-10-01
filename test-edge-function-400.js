// Script para testar a Edge Function ai-webhook corrigida (versão 88)
// Execute no console do navegador após fazer login

async function testEdgeFunctionFixed() {
  console.log('🔍 Testando Edge Function ai-webhook corrigida (v88)...');
  
  const testCases = [
    {
      name: 'Teste 1: Sem parâmetros (deve falhar)',
      payload: {},
      expectError: true
    },
    {
      name: 'Teste 2: Apenas type, sem content (deve falhar)',
      payload: { type: 'main_complaint' },
      expectError: true
    },
    {
      name: 'Teste 3: Apenas content, sem type (deve falhar)',
      payload: { content: 'Teste de conteúdo' },
      expectError: true
    },
    {
      name: 'Teste 4: Content vazio, sem campos dinâmicos (deve falhar)',
      payload: { content: '', type: 'main_complaint' },
      expectError: true
    },
    {
      name: 'Teste 5: Content apenas com espaços (deve falhar)',
      payload: { content: '   ', type: 'main_complaint' },
      expectError: true
    },
    {
      name: 'Teste 6: Parâmetros válidos (deve funcionar)',
      payload: { 
        content: 'Paciente com dor abdominal há 2 dias',
        type: 'main_complaint'
      },
      expectError: false
    },
    {
      name: 'Teste 7: Campos dinâmicos sem content (deve funcionar agora)',
      payload: { 
        content: '',
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '32 semanas',
        BCF: '140 bpm'
      },
      expectError: false
    },
    {
      name: 'Teste 8: Apenas campos dinâmicos, sem content (deve funcionar)',
      payload: { 
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '28 semanas',
        peso_fetal: '1200g',
        apresentacao: 'Cefálica'
      },
      expectError: false
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log('Payload:', testCase.payload);
    console.log('Espera erro:', testCase.expectError ? 'Sim' : 'Não');
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
        body: testCase.payload
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`❌ Erro (${duration}ms):`, error);
        
        if (testCase.expectError) {
          console.log('✅ Comportamento esperado - erro conforme previsto');
          successCount++;
        } else {
          console.log('❌ Comportamento inesperado - erro não esperado');
          failCount++;
        }
      } else {
        console.log(`✅ Sucesso (${duration}ms):`, data);
        
        if (testCase.expectError) {
          console.log('❌ Comportamento inesperado - sucesso não esperado');
          failCount++;
        } else {
          console.log('✅ Comportamento esperado - sucesso conforme previsto');
          successCount++;
          
          // Verificar se a resposta tem o formato esperado
          if (data && data.success && data.processed_content) {
            console.log('📄 Conteúdo processado:', data.processed_content.substring(0, 100) + '...');
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      failCount++;
    }
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🏁 Teste concluído:`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log(`📊 Taxa de sucesso: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('🎉 Todos os testes passaram! Edge Function corrigida com sucesso.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
}

// Função para testar cenário real do sistema
async function testRealScenario() {
  console.log('🎯 Testando cenário real do sistema...');
  
  // Simular exatamente o que o sistema envia
  const realPayload = {
    content: '', // String vazia quando há apenas campos dinâmicos
    type: 'exam_result',
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas e 3 dias',
    DUM: '2024-01-15',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica',
    placenta: 'Anterior, grau II',
    liquido_amniotico: 'Normal'
  };
  
  console.log('Payload real do sistema:', realPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: realPayload
    });
    
    if (error) {
      console.error('❌ Erro no cenário real:', error);
      return false;
    } else {
      console.log('✅ Cenário real funcionando:', data);
      return true;
    }
  } catch (err) {
    console.error('❌ Erro inesperado no cenário real:', err);
    return false;
  }
}

// Função para monitorar requisições em tempo real
function monitorRequests() {
  console.log('🔍 Monitorando requisições...');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('🚀 Requisição interceptada:', {
        url,
        method: options?.method,
        body: options?.body ? JSON.parse(options.body) : null
      });
      
      const response = await originalFetch.apply(this, args);
      console.log('📥 Resposta:', {
        status: response.status,
        statusText: response.statusText
      });
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo');
}

console.log('🚀 Scripts disponíveis:');
console.log('testEdgeFunctionFixed() - Testa Edge Function corrigida');
console.log('testRealScenario() - Testa cenário real do sistema');
console.log('monitorRequests() - Monitora requisições');

// Auto-executar se estiver no contexto correto
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático...');
  testEdgeFunctionFixed().then(() => {
    console.log('\n🎯 Testando cenário real...');
    return testRealScenario();
  });
}