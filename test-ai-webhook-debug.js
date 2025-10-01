// Script para testar a Edge Function ai-webhook corrigida
// Execute no console do navegador após fazer login no sistema

async function testAIWebhookFixed() {
  console.log('🔍 Testando Edge Function ai-webhook corrigida...');
  
  // Simular dados que seriam enviados pelo sistema
  const testCases = [
    {
      name: 'Teste básico - apenas content e type',
      payload: {
        content: 'Paciente com dor abdominal há 2 dias',
        type: 'main_complaint'
      }
    },
    {
      name: 'Teste com campos dinâmicos (como enviado pelo sistema)',
      payload: {
        content: '',
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '32 semanas',
        DUM: '2024-01-15',
        BCF: '140 bpm',
        peso_fetal: '1800g',
        apresentacao: 'Cefálica'
      }
    },
    {
      name: 'Teste com content e campos dinâmicos',
      payload: {
        content: 'Exame de ultrassom realizado',
        type: 'exam_result',
        IG: '28 semanas',
        peso_fetal: '1200g'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log('Payload enviado:', testCase.payload);
    
    try {
      // Usar o cliente Supabase global se disponível
      if (typeof window !== 'undefined' && window.supabase) {
        const startTime = Date.now();
        
        const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
          body: testCase.payload
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (error) {
          console.error('❌ Erro:', error);
          console.error('Detalhes do erro:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          });
          
          // Se há detalhes adicionais no erro, mostrar
          if (error.context) {
            console.error('Contexto do erro:', error.context);
          }
        } else {
          console.log(`✅ Sucesso (${duration}ms):`, data);
          
          // Verificar se a resposta tem o formato esperado
          if (data && data.success && data.processed_content) {
            console.log('📄 Conteúdo processado:', data.processed_content);
          } else {
            console.warn('⚠️ Resposta em formato inesperado:', data);
          }
        }
      } else {
        console.log('⚠️ Cliente Supabase não encontrado. Execute este script no contexto da aplicação.');
        break;
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
    }
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🏁 Teste da Edge Function concluído');
}

// Função para testar diretamente a URL do webhook N8N
async function testN8NWebhookDirect() {
  console.log('🔗 Testando webhook N8N diretamente...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  const testPayload = {
    text: 'Teste direto do webhook após correções',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '30 semanas',
    BCF: '145 bpm'
  };
  
  try {
    console.log('Payload enviado para N8N:', testPayload);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sistema.saude.app'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Resposta completa:', responseText);
    
    if (!response.ok) {
      console.error('❌ Webhook N8N retornou erro:', response.status, responseText);
    } else {
      console.log('✅ Webhook N8N funcionando');
      
      // Tentar fazer parse da resposta
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('📄 Resposta JSON:', jsonResponse);
      } catch (e) {
        console.log('📄 Resposta em texto puro:', responseText);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar webhook N8N:', error);
  }
}

// Função para interceptar e monitorar chamadas da aplicação
function monitorAIRequests() {
  console.log('🔍 Iniciando monitoramento de requisições AI...');
  
  // Interceptar fetch para monitorar chamadas
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // Verificar se é uma chamada para a Edge Function
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('🤖 Interceptada chamada AI:', {
        url,
        method: options?.method,
        body: options?.body ? JSON.parse(options.body) : null
      });
      
      const response = await originalFetch.apply(this, args);
      
      // Clonar resposta para poder ler o conteúdo
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('📥 Resposta AI:', responseData);
      } catch (e) {
        console.log('📥 Resposta AI (texto):', await clonedResponse.text());
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo. Use a aplicação normalmente.');
}

// Instruções de uso
console.log('🚀 Scripts disponíveis:');
console.log('testAIWebhookFixed() - Testa Edge Function corrigida');
console.log('testN8NWebhookDirect() - Testa webhook N8N diretamente');
console.log('monitorAIRequests() - Monitora requisições AI em tempo real');

// Auto-executar se estiver no contexto correto
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático...');
  testAIWebhookFixed();
}