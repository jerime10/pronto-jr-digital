// Script para testar a integração completa da IA
// Execute no console do navegador na página /atendimento/novo

console.log('🚀 Iniciando teste de integração da IA...');

async function testAIIntegration() {
  try {
    // 1. Verificar se o Supabase está disponível
    console.log('1️⃣ Verificando Supabase...');
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível no window');
      return;
    }
    console.log('✅ Supabase disponível');

    // 2. Navegar para a aba de exames
    console.log('2️⃣ Navegando para aba de exames...');
    const examTab = document.querySelector('[data-value="exames"]');
    if (!examTab) {
      console.error('❌ Aba de exames não encontrada');
      return;
    }
    examTab.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Aba de exames ativada');

    // 3. Navegar para resultados
    console.log('3️⃣ Navegando para resultados...');
    const resultTab = document.querySelector('[data-value="resultados"]');
    if (!resultTab) {
      console.error('❌ Aba de resultados não encontrada');
      return;
    }
    resultTab.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Aba de resultados ativada');

    // 4. Verificar se há modelos disponíveis
    console.log('4️⃣ Verificando modelos de exames...');
    const modelSelect = document.querySelector('select[name="examModel"]') || 
                       document.querySelector('[role="combobox"]') ||
                       document.querySelector('button[role="combobox"]');
    
    if (!modelSelect) {
      console.error('❌ Select de modelos não encontrado');
      return;
    }
    
    // Clicar no select para abrir
    modelSelect.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se há opções
    const options = document.querySelectorAll('[role="option"]') || 
                   document.querySelectorAll('option');
    
    if (options.length === 0) {
      console.error('❌ Nenhum modelo de exame encontrado');
      return;
    }
    
    console.log(`✅ ${options.length} modelos encontrados`);
    
    // Selecionar o primeiro modelo
    options[0].click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Modelo selecionado');

    // 5. Verificar se há campos de resultado preenchidos
    console.log('5️⃣ Verificando campos de resultado...');
    const textareas = document.querySelectorAll('textarea');
    let hasContent = false;
    
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.trim().length > 0) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent) {
      console.log('⚠️ Nenhum campo preenchido, adicionando dados de teste...');
      // Preencher o primeiro textarea encontrado
      if (textareas.length > 0) {
        const firstTextarea = textareas[0];
        firstTextarea.value = 'Hemoglobina: 12.5 g/dL\nHematócrito: 38%\nLeucócitos: 7.200/mm³';
        firstTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        firstTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Dados de teste adicionados');
      }
    } else {
      console.log('✅ Campos já possuem conteúdo');
    }

    // 6. Encontrar e clicar no botão de IA
    console.log('6️⃣ Procurando botão de IA...');
    
    // Procurar por diferentes seletores possíveis
    const aiButton = document.querySelector('button:has(svg)') ||
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Processar com IA') ||
                      btn.textContent.includes('IA') ||
                      btn.querySelector('svg')
                    );
    
    if (!aiButton) {
      console.error('❌ Botão de IA não encontrado');
      return;
    }
    
    console.log('✅ Botão de IA encontrado:', aiButton.textContent);

    // 7. Testar a Edge Function diretamente primeiro
    console.log('7️⃣ Testando Edge Function diretamente...');
    
    try {
      const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
        body: {
          examResults: 'Hemoglobina: 12.5 g/dL\nHematócrito: 38%\nLeucócitos: 7.200/mm³',
          prompt: 'Analise estes resultados de exames e forneça uma interpretação médica detalhada.'
        }
      });
      
      if (error) {
        console.error('❌ Erro na Edge Function:', error);
      } else {
        console.log('✅ Edge Function funcionando:', data);
      }
    } catch (err) {
      console.error('❌ Erro ao chamar Edge Function:', err);
    }

    // 8. Clicar no botão de IA
    console.log('8️⃣ Clicando no botão de IA...');
    aiButton.click();
    
    // 9. Aguardar processamento
    console.log('9️⃣ Aguardando processamento...');
    
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // Verificar se o botão ainda está processando
      const processingButton = document.querySelector('button:has(.animate-spin)') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                btn.textContent.includes('Processando')
                              );
      
      if (!processingButton) {
        console.log('✅ Processamento concluído!');
        break;
      }
      
      console.log(`⏳ Processando... (${attempts}/${maxAttempts})`);
    }
    
    if (attempts >= maxAttempts) {
      console.error('❌ Timeout: Processamento demorou mais que 30 segundos');
      return;
    }

    // 10. Verificar resultado final
    console.log('🔟 Verificando resultado final...');
    const finalResultTextarea = document.querySelector('#examResults') ||
                                document.querySelector('textarea[placeholder*="Resultado final"]') ||
                                Array.from(document.querySelectorAll('textarea')).find(ta => 
                                  ta.placeholder && ta.placeholder.includes('final')
                                );
    
    if (finalResultTextarea && finalResultTextarea.value.trim()) {
      console.log('✅ SUCESSO! Resultado gerado pela IA:');
      console.log('📄 Conteúdo:', finalResultTextarea.value.substring(0, 200) + '...');
    } else {
      console.error('❌ Nenhum resultado foi gerado');
    }

    console.log('🎉 Teste de integração da IA concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAIIntegration();