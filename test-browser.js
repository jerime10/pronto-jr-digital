// Script para testar a funcionalidade no navegador
// Execute este script no console do navegador na página de atendimento

console.log('=== TESTE DE FUNCIONALIDADE ===');

// Simular preenchimento de um campo
function testFieldUpdate() {
    console.log('Iniciando teste de preenchimento de campo...');
    
    // Procurar por um campo de input
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    const textareas = document.querySelectorAll('textarea');
    
    console.log(`Encontrados ${inputs.length} inputs e ${textareas.length} textareas`);
    
    if (inputs.length > 0) {
        const input = inputs[0];
        console.log('Testando input:', input);
        
        // Simular mudança de valor
        input.value = '75';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Valor definido para:', input.value);
    }
    
    if (textareas.length > 0) {
        const textarea = textareas[0];
        console.log('Testando textarea:', textarea);
        
        // Simular mudança de valor
        textarea.value = 'Teste de resultado';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Valor definido para:', textarea.value);
    }
}

// Executar teste após 2 segundos
setTimeout(() => {
    testFieldUpdate();
}, 2000);

console.log('Script carregado. Teste será executado em 2 segundos...');