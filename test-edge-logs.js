// Script para testar e capturar logs da Edge Function
// Execute no console do navegador

async function testEdgeWithLogs() {
  console.log('🔍 TESTANDO EDGE FUNCTION COM LOGS DETALHADOS...');
  
  const payload = {
    figado: 'esteatose',
    selectedModelTitle: 'ULTRASSONOGRAFIA DE ABDOMEN TOTAL COM DOOPLER'
  };
  
  console.log('📤 Enviando payload:', payload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: payload
    });
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('📥 Resposta completa:', data);
    console.log('\\n🔍 ANÁLISE DETALHADA:');
    console.log('Success:', data.success);
    console.log('Processed Content presente:', !!data.processed_content);
    console.log('Individual Fields presente:', !!data.individual_fields);
    console.log('Individual Fields valor:', data.individual_fields);
    
    if (data.individual_fields) {
      console.log('✅ CAMPOS INDIVIDUAIS ENCONTRADOS:');
      Object.entries(data.individual_fields).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('❌ NENHUM CAMPO INDIVIDUAL RETORNADO');
      console.log('Isso indica que o N8N não está retornando os campos ou a Edge Function não está extraindo');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro na chamada:', error);
    return null;
  }
}

// Função para testar N8N diretamente e comparar
async function testN8NAndCompare() {
  console.log('\\n🔗 TESTANDO N8N DIRETAMENTE PARA COMPARAÇÃO...');
  
  const webhookUrl = 'https://n8n.mentoriajrs.com/webhook-test/c611aff7-f40b-405e-80fe-3b340a33ec9c';
  
  const payload = {
    figado: 'esteatose',
    selectedModelTitle: 'ULTRASSONOGRAFIA DE ABDOMEN TOTAL COM DOOPLER',
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
    
    const responseText = await response.text();
    console.log('📥 Resposta N8N (texto):', responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📥 Resposta N8N (JSON):', jsonResponse);
      console.log('\\n🔍 ANÁLISE N8N:');
      console.log('Tipo:', typeof jsonResponse);
      console.log('É array:', Array.isArray(jsonResponse));
      console.log('Chaves:', Object.keys(jsonResponse));
      
      // Procurar por campos relacionados a fígado
      Object.entries(jsonResponse).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('figado') || lowerKey.includes('fígado') || lowerKey.includes('liver')) {
          console.log(`🎯 Campo relacionado a fígado: "${key}":`, value);
        }
      });
      
      return jsonResponse;
      
    } catch (e) {
      console.log('📝 N8N retornou texto puro');
      return responseText;
    }
    
  } catch (error) {
    console.error('❌ Erro N8N:', error);
    return null;
  }
}

// Função para executar ambos os testes
async function runBothTests() {
  console.log('🧪 EXECUTANDO TESTES COMPARATIVOS...');
  
  // Teste Edge Function
  const edgeResult = await testEdgeWithLogs();
  
  // Aguardar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste N8N direto
  const n8nResult = await testN8NAndCompare();
  
  console.log('\\n📋 === COMPARAÇÃO ===');
  
  if (n8nResult && edgeResult) {
    console.log('N8N funcionou:', !!n8nResult);
    console.log('Edge Function funcionou:', !!edgeResult);
    console.log('Edge Function retorna individual_fields:', !!edgeResult.individual_fields);
    
    if (n8nResult && !edgeResult.individual_fields) {
      console.log('\\n🎯 DIAGNÓSTICO: N8N retorna dados, mas Edge Function não extrai campos individuais');
      console.log('🔧 PRÓXIMO PASSO: Verificar logs da Edge Function para ver o que o N8N está retornando');
    }
  }
}

console.log('🚀 Scripts disponíveis:');
console.log('testEdgeWithLogs() - Testa Edge Function com logs');
console.log('testN8NAndCompare() - Testa N8N diretamente');
console.log('runBothTests() - Executa ambos os testes');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando testes automáticos...');
  runBothTests();
}