// Teste Final da IA - Execute no console do navegador na página /atendimento/novo
console.log('🚀 Iniciando teste final da integração da IA...');

async function testFinalAIIntegration() {
  try {
    console.log('1️⃣ Verificando disponibilidade do Supabase...');
    
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    
    console.log('✅ Supabase disponível');
    
    console.log('2️⃣ Testando Edge Function ai-webhook diretamente...');
    
    const testData = {
      content: 'Hemograma completo: Hemácias 4.5 milhões/mm³, Hemoglobina 14.2 g/dL, Hematócrito 42%, Leucócitos 7.200/mm³, Plaquetas 280.000/mm³. Glicemia de jejum: 95 mg/dL. Colesterol total: 180 mg/dL. Ureia: 35 mg/dL. Creatinina: 1.0 mg/dL.',
      type: 'exam_result'
    };
    
    console.log('📤 Enviando dados para Edge Function:', testData);
    
    const { data, error } = await window.supabase.functions.invoke('ai-webhook', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      console.error('📋 Detalhes:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Edge Function respondeu com sucesso!');
      console.log('📥 Resposta:', data);
    }
    
    console.log('3️⃣ Verificando elementos da interface...');
    
    // Verificar se estamos na aba correta
    const examTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(el => 
      el.textContent && el.textContent.toLowerCase().includes('exame')
    );
    
    if (examTab) {
      console.log('✅ Aba de exames encontrada:', examTab.textContent);
      examTab.click();
      
      // Aguardar um pouco para a aba carregar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Procurar textarea de resultados
      const resultTextarea = document.querySelector('textarea[placeholder*="resultado"], textarea[name*="result"], textarea[id*="result"]') ||
                            Array.from(document.querySelectorAll('textarea')).find(ta => 
                              ta.placeholder && ta.placeholder.toLowerCase().includes('resultado')
                            );
      
      if (resultTextarea) {
        console.log('✅ Campo de resultados encontrado');
        
        // Procurar botão de IA
        const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && (
            btn.textContent.toLowerCase().includes('ia') ||
            btn.textContent.toLowerCase().includes('ai') ||
            btn.textContent.toLowerCase().includes('processar')
          )
        );
        
        if (aiButton) {
          console.log('✅ Botão de IA encontrado:', aiButton.textContent);
          console.log('✅ Interface está pronta para uso da IA!');
        } else {
          console.log('⚠️ Botão de IA não encontrado');
          console.log('🔍 Botões disponíveis:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent).filter(text => text));
        }
      } else {
        console.log('⚠️ Campo de resultados não encontrado');
        console.log('🔍 Textareas disponíveis:', Array.from(document.querySelectorAll('textarea')).map(ta => ta.placeholder || ta.name || ta.id).filter(text => text));
      }
    } else {
      console.log('⚠️ Aba de exames não encontrada');
      console.log('🔍 Abas disponíveis:', Array.from(document.querySelectorAll('button, [role="tab"]')).map(el => el.textContent).filter(text => text));
    }
    
    console.log('4️⃣ Verificando configurações do sistema...');
    
    // Verificar se há configurações de webhook
    try {
      const { data: settings, error: settingsError } = await window.supabase
        .from('site_settings')
        .select('n8n_webhook_url')
        .order('id', { ascending: false })
        .limit(1);
      
      if (settingsError) {
        console.error('❌ Erro ao buscar configurações:', settingsError);
      } else if (settings && settings.length > 0 && settings[0].n8n_webhook_url) {
        console.log('✅ Webhook N8N configurado:', settings[0].n8n_webhook_url);
      } else {
        console.log('⚠️ Webhook N8N não configurado');
      }
    } catch (settingsError) {
      console.error('❌ Erro ao verificar configurações:', settingsError);
    }
    
    console.log('✅ Teste final concluído!');
    console.log('📊 Resumo:');
    console.log('   - Edge Function: ' + (error ? '❌ Com erro' : '✅ Funcionando'));
    console.log('   - Interface: ' + (examTab ? '✅ Disponível' : '⚠️ Verificar'));
    console.log('   - Integração: ' + (!error && examTab ? '✅ Pronta' : '⚠️ Verificar'));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testFinalAIIntegration();