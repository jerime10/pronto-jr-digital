// Script para testar as correções finais
// Execute no console do navegador após fazer login

let testResults = {
  payloadTest: null,
  responseTest: null,
  uiTest: null
};

function testFinalCorrections() {
  console.log('🔧 TESTANDO CORREÇÕES FINAIS...');
  
  // Resetar resultados
  testResults = {
    payloadTest: null,
    responseTest: null,
    uiTest: null
  };
  
  // Interceptar fetch para verificar payload
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === TESTANDO PAYLOAD ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado:', requestBody);
      
      // Verificar se inclui selectedModelTitle
      const hasSelectedModelTitle = !!requestBody.selectedModelTitle;
      const dynamicFields = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      const hasDynamicFields = dynamicFields.length > 0;
      const hasTextOrType = !!(requestBody.text || requestBody.content || requestBody.type);
      
      console.log('\\n📊 VERIFICAÇÃO DO PAYLOAD:');
      console.log('   Tem selectedModelTitle:', hasSelectedModelTitle);
      console.log('   selectedModelTitle:', requestBody.selectedModelTitle);
      console.log('   Campos dinâmicos:', dynamicFields);
      console.log('   Tem text/content/type:', hasTextOrType);
      
      testResults.payloadTest = {
        hasSelectedModelTitle,
        selectedModelTitle: requestBody.selectedModelTitle,
        dynamicFields,
        hasDynamicFields,
        hasTextOrType,
        isCorrect: hasDynamicFields && !hasTextOrType && hasSelectedModelTitle
      };
      
      if (testResults.payloadTest.isCorrect) {
        console.log('✅ PAYLOAD CORRETO: Apenas campos dinâmicos + selectedModelTitle');
      } else {
        console.error('❌ PROBLEMA NO PAYLOAD:');
        if (!hasSelectedModelTitle) console.error('   - selectedModelTitle ausente');
        if (hasTextOrType) console.error('   - text/content/type presente');
        if (!hasDynamicFields) console.error('   - campos dinâmicos ausentes');
      }
      
      const response = await originalFetch.apply(this, args);
      
      // Verificar resposta
      const clonedResponse = response.clone();
      try {
        const responseData = await clonedResponse.json();
        console.log('\\n📥 === TESTANDO RESPOSTA ===');
        console.log('Status:', response.status);
        console.log('Success:', responseData.success);
        console.log('Individual Fields:', !!responseData.individual_fields);
        
        if (responseData.individual_fields) {
          console.log('🎯 Campos individuais retornados:', Object.keys(responseData.individual_fields));
          testResults.responseTest = {
            hasIndividualFields: true,
            individualFields: responseData.individual_fields,
            fieldCount: Object.keys(responseData.individual_fields).length
          };
          console.log('✅ RESPOSTA CORRETA: N8N retornou campos individuais');
        } else {
          console.log('❌ PROBLEMA NA RESPOSTA: N8N não retornou campos individuais');
          testResults.responseTest = {
            hasIndividualFields: false,
            error: 'N8N não retornou campos individuais'
          };
        }
        
      } catch (e) {
        console.error('❌ Erro ao analisar resposta:', e);
        testResults.responseTest = { error: e.message };
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
  console.log('5. Observe se APENAS os campos individuais são preenchidos');
}

// Função para verificar se botões individuais foram removidos
function checkIndividualButtons() {
  console.log('\\n🔍 VERIFICANDO REMOÇÃO DOS BOTÕES INDIVIDUAIS...');
  
  // Procurar por botões com ícone Sparkles
  const sparklesButtons = document.querySelectorAll('button svg[class*="sparkles"], button svg[class*="Sparkles"]');
  const aiButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.innerHTML.includes('sparkles') || btn.innerHTML.includes('Sparkles')
  );
  
  console.log('Botões com ícone Sparkles encontrados:', sparklesButtons.length);
  console.log('Botões de IA encontrados:', aiButtons.length);
  
  if (sparklesButtons.length === 0 && aiButtons.length === 0) {
    console.log('✅ BOTÕES INDIVIDUAIS REMOVIDOS: Nenhum botão de IA individual encontrado');
    testResults.uiTest = { buttonsRemoved: true };
  } else {
    console.log('❌ BOTÕES AINDA PRESENTES: Encontrados botões de IA individuais');
    testResults.uiTest = { buttonsRemoved: false, count: sparklesButtons.length + aiButtons.length };
  }
}

