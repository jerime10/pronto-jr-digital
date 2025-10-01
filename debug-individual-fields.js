// Script de debug para monitorar o fluxo de campos individuais (versão com logs)
// Execute no console do navegador após fazer login

function debugIndividualFieldsWithLogs() {
  console.log('🔍 Iniciando debug completo de campos individuais...');
  
  // Interceptar todas as chamadas para a Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\n🚀 === CHAMADA INTERCEPTADA ===');
      console.log('URL:', url);
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado:', requestBody);
      
      // Identificar campos dinâmicos enviados
      const dynamicFields = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      console.log('🎯 Campos dinâmicos enviados:', dynamicFields);
      
      const response = await originalFetch.apply(this, args);
      
      // Clonar resposta para análise
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\n📥 === RESPOSTA RECEBIDA ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        console.log('Processed Content:', responseData.processed_content ? 'Presente' : 'Ausente');
        console.log('Individual Fields:', responseData.individual_fields ? 'Presente' : 'Ausente');
        
        if (responseData.individual_fields) {
          console.log('🎯 Campos individuais na resposta:');
          Object.entries(responseData.individual_fields).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        } else {
          console.log('⚠️ PROBLEMA: Nenhum campo individual na resposta!');
        }
      } catch (e) {
        console.error('❌ Erro ao fazer parse da resposta:', e);
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Debug ativo. Execute o processamento de IA normalmente.');
  console.log('📋 Logs esperados:');
  console.log('  1. 🚀 Chamada interceptada');
  console.log('  2. 📥 Resposta recebida');
  console.log('  3. 🔄 [useAtendimentoHelpers] Callback onSuccess chamado');
  console.log('  4. 🎯 [useAtendimentoHelpers] Processando campos individuais');
  console.log('  5. 🎯 [NovoAtendimento] handleDynamicFieldsChange chamado');
}

// Função para testar diretamente o fluxo com logs
async function testIndividualFieldsFlowWithLogs() {
  console.log('🧪 Testando fluxo de campos individuais com logs...');
  
  const testPayload = {
    content: '',
    type: 'exam_result',
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  console.log('📤 Enviando:', testPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('\n📥 Resposta completa:', data);
    
    // Verificar se a resposta tem o formato esperado
    if (data.success) {
      console.log('✅ Processamento bem-sucedido');
      
      if (data.processed_content) {
        console.log('📄 Resultado Final presente');
      }
      
      if (data.individual_fields) {
        console.log('🎯 Campos individuais presentes:', Object.keys(data.individual_fields));
        
        // Simular o que deveria acontecer no frontend
        console.log('\n🔄 Simulando processamento no frontend:');
        console.log('1. updateFormField("resultadoExames", processedContent) - ✅');
        console.log('2. onIndividualFieldsUpdate(individualFields) - ?');
        console.log('3. handleDynamicFieldsChange(fields) - ?');
        console.log('4. setDynamicFields(fields) - ?');
        
      } else {
        console.log('⚠️ Nenhum campo individual na resposta');
      }
    } else {
      console.log('❌ Processamento falhou');
    }
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

// Função para verificar se o N8N está retornando campos individuais
async function checkN8NResponse() {
  console.log('🔗 Verificando resposta do N8N...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  const testPayload = {
    text: '',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
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
    
    console.log('📊 Status da resposta N8N:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Resposta bruta do N8N:', responseText);
    
    // Tentar fazer parse da resposta
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📊 Resposta JSON do N8N:', jsonResponse);
      
      // Verificar se tem campos individuais
      const hasIndividualFields = Object.keys(jsonResponse).some(key => 
        ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
      );
      
      if (hasIndividualFields) {
        console.log('✅ N8N está retornando campos individuais!');
        console.log('🎯 Campos encontrados:');
        Object.entries(jsonResponse).forEach(([key, value]) => {
          if (['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)) {
            console.log(`  ${key}: ${value}`);
          }
        });
      } else {
        console.log('⚠️ N8N NÃO está retornando campos individuais');
        console.log('📋 Chaves disponíveis:', Object.keys(jsonResponse));
      }
      
    } catch (parseError) {
      console.log('📝 Resposta do N8N é texto puro:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N direto:', error);
  }
}

// Função para simular resposta ideal do N8N
function simulateIdealN8NResponse() {
  console.log('🎭 Simulando resposta ideal do N8N...');
  
  const idealResponse = {
    processed_content: 'Exame de ultrassom obstétrico realizado em gestante de 32 semanas. Feto único, vivo, em apresentação cefálica. Batimentos cardíacos fetais normais (140 bpm). Peso fetal estimado em 1800g, adequado para idade gestacional.',
    IG: '32 semanas - Idade gestacional compatível com desenvolvimento fetal adequado',
    BCF: '140 bpm - Frequência cardíaca fetal normal, ritmo regular',
    peso_fetal: '1800g - Peso estimado dentro da normalidade para IG atual'
  };
  
  console.log('📊 Resposta ideal:', idealResponse);
  
  console.log('\n🔄 Como seria processado:');
  console.log('1. Edge Function extrai campos individuais');
  console.log('2. Retorna: { success: true, processed_content: "...", individual_fields: {...} }');
  console.log('3. useAIProcessing chama onSuccess(processedContent, individualFields)');
  console.log('4. useAtendimentoHelpers chama onIndividualFieldsUpdate(individualFields)');
  console.log('5. NovoAtendimento chama handleDynamicFieldsChange(fields)');
  console.log('6. setDynamicFields atualiza os campos no estado');
  console.log('7. ResultadoExames re-renderiza com os novos valores');
}

console.log('🚀 Scripts de debug disponíveis:');
console.log('debugIndividualFieldsWithLogs() - Ativa monitoramento completo com logs');
console.log('testIndividualFieldsFlowWithLogs() - Testa fluxo direto com logs');
console.log('checkN8NResponse() - Verifica se N8N retorna campos individuais');
console.log('simulateIdealN8NResponse() - Simula resposta ideal');

// Auto-ativar debug
if (typeof window !== 'undefined' && window.supabase) {
  debugIndividualFieldsWithLogs();
}