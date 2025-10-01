// Teste para verificar se os campos dinâmicos estão sendo enviados separadamente
// Execute no console do navegador na página /atendimento/novo

console.log('🧪 Testando envio de campos dinâmicos separadamente...');

async function testDynamicFields() {
  try {
    console.log('1️⃣ Verificando disponibilidade do Supabase...');
    
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    
    console.log('✅ Supabase disponível');
    
    console.log('2️⃣ Testando Edge Function com campos dinâmicos...');
    
    // Simular dados como seriam enviados pelo sistema
    const testData = {
      content: 'Resultado do exame com template aplicado',
      type: 'exam_result',
      selectedModelTitle: 'Hemograma Completo',
      // Campos dinâmicos que seriam extraídos do template
      hemoglobina: '14.2 g/dL',
      hemacias: '4.5 milhões/mm³',
      hematocrito: '42%',
      leucocitos: '7.200/mm³',
      plaquetas: '280.000/mm³',
      glicemia: '95 mg/dL',
      colesterol: '180 mg/dL'
    };
    
    console.log('📤 Enviando dados com campos dinâmicos:', testData);
    
    const startTime = Date.now();
    
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testData
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Tempo de resposta: ${duration}ms`);
    
    if (error) {
      console.error('❌ Erro na Edge Function:');
      console.error('📋 Detalhes do erro:', error);
      return false;
    } else {
      console.log('✅ Edge Function respondeu com sucesso!');
      console.log('📥 Resposta completa:', data);
      
      if (data.success) {
        console.log('✅ Processamento bem-sucedido');
        if (data.processed_content) {
          console.log('📝 Conteúdo processado:', data.processed_content);
        }
        
        // Verificar se a resposta indica que os campos foram processados
        console.log('🔍 Verificando se os campos dinâmicos foram processados...');
        
        // A IA deve ter recebido os campos separadamente
        const processedContent = data.processed_content || '';
        const hasFieldReferences = [
          'hemoglobina', 'hemácias', 'hematócrito', 
          'leucócitos', 'plaquetas', 'glicemia', 'colesterol'
        ].some(field => 
          processedContent.toLowerCase().includes(field.toLowerCase())
        );
        
        if (hasFieldReferences) {
          console.log('✅ Campos dinâmicos parecem ter sido processados corretamente');
        } else {
          console.log('⚠️ Não foi possível confirmar se os campos dinâmicos foram processados');
        }
        
      } else {
        console.log('⚠️ Processamento falhou:', data.error);
      }
      
      return data.success;
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return false;
  }
}

// Função para testar a integração completa
async function testCompleteIntegration() {
  console.log('🔄 Testando integração completa...');
  
  try {
    // 1. Navegar para a aba de exames
    console.log('1️⃣ Navegando para aba de exames...');
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent && el.textContent.toLowerCase().includes('exame')
    );
    
    if (examTab) {
      examTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Aba de exames ativada');
    }
    
    // 2. Procurar por modelos de exame
    console.log('2️⃣ Procurando modelos de exame...');
    const modelSelects = document.querySelectorAll('select, [role="combobox"]');
    
    for (const select of modelSelects) {
      if (select.options && select.options.length > 1) {
        console.log('✅ Select de modelos encontrado');
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      }
    }
    
    // 3. Verificar se campos dinâmicos foram criados
    console.log('3️⃣ Verificando campos dinâmicos...');
    const dynamicInputs = document.querySelectorAll('input[placeholder*="{{"], input[name*="dynamic"]');
    
    if (dynamicInputs.length > 0) {
      console.log(`✅ ${dynamicInputs.length} campos dinâmicos encontrados`);
      
      // Preencher alguns campos para teste
      dynamicInputs.forEach((input, index) => {
        if (index < 3) { // Preencher apenas os primeiros 3
          input.value = `Valor teste ${index + 1}`;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      console.log('✅ Campos dinâmicos preenchidos para teste');
    } else {
      console.log('⚠️ Nenhum campo dinâmico encontrado');
    }
    
    // 4. Procurar botão de processar com IA
    console.log('4️⃣ Procurando botão de processar com IA...');
    const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && (
        btn.textContent.toLowerCase().includes('processar com ia') ||
        btn.textContent.toLowerCase().includes('processar com ai')
      )
    );
    
    if (aiButton) {
      console.log('✅ Botão de processar com IA encontrado');
      console.log('🎯 Texto do botão:', aiButton.textContent);
      
      // Verificar se o botão está habilitado
      if (!aiButton.disabled) {
        console.log('✅ Botão está habilitado e pronto para uso');
      } else {
        console.log('⚠️ Botão está desabilitado');
      }
    } else {
      console.log('⚠️ Botão de processar com IA não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste de integração:', error);
  }
}

// Executar os testes
console.log('🚀 Iniciando testes...');

testDynamicFields().then(success => {
  console.log('🏁 Teste de campos dinâmicos:', success ? '✅ Sucesso' : '❌ Falha');
  
  // Executar teste de integração
  return testCompleteIntegration();
}).then(() => {
  console.log('🏁 Todos os testes concluídos');
});