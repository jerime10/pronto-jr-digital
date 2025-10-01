// Script para testar o retorno de campos individuais do N8N (versão 89)
// Execute no console do navegador após fazer login

async function testIndividualFieldsResponse() {
  console.log('🔍 Testando retorno de campos individuais do N8N (v89)...');
  
  // Teste com campos dinâmicos para ver como o N8N responde
  const testPayload = {
    content: '',
    type: 'exam_result',
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica',
    placenta: 'Anterior',
    liquido_amniotico: 'Normal'
  };
  
  console.log('📤 Enviando payload:', testPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('📥 Resposta completa da Edge Function:', data);
    
    if (data && data.success) {
      console.log('✅ Processamento bem-sucedido!');
      
      // Verificar conteúdo processado (Resultado Final)
      if (data.processed_content) {
        console.log('📄 Resultado Final:', data.processed_content);
      }
      
      // Verificar campos individuais
      if (data.individual_fields) {
        console.log('🎯 Campos individuais recebidos:');
        Object.entries(data.individual_fields).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        // Simular como seria aplicado aos campos do formulário
        console.log('\n🔄 Como seria aplicado aos campos:');
        Object.entries(data.individual_fields).forEach(([key, value]) => {
          console.log(`  Campo "${key}" seria preenchido com: "${value}"`);
        });
      } else {
        console.log('⚠️ Nenhum campo individual retornado');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

// Função para simular resposta do N8N com campos individuais
function simulateN8NWithIndividualFields() {
  console.log('🎯 Simulando resposta do N8N com campos individuais...');
  
  // Exemplo de como o N8N deveria responder
  const mockN8NResponse = {
    processed_content: 'Exame de ultrassom obstétrico realizado em gestante de 32 semanas. Feto único, vivo, em apresentação cefálica. Batimentos cardíacos fetais normais. Peso fetal estimado em 1800g, adequado para idade gestacional. Placenta anterior com grau de maturação normal. Volume de líquido amniótico dentro da normalidade.',
    individual_fields: {
      IG: '32 semanas - Idade gestacional compatível com desenvolvimento fetal adequado',
      BCF: '140 bpm - Frequência cardíaca fetal normal, ritmo regular',
      peso_fetal: '1800g - Peso estimado dentro da normalidade para IG atual',
      apresentacao: 'Cefálica - Apresentação fetal adequada para o parto',
      placenta: 'Anterior, grau II - Placenta com localização e maturação normais',
      liquido_amniotico: 'Normal - Volume de líquido amniótico adequado (ILA normal)'
    }
  };
  
  console.log('📊 Resposta simulada:', mockN8NResponse);
  
  // Simular processamento
  console.log('\n🔄 Processamento simulado:');
  console.log('1. Resultado Final seria preenchido com:', mockN8NResponse.processed_content);
  console.log('2. Campos individuais seriam preenchidos:');
  Object.entries(mockN8NResponse.individual_fields).forEach(([key, value]) => {
    console.log(`   - Campo "${key}": ${value}`);
  });
}

// Função para testar diferentes cenários
async function testDifferentScenarios() {
  console.log('🧪 Testando diferentes cenários...');
  
  const scenarios = [
    {
      name: 'Cenário 1: Apenas alguns campos',
      payload: {
        content: '',
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '28 semanas',
        BCF: '150 bpm'
      }
    },
    {
      name: 'Cenário 2: Todos os campos',
      payload: {
        content: '',
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '36 semanas',
        BCF: '135 bpm',
        peso_fetal: '2500g',
        apresentacao: 'Cefálica',
        placenta: 'Posterior',
        liquido_amniotico: 'Oligoidrâmnio leve'
      }
    },
    {
      name: 'Cenário 3: Com conteúdo no textarea',
      payload: {
        content: 'Exame realizado com paciente em jejum',
        type: 'exam_result',
        selectedModelTitle: 'Ultrassom Obstétrico',
        IG: '30 semanas'
      }
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📋 ${scenario.name}`);
    console.log('Payload:', scenario.payload);
    
    try {
      const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
        body: scenario.payload
      });
      
      if (error) {
        console.error('❌ Erro:', error.message);
      } else {
        console.log('✅ Sucesso!');
        console.log('  Resultado Final:', data.processed_content ? 'Presente' : 'Ausente');
        console.log('  Campos individuais:', data.individual_fields ? Object.keys(data.individual_fields).length : 0);
      }
    } catch (err) {
      console.error('❌ Erro:', err.message);
    }
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Função para monitorar o processamento em tempo real
function monitorIndividualFieldsProcessing() {
  console.log('🔍 Monitorando processamento de campos individuais...');
  
  // Interceptar chamadas para a Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('🚀 Interceptada chamada AI:', {
        url,
        payload: options?.body ? JSON.parse(options.body) : null
      });
      
      const response = await originalFetch.apply(this, args);
      
      // Clonar resposta para análise
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('📥 Resposta AI interceptada:', {
          success: responseData.success,
          hasProcessedContent: !!responseData.processed_content,
          hasIndividualFields: !!responseData.individual_fields,
          individualFieldsCount: responseData.individual_fields ? Object.keys(responseData.individual_fields).length : 0
        });
        
        if (responseData.individual_fields) {
          console.log('🎯 Campos individuais detectados:', Object.keys(responseData.individual_fields));
        }
      } catch (e) {
        console.log('📥 Resposta AI (não JSON):', await clonedResponse.text());
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo. Use a aplicação normalmente.');
}

console.log('🚀 Scripts disponíveis:');
console.log('testIndividualFieldsResponse() - Testa retorno de campos individuais');
console.log('simulateN8NWithIndividualFields() - Simula resposta ideal do N8N');
console.log('testDifferentScenarios() - Testa diferentes cenários');
console.log('monitorIndividualFieldsProcessing() - Monitora processamento em tempo real');

// Auto-executar teste
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático...');
  testIndividualFieldsResponse().then(() => {
    console.log('\n🎯 Simulando resposta ideal...');
    simulateN8NWithIndividualFields();
  });
}