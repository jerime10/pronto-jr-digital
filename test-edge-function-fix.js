// Script para testar se o erro da Edge Function foi corrigido
// Execute no console do navegador após fazer login

let testResults = {
  generalButtonTest: null,
  individualButtonTest: null,
  errors: []
};

function testEdgeFunctionFix() {
  console.log('🔧 TESTANDO CORREÇÃO DA EDGE FUNCTION...');
  
  // Resetar resultados
  testResults = {
    generalButtonTest: null,
    individualButtonTest: null,
    errors: []
  };
  
  // Interceptar fetch para monitorar chamadas e erros
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\\n🚀 === INTERCEPTANDO EDGE FUNCTION ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Request Body:', requestBody);
      
      // Identificar tipo de chamada
      const dynamicFields = Object.keys(requestBody || {}).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      const hasDynamicFields = dynamicFields.length > 0;
      const hasText = !!(requestBody.text || requestBody.content);
      
      const testType = hasDynamicFields ? 'GERAL (campos dinâmicos)' : 'INDIVIDUAL (text/content)';
      console.log(`🎯 Tipo de teste: ${testType}`);
      console.log(`📊 Campos dinâmicos: ${dynamicFields.length > 0 ? dynamicFields : 'nenhum'}`);
      console.log(`📝 Text/Content: ${hasText ? 'presente' : 'ausente'}`);
      
      try {
        const response = await originalFetch.apply(this, args);
        
        console.log('\\n📥 === RESPOSTA DA EDGE FUNCTION ===');
        console.log('Status:', response.status);
        console.log('Status OK:', response.ok);
        
        if (!response.ok) {
          console.error('❌ ERRO: Edge Function retornou status não-2xx:', response.status);
          
          // Tentar ler o erro
          const clonedResponse = response.clone();
          try {
            const errorData = await clonedResponse.json();
            console.error('Detalhes do erro:', errorData);
            testResults.errors.push({
              type: testType,
              status: response.status,
              error: errorData
            });
          } catch (e) {
            console.error('Não foi possível fazer parse do erro');
          }
        } else {
          console.log('✅ SUCESSO: Edge Function retornou status 2xx');
          
          // Analisar resposta
          const clonedResponse = response.clone();
          try {
            const responseData = await clonedResponse.json();
            console.log('Success:', responseData.success);
            console.log('Processed Content:', !!responseData.processed_content);
            console.log('Individual Fields:', !!responseData.individual_fields);
            
            if (hasDynamicFields) {
              testResults.generalButtonTest = {
                success: true,
                status: response.status,
                hasIndividualFields: !!responseData.individual_fields
              };
            } else {
              testResults.individualButtonTest = {
                success: true,
                status: response.status,
                hasProcessedContent: !!responseData.processed_content
              };
            }
            
          } catch (e) {
            console.error('❌ Erro ao fazer parse da resposta:', e);
          }
        }
        
        return response;
        
      } catch (error) {
        console.error('❌ ERRO DE REDE:', error);
        testResults.errors.push({
          type: testType,
          error: error.message
        });
        throw error;
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitoramento ativo.');
  console.log('📋 Execute os testes:');
  console.log('1. Teste GERAL: Preencha campos e clique "Processar com IA"');
  console.log('2. Teste INDIVIDUAL: Clique no ícone de IA de um campo específico');
}

// Função para testar Edge Function diretamente
async function testEdgeFunctionDirect() {
  console.log('\\n🔧 TESTANDO EDGE FUNCTION DIRETAMENTE...');
  
  // Teste 1: Requisição com campos dinâmicos (botão geral)
  console.log('\\n1️⃣ Teste com campos dinâmicos:');
  const dynamicPayload = {
    IG: '32 semanas',
    BCF: '140 bpm',
    peso_fetal: '1800g'
  };
  
  try {
    const { data: data1, error: error1 } = await window.supabase.functions.invoke('ai-webhook', {
      body: dynamicPayload
    });
    
    if (error1) {
      console.error('❌ Erro com campos dinâmicos:', error1);
      testResults.errors.push({ type: 'Campos dinâmicos', error: error1 });
    } else {
      console.log('✅ Sucesso com campos dinâmicos:', data1);
      testResults.generalButtonTest = { success: true, data: data1 };
    }
  } catch (err) {
    console.error('❌ Exceção com campos dinâmicos:', err);
    testResults.errors.push({ type: 'Campos dinâmicos', error: err.message });
  }
  
  // Teste 2: Requisição com text/content (botão individual)
  console.log('\\n2️⃣ Teste com text/content:');
  const textPayload = {
    text: 'Gere uma descrição médica normal para idade gestacional',
    type: 'exam_result'
  };
  
  try {
    const { data: data2, error: error2 } = await window.supabase.functions.invoke('ai-webhook', {
      body: textPayload
    });
    
    if (error2) {
      console.error('❌ Erro com text/content:', error2);
      testResults.errors.push({ type: 'Text/Content', error: error2 });
    } else {
      console.log('✅ Sucesso com text/content:', data2);
      testResults.individualButtonTest = { success: true, data: data2 };
    }
  } catch (err) {
    console.error('❌ Exceção com text/content:', err);
    testResults.errors.push({ type: 'Text/Content', error: err.message });
  }
  
  // Teste 3: Requisição inválida (sem campos dinâmicos nem text)
  console.log('\\n3️⃣ Teste com payload inválido:');
  const invalidPayload = {
    selectedModelTitle: 'Ultrassom Obstétrico'
  };
  
  try {
    const { data: data3, error: error3 } = await window.supabase.functions.invoke('ai-webhook', {
      body: invalidPayload
    });
    
    if (error3) {
      console.log('✅ Erro esperado com payload inválido:', error3);
    } else {
      console.log('⚠️ Payload inválido foi aceito (inesperado):', data3);
    }
  } catch (err) {
    console.log('✅ Exceção esperada com payload inválido:', err.message);
  }
}

// Função para gerar relatório da correção
function generateFixReport() {
  console.log('\\n📋 === RELATÓRIO DA CORREÇÃO ===');
  
  console.log('\\n🔧 PROBLEMA ORIGINAL:');
  console.log('   Edge Function retornava status não-2xx');
  console.log('   Validação muito restritiva rejeitava requisições válidas');
  
  console.log('\\n✅ CORREÇÃO IMPLEMENTADA:');
  console.log('   1. Validação flexível: aceita campos dinâmicos OU text/content');
  console.log('   2. Payload inteligente: campos dinâmicos para botão geral, text/type para individual');
  console.log('   3. Compatibilidade mantida com ambos os tipos de requisição');
  
  console.log('\\n📊 RESULTADOS DOS TESTES:');
  
  if (testResults.generalButtonTest) {
    console.log('   ✅ Botão GERAL: Funcionando');
    console.log(`      Status: ${testResults.generalButtonTest.status || 'OK'}`);
    console.log(`      Campos individuais: ${testResults.generalButtonTest.hasIndividualFields ? 'Sim' : 'Não'}`);
  } else {
    console.log('   ⚠️ Botão GERAL: Não testado');
  }
  
  if (testResults.individualButtonTest) {
    console.log('   ✅ Botão INDIVIDUAL: Funcionando');
    console.log(`      Status: ${testResults.individualButtonTest.status || 'OK'}`);
    console.log(`      Conteúdo processado: ${testResults.individualButtonTest.hasProcessedContent ? 'Sim' : 'Não'}`);
  } else {
    console.log('   ⚠️ Botão INDIVIDUAL: Não testado');
  }
  
  console.log('\\n❌ ERROS ENCONTRADOS:');
  if (testResults.errors.length === 0) {
    console.log('   ✅ Nenhum erro encontrado!');
  } else {
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.type}: ${error.error?.message || error.error}`);
    });
  }
  
  console.log('\\n🎯 CONCLUSÃO:');
  if (testResults.errors.length === 0) {
    console.log('   ✅ CORREÇÃO BEM-SUCEDIDA: Edge Function está funcionando corretamente!');
  } else {
    console.log('   ❌ AINDA HÁ PROBLEMAS: Verificar erros acima');
  }
}

// Função para executar todos os testes
async function runFullFixTest() {
  console.log('🔧 EXECUTANDO TESTE COMPLETO DA CORREÇÃO...');
  
  // Ativar monitoramento
  testEdgeFunctionFix();
  
  // Testar diretamente
  await testEdgeFunctionDirect();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gerar relatório
  generateFixReport();
}

console.log('🚀 Scripts de teste da correção disponíveis:');
console.log('testEdgeFunctionFix() - Monitora chamadas da Edge Function');
console.log('testEdgeFunctionDirect() - Testa Edge Function diretamente');
console.log('generateFixReport() - Gera relatório da correção');
console.log('runFullFixTest() - Executa todos os testes');

// Auto-executar teste completo
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Executando teste automático da correção...');
  runFullFixTest();
}