// Função para simular preenchimento de campos
function simulateFieldFilling() {
  console.log('\\n🧪 SIMULANDO PREENCHIMENTO DE CAMPOS...');
  
  // Procurar por campos de entrada
  const igField = document.querySelector('input[id*="IG"], input[placeholder*="IG"]');
  const bcfField = document.querySelector('input[id*="BCF"], input[placeholder*="BCF"]');
  const pesoField = document.querySelector('input[id*="peso"], input[placeholder*="peso"]');
  
  if (igField) {
    igField.value = '32 semanas';
    igField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Campo IG preenchido');
  }
  
  if (bcfField) {
    bcfField.value = '140 bpm';
    bcfField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Campo BCF preenchido');
  }
  
  if (pesoField) {
    pesoField.value = '1800g';
    pesoField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Campo peso_fetal preenchido');
  }
  
  console.log('📋 Campos preenchidos. Agora clique em "Processar com IA"');
}

// Função para gerar relatório final
function generateFinalReport() {
  console.log('\\n📋 === RELATÓRIO FINAL DAS CORREÇÕES ===');
  
  console.log('\\n1️⃣ CORREÇÃO: Incluir selectedModelTitle no payload');
  if (testResults.payloadTest) {
    if (testResults.payloadTest.hasSelectedModelTitle) {
      console.log('   ✅ CORRIGIDO: selectedModelTitle incluído no payload');
      console.log(`   📋 Valor: ${testResults.payloadTest.selectedModelTitle}`);
    } else {
      console.log('   ❌ PROBLEMA: selectedModelTitle não incluído');
    }
  } else {
    console.log('   ⚠️ NÃO TESTADO: Execute o teste primeiro');
  }
  
  console.log('\\n2️⃣ CORREÇÃO: Resposta popula campos individuais (não Resultado Final)');
  if (testResults.responseTest) {
    if (testResults.responseTest.hasIndividualFields) {
      console.log('   ✅ CORRIGIDO: N8N retorna campos individuais');
      console.log(`   📋 Campos: ${Object.keys(testResults.responseTest.individualFields || {})}`);
    } else {
      console.log('   ❌ PROBLEMA: N8N não retorna campos individuais');
      console.log(`   📋 Erro: ${testResults.responseTest.error}`);
    }
  } else {
    console.log('   ⚠️ NÃO TESTADO: Execute o teste primeiro');
  }
  
  console.log('\\n3️⃣ CORREÇÃO: Botões de IA individuais removidos');
  if (testResults.uiTest) {
    if (testResults.uiTest.buttonsRemoved) {
      console.log('   ✅ CORRIGIDO: Botões individuais removidos');
    } else {
      console.log('   ❌ PROBLEMA: Ainda há botões individuais');
      console.log(`   📋 Quantidade: ${testResults.uiTest.count}`);
    }
  } else {
    console.log('   ⚠️ NÃO TESTADO: Execute checkIndividualButtons()');
  }
  
  console.log('\\n4️⃣ RESUMO GERAL:');
  const allCorrect = testResults.payloadTest?.hasSelectedModelTitle && 
                     testResults.responseTest?.hasIndividualFields && 
                     testResults.uiTest?.buttonsRemoved;
  
  if (allCorrect) {
    console.log('   ✅ TODAS AS CORREÇÕES FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('   ⚠️ ALGUMAS CORREÇÕES PRECISAM DE AJUSTES');
  }
}

// Função para executar teste completo
async function runCompleteTest() {
  console.log('🔧 EXECUTANDO TESTE COMPLETO DAS CORREÇÕES...');
  
  // Ativar monitoramento
  testFinalCorrections();
  
  // Verificar botões
  checkIndividualButtons();
  
  // Simular preenchimento
  setTimeout(() => {
    simulateFieldFilling();
  }, 1000);
  
  console.log('\\n✅ Teste completo configurado.');
  console.log('📋 Clique em "Processar com IA" e depois use generateFinalReport()');
}

console.log('🚀 Scripts de teste das correções finais disponíveis:');
console.log('testFinalCorrections() - Monitora payload e resposta');
console.log('checkIndividualButtons() - Verifica remoção dos botões');
console.log('simulateFieldFilling() - Preenche campos automaticamente');
console.log('generateFinalReport() - Gera relatório completo');
console.log('runCompleteTest() - Executa teste completo');

// Auto-executar
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático das correções...');
  runCompleteTest();
}