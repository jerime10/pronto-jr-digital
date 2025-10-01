// Script para verificar se a correção final funcionou
// Execute no console do navegador após fazer login

let finalTestResults = {
  payloadsSent: [],
  issues: []
};

function testFinalPayloadFix() {
  console.log('🔧 TESTANDO CORREÇÃO FINAL DO PAYLOAD...');
  
  // Resetar resultados
  finalTestResults = {
    payloadsSent: [],
    issues: []
  };
  
  // Interceptar fetch para Edge Function
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado:', requestBody);
      
      // Analisar payload
      const allFields = Object.keys(requestBody || {});
      const dynamicFields = allFields.filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      const controlFields = allFields.filter(key => 
        ['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      console.log('\\n📊 ANÁLISE DETALHADA:');
      console.log('   Todos os campos:', allFields);
      console.log('   Campos dinâmicos:', dynamicFields);
      console.log('   Campos de controle:', controlFields);
      
      // Verificar se há text/type quando há campos dinâmicos
      const hasTextOrType = requestBody.text || requestBody.content || requestBody.type;
      const hasDynamicFields = dynamicFields.length > 0;
      
      console.log('\\n🔍 VERIFICAÇÃO:');
      console.log('   Tem text/content/type:', !!hasTextOrType);
      console.log('   Tem campos dinâmicos:', hasDynamicFields);
      
      if (hasDynamicFields && hasTextOrType) {
        console.error('❌ PROBLEMA: Enviando text/type junto com campos dinâmicos!');
        finalTestResults.issues.push('Enviando text/type junto com campos dinâmicos');
      } else if (hasDynamicFields && !hasTextOrType) {
        console.log('✅ CORRETO: Enviando apenas campos dinâmicos');
      } else if (!hasDynamicFields && hasTextOrType) {
        console.log('✅ CORRETO: Enviando apenas text/type (requisição individual)');
      } else {
        console.error('❌ PROBLEMA: Payload vazio ou inválido');
        finalTestResults.issues.push('Payload vazio ou inválido');
      }
      
      finalTestResults.payloadsSent.push({
        timestamp: new Date().toISOString(),
        payload: requestBody,
        allFields,
        dynamicFields,
        controlFields,
        hasTextOrType: !!hasTextOrType,
        hasDynamicFields,
        isCorrect: (hasDynamicFields && !hasTextOrType) || (!hasDynamicFields && hasTextOrType)
      });
      
      const response = await originalFetch.apply(this, args);
      
      // Verificar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\\n📥 === RESPOSTA ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        
        if (responseData.success && hasDynamicFields) {
          if (responseData.individual_fields) {
            console.log('✅ N8N retornou campos individuais:', Object.keys(responseData.individual_fields));
          } else {
            console.log('⚠️ N8N NÃO retornou campos individuais');
            finalTestResults.issues.push('N8N não retornou campos individuais');
          }
        }
        
      } catch (e) {
        console.error('❌ Erro ao analisar resposta:', e);
      }
      
      return response;
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo.');
  console.log('📋 Execute o teste:');
  console.log('1. Vá para Exames → Resultados');
  console.log('2. Selecione "Ultrassom Obstétrico"');
  console.log('3. Preencha campos (IG, BCF, peso_fetal)');
  console.log('4. Clique "Processar com IA"');
}

// Função para testar payload específico
async function testSpecificPayload() {
  console.log('\\n🧪 TESTANDO PAYLOAD ESPECÍFICO...');
  
  // Simular payload correto (apenas campos dinâmicos)
  const correctPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  console.log('📤 Testando payload correto:', correctPayload);
  
  try {
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: correctPayload
    });
    
    if (error) {
      console.error('❌ Erro:', error);
      finalTestResults.issues.push(`Erro no teste específico: ${error.message}`);
    } else {
      console.log('✅ Sucesso:', data);
      if (data.individual_fields) {
        console.log('🎯 Campos individuais retornados:', Object.keys(data.individual_fields));
      }
    }
  } catch (err) {
    console.error('❌ Exceção:', err);
    finalTestResults.issues.push(`Exceção no teste específico: ${err.message}`);
  }
}

// Função para gerar relatório final
function generateFinalReport() {
  console.log('\\n📋 === RELATÓRIO FINAL ===');
  
  if (finalTestResults.payloadsSent.length === 0) {
    console.log('⚠️ Nenhum payload interceptado. Execute o teste primeiro.');
    return;
  }
  
  const lastPayload = finalTestResults.payloadsSent[finalTestResults.payloadsSent.length - 1];
  
  console.log('\\n1️⃣ ÚLTIMO PAYLOAD ENVIADO:');
  console.log('   Campos dinâmicos:', lastPayload.dynamicFields);
  console.log('   Campos de controle:', lastPayload.controlFields);
  console.log('   Tem text/type:', lastPayload.hasTextOrType);
  console.log('   Tem campos dinâmicos:', lastPayload.hasDynamicFields);
  console.log('   Está correto:', lastPayload.isCorrect);
  
  console.log('\\n2️⃣ ANÁLISE:');
  if (lastPayload.hasDynamicFields && !lastPayload.hasTextOrType) {
    console.log('   ✅ PERFEITO: Enviando apenas campos dinâmicos');
  } else if (lastPayload.hasDynamicFields && lastPayload.hasTextOrType) {
    console.log('   ❌ PROBLEMA: Ainda enviando text/type com campos dinâmicos');
  } else if (!lastPayload.hasDynamicFields && lastPayload.hasTextOrType) {
    console.log('   ✅ OK: Enviando text/type para requisição individual');
  } else {
    console.log('   ❌ PROBLEMA: Payload inválido');
  }
  
  console.log('\\n3️⃣ PROBLEMAS ENCONTRADOS:');
  if (finalTestResults.issues.length === 0) {
    console.log('   ✅ Nenhum problema encontrado!');
  } else {
    finalTestResults.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\\n4️⃣ CONCLUSÃO:');
  if (finalTestResults.issues.length === 0 && lastPayload.isCorrect) {
    console.log('   ✅ CORREÇÃO BEM-SUCEDIDA: Payload está correto!');
  } else {
    console.log('   ❌ AINDA HÁ PROBLEMAS: Verificar logs acima');
  }
}

// Função para executar teste completo
async function runFinalTest() {
  console.log('🔧 EXECUTANDO TESTE FINAL COMPLETO...');
  
  // Ativar monitoramento
  testFinalPayloadFix();
  
  // Testar payload específico
  await testSpecificPayload();
  
  console.log('\\n✅ Teste final executado.');
  console.log('📋 Execute o processamento no navegador e depois use generateFinalReport()');
}

console.log('🚀 Scripts de teste final disponíveis:');
console.log('testFinalPayloadFix() - Monitora payloads');
console.log('testSpecificPayload() - Testa payload específico');
console.log('generateFinalReport() - Gera relatório final');
console.log('runFinalTest() - Executa teste completo');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste final automático...');
  runFinalTest();
}