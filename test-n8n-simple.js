// Script simples para testar N8N diretamente
// Execute no console do navegador

async function testN8NSimple() {
  console.log('🔗 TESTANDO N8N DIRETAMENTE...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  // Payload que deveria gerar campos individuais
  const payload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    selectedModelTitle: 'Ultrassom Obstétrico',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Enviando para N8N:', payload);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sistema.saude.app'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Status:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Resposta (texto):', responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📥 Resposta (JSON):', jsonResponse);
      
      // Verificar campos específicos
      const fieldsToCheck = ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'];
      const foundFields = {};
      
      fieldsToCheck.forEach(field => {
        if (jsonResponse[field]) {
          foundFields[field] = jsonResponse[field];
        }
      });
      
      console.log('\\n🔍 ANÁLISE:');
      console.log('Campos encontrados:', Object.keys(foundFields));
      console.log('Valores:', foundFields);
      
      if (Object.keys(foundFields).length > 0) {
        console.log('✅ N8N RETORNA campos individuais!');
        console.log('O problema está na Edge Function ou no frontend');
      } else {
        console.log('❌ N8N NÃO retorna campos individuais');
        console.log('O problema está no N8N');
      }
      
      return jsonResponse;
      
    } catch (e) {
      console.log('📝 Resposta não é JSON válido');
      return responseText;
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

// Função para testar Edge Function diretamente
async function testEdgeFunctionSimple() {
  console.log('\\n🚀 TESTANDO EDGE FUNCTION DIRETAMENTE...');
  
  const payload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g',
    selectedModelTitle: 'Ultrassom Obstétrico'
  };
  
  console.log('📤 Enviando para Edge Function:', payload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: payload
    });
    
    if (error) {
      console.error('❌ Erro Edge Function:', error);
      return null;
    }
    
    console.log('📥 Resposta Edge Function:', data);
    console.log('\\n🔍 ANÁLISE:');
    console.log('Success:', data.success);
    console.log('Tem processed_content:', !!data.processed_content);
    console.log('Tem individual_fields:', !!data.individual_fields);
    
    if (data.individual_fields) {
      console.log('✅ Edge Function RETORNA individual_fields!');
      console.log('Campos:', Object.keys(data.individual_fields));
      console.log('Valores:', data.individual_fields);
      console.log('O problema está no frontend (useAtendimentoHelpers)');
    } else {
      console.log('❌ Edge Function NÃO retorna individual_fields');
      console.log('O problema está na Edge Function ou no N8N');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

// Função para executar ambos os testes
async function runBothTests() {
  console.log('🧪 EXECUTANDO TESTES COMPLETOS...');
  
  // Teste 1: N8N direto
  const n8nResult = await testN8NSimple();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Edge Function
  const edgeResult = await testEdgeFunctionSimple();
  
  console.log('\\n📋 === RESUMO ===');
  
  if (n8nResult && typeof n8nResult === 'object') {
    const n8nFields = Object.keys(n8nResult).filter(key => 
      ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
    );
    console.log('N8N retorna campos:', n8nFields.length > 0 ? '✅' : '❌');
  }
  
  if (edgeResult) {
    console.log('Edge Function retorna individual_fields:', edgeResult.individual_fields ? '✅' : '❌');
  }
  
  // Diagnóstico
  if (n8nResult && edgeResult) {
    const n8nHasFields = typeof n8nResult === 'object' && Object.keys(n8nResult).some(key => 
      ['IG', 'BCF', 'peso_fetal', 'apresentacao', 'placenta', 'liquido_amniotico'].includes(key)
    );
    
    if (n8nHasFields && !edgeResult.individual_fields) {
      console.log('\\n🎯 DIAGNÓSTICO: N8N retorna campos, mas Edge Function não extrai');
      console.log('🔧 AÇÃO: Verificar lógica de extração na Edge Function');
    } else if (!n8nHasFields) {
      console.log('\\n🎯 DIAGNÓSTICO: N8N não retorna campos individuais');
      console.log('🔧 AÇÃO: Verificar configuração do workflow N8N');
    } else if (edgeResult.individual_fields) {
      console.log('\\n🎯 DIAGNÓSTICO: N8N e Edge Function funcionam');
      console.log('🔧 AÇÃO: Verificar useAtendimentoHelpers no frontend');
    }
  }
}

console.log('🚀 Scripts disponíveis:');
console.log('testN8NSimple() - Testa N8N diretamente');
console.log('testEdgeFunctionSimple() - Testa Edge Function diretamente');
console.log('runBothTests() - Executa ambos os testes');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando testes automáticos...');
  runBothTests();
}