// Script para testar especificamente se o N8N retorna campos individuais
// Execute no console do navegador após fazer login

async function testN8NIndividualFields() {
  console.log('🔍 Testando se N8N retorna campos individuais...');
  
  // Teste direto com o webhook N8N
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  const testPayload = {
    text: '',
    type: 'exam_result',
    timestamp: new Date().toISOString(),
    selectedModelTitle: 'Ultrassom Obstétrico',
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    apresentacao: 'Cefálica',
    placenta: 'Anterior',
    liquido_amniotico: 'Normal'
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
      
      // Verificar estrutura da resposta
      console.log('\n🔍 Análise da estrutura:');
      console.log('Chaves disponíveis:', Object.keys(jsonResponse));
      
      // Verificar se tem campos individuais
      const expectedFields = ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'];
      const foundFields = [];
      const missingFields = [];
      
      expectedFields.forEach(field => {
        if (jsonResponse.hasOwnProperty(field)) {
          foundFields.push(field);
          console.log(`✅ Campo "${field}": ${jsonResponse[field]}`);
        } else {
          missingFields.push(field);
          console.log(`❌ Campo "${field}": AUSENTE`);
        }
      });
      
      console.log('\n📊 Resumo:');
      console.log(`Campos encontrados: ${foundFields.length}/${expectedFields.length}`);
      console.log(`Campos presentes: [${foundFields.join(', ')}]`);
      console.log(`Campos ausentes: [${missingFields.join(', ')}]`);
      
      // Verificar se tem processed_content
      if (jsonResponse.processed_content || jsonResponse.text || jsonResponse.output) {
        console.log('✅ Conteúdo processado presente');
      } else {
        console.log('❌ Conteúdo processado ausente');
      }
      
      return {
        hasIndividualFields: foundFields.length > 0,
        foundFields,
        missingFields,
        response: jsonResponse
      };
      
    } catch (parseError) {
      console.log('📝 Resposta do N8N é texto puro:', responseText);
      return {
        hasIndividualFields: false,
        isTextResponse: true,
        response: responseText
      };
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar N8N direto:', error);
    return { error: error.message };
  }
}

// Função para testar via Edge Function
async function testEdgeFunctionIndividualFields() {
  console.log('\n🔗 Testando via Edge Function...');
  
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
  
  console.log('📤 Enviando via Edge Function:', testPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      return { error: error.message };
    }
    
    console.log('📥 Resposta da Edge Function:', data);
    
    // Analisar resposta
    console.log('\n🔍 Análise da resposta da Edge Function:');
    console.log('Success:', data.success);
    console.log('Processed Content:', data.processed_content ? 'Presente' : 'Ausente');
    console.log('Individual Fields:', data.individual_fields ? 'Presente' : 'Ausente');
    
    if (data.individual_fields) {
      console.log('🎯 Campos individuais encontrados:');
      Object.entries(data.individual_fields).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      return {
        hasIndividualFields: true,
        individualFields: data.individual_fields,
        processedContent: data.processed_content
      };
    } else {
      console.log('⚠️ Nenhum campo individual na resposta da Edge Function');
      return {
        hasIndividualFields: false,
        processedContent: data.processed_content
      };
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return { error: err.message };
  }
}

// Função para comparar as duas respostas
async function compareResponses() {
  console.log('🔄 Comparando respostas N8N vs Edge Function...');
  
  const n8nResult = await testN8NIndividualFields();
  const edgeResult = await testEdgeFunctionIndividualFields();
  
  console.log('\n📊 Comparação:');
  console.log('N8N tem campos individuais:', n8nResult.hasIndividualFields);
  console.log('Edge Function tem campos individuais:', edgeResult.hasIndividualFields);
  
  if (n8nResult.hasIndividualFields && !edgeResult.hasIndividualFields) {
    console.log('🚨 PROBLEMA: N8N retorna campos individuais, mas Edge Function não os extrai!');
  } else if (!n8nResult.hasIndividualFields && !edgeResult.hasIndividualFields) {
    console.log('🚨 PROBLEMA: N8N não está retornando campos individuais!');
  } else if (n8nResult.hasIndividualFields && edgeResult.hasIndividualFields) {
    console.log('✅ Ambos têm campos individuais. Problema pode estar no frontend.');
  }
  
  return { n8nResult, edgeResult };
}

// Função para simular resposta ideal
function simulateIdealFlow() {
  console.log('\n🎭 Simulando fluxo ideal...');
  
  const idealN8NResponse = {
    processed_content: 'Exame de ultrassom obstétrico realizado em gestante de 32 semanas...',
    IG: '32 semanas - Idade gestacional adequada',
    BCF: '140 bpm - Frequência cardíaca normal',
    peso_fetal: '1800g - Peso adequado para IG',
    apresentacao: 'Cefálica - Apresentação adequada',
    placenta: 'Anterior - Localização normal',
    liquido_amniotico: 'Normal - Volume adequado'
  };
  
  console.log('📊 Resposta ideal do N8N:', idealN8NResponse);
  
  const idealEdgeResponse = {
    success: true,
    processed_content: idealN8NResponse.processed_content,
    individual_fields: {
      IG: idealN8NResponse.IG,
      BCF: idealN8NResponse.BCF,
      peso_fetal: idealN8NResponse.peso_fetal,
      apresentacao: idealN8NResponse.apresentacao,
      placenta: idealN8NResponse.placenta,
      liquido_amniotico: idealN8NResponse.liquido_amniotico
    }
  };
  
  console.log('📊 Resposta ideal da Edge Function:', idealEdgeResponse);
  
  console.log('\n🔄 Fluxo ideal:');
  console.log('1. N8N processa e retorna campos individuais ✅');
  console.log('2. Edge Function extrai e formata campos ✅');
  console.log('3. Frontend recebe individual_fields ✅');
  console.log('4. useAIProcessing chama onSuccess com individualFields ✅');
  console.log('5. useAtendimentoHelpers chama onIndividualFieldsUpdate ✅');
  console.log('6. handleDynamicFieldsChange atualiza estado ✅');
  console.log('7. Campos são preenchidos na UI ✅');
}

console.log('🚀 Scripts disponíveis:');
console.log('testN8NIndividualFields() - Testa N8N diretamente');
console.log('testEdgeFunctionIndividualFields() - Testa via Edge Function');
console.log('compareResponses() - Compara ambas as respostas');
console.log('simulateIdealFlow() - Mostra fluxo ideal');

// Auto-executar comparação
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando comparação automática...');
  compareResponses().then(() => {
    console.log('\n🎭 Mostrando fluxo ideal...');
    simulateIdealFlow();
  });
}