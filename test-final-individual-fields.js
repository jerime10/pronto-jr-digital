// Script de teste final para campos individuais (Edge Function v90)
// Execute no console do navegador após fazer login

async function testFinalIndividualFields() {
  console.log('🔍 Teste final de campos individuais (Edge Function v90)...');
  
  // Interceptar todas as chamadas para monitorar
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url && url.includes && url.includes('ai-webhook')) {
      console.log('\n🚀 === CHAMADA INTERCEPTADA ===');
      
      const requestBody = options?.body ? JSON.parse(options.body) : null;
      console.log('📤 Payload enviado:', requestBody);
      
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
  
  console.log('✅ Monitoramento ativo.');
  console.log('📋 Agora execute o processamento de IA no sistema.');
  console.log('📋 Os logs da Edge Function v90 mostrarão detalhes sobre a extração de campos.');
}

// Função para testar diretamente
async function testDirectEdgeFunction() {
  console.log('🧪 Testando Edge Function v90 diretamente...');
  
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
    
    // Analisar resposta
    if (data.success) {
      console.log('✅ Processamento bem-sucedido');
      
      if (data.processed_content) {
        console.log('📄 Resultado Final presente');
      }
      
      if (data.individual_fields) {
        console.log('🎯 Campos individuais presentes:', Object.keys(data.individual_fields));
        console.log('📊 Detalhes dos campos:');
        Object.entries(data.individual_fields).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        return {
          success: true,
          hasIndividualFields: true,
          fieldCount: Object.keys(data.individual_fields).length,
          fields: data.individual_fields
        };
      } else {
        console.log('⚠️ Nenhum campo individual na resposta');
        console.log('🔍 Verifique os logs da Edge Function para ver o que o N8N retornou');
        
        return {
          success: true,
          hasIndividualFields: false,
          processedContent: data.processed_content
        };
      }
    } else {
      console.log('❌ Processamento falhou');
      return { success: false, error: data.error };
    }
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return { success: false, error: err.message };
  }
}

// Função para verificar logs da Edge Function
async function checkEdgeFunctionLogs() {
  console.log('📋 Para verificar os logs da Edge Function:');
  console.log('1. Acesse o Supabase Dashboard');
  console.log('2. Vá em Edge Functions → ai-webhook');
  console.log('3. Clique em "Logs" para ver os detalhes');
  console.log('4. Procure por "=== DEBUG CAMPOS INDIVIDUAIS ==="');
  console.log('');
  console.log('Os logs mostrarão:');
  console.log('- Campos dinâmicos enviados');
  console.log('- Dados brutos do N8N');
  console.log('- Campos individuais extraídos');
  console.log('- Se cada campo esperado foi encontrado no N8N');
}

// Função para diagnosticar problemas
function diagnoseProblem() {
  console.log('🔍 Diagnóstico de problemas:');
  console.log('');
  console.log('Se os campos individuais não aparecem:');
  console.log('');
  console.log('1. ❓ N8N não retorna campos individuais:');
  console.log('   - Verifique se o workflow N8N está configurado para retornar campos separados');
  console.log('   - O N8N deve retornar um JSON com campos como: IG, BCF, peso_fetal, etc.');
  console.log('');
  console.log('2. ❓ Edge Function não extrai campos:');
  console.log('   - Verifique os logs da Edge Function v90');
  console.log('   - Procure por "=== DEBUG CAMPOS INDIVIDUAIS ==="');
  console.log('   - Veja se "Dados brutos do N8N" contém os campos esperados');
  console.log('');
  console.log('3. ❓ Frontend não processa campos:');
  console.log('   - Verifique se aparecem logs do useAtendimentoHelpers');
  console.log('   - Procure por "🎯 [useAtendimentoHelpers] Processando campos individuais"');
  console.log('   - Verifique se handleDynamicFieldsChange é chamado');
  console.log('');
  console.log('4. ❓ Campos não são aplicados na UI:');
  console.log('   - Verifique se setDynamicFields está atualizando o estado');
  console.log('   - Verifique se os campos estão sendo re-renderizados');
}

// Função para simular resposta correta do N8N
function simulateCorrectN8NResponse() {
  console.log('🎭 Resposta correta esperada do N8N:');
  
  const correctResponse = {
    processed_content: 'Exame de ultrassom obstétrico realizado em gestante de 32 semanas. Feto único, vivo, em apresentação cefálica. Batimentos cardíacos fetais normais (140 bpm). Peso fetal estimado em 1800g, adequado para idade gestacional. Placenta anterior com grau de maturação normal. Volume de líquido amniótico dentro da normalidade.',
    IG: '32 semanas - Idade gestacional compatível com desenvolvimento fetal adequado',
    BCF: '140 bpm - Frequência cardíaca fetal normal, ritmo regular',
    peso_fetal: '1800g - Peso estimado dentro da normalidade para IG atual',
    apresentacao: 'Cefálica - Apresentação fetal adequada para o parto',
    placenta: 'Anterior - Localização e grau de maturação normais',
    liquido_amniotico: 'Normal - Volume de líquido amniótico adequado (ILA normal)'
  };
  
  console.log('📊 Estrutura JSON esperada:', correctResponse);
  console.log('');
  console.log('🔑 Pontos importantes:');
  console.log('- O N8N deve retornar um objeto JSON (não string)');
  console.log('- Deve ter "processed_content" para o resultado final');
  console.log('- Deve ter campos individuais com os mesmos nomes enviados');
  console.log('- Cada campo deve ter uma resposta específica e detalhada');
}

console.log('🚀 Scripts disponíveis:');
console.log('testFinalIndividualFields() - Ativa monitoramento completo');
console.log('testDirectEdgeFunction() - Testa Edge Function v90 diretamente');
console.log('checkEdgeFunctionLogs() - Instruções para verificar logs');
console.log('diagnoseProblem() - Diagnóstico de problemas');
console.log('simulateCorrectN8NResponse() - Mostra resposta correta esperada');

// Auto-ativar monitoramento
if (typeof window !== 'undefined' && window.supabase) {
  testFinalIndividualFields();
}