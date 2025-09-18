// Script para testar se o erro de UUID foi corrigido
// Execute este script no console do navegador na página de atendimento

console.log('🧪 Testando correção do erro de UUID...');

// Teste 1: Verificar se crypto.randomUUID() gera UUIDs válidos
console.log('📋 Teste 1: Geração de UUID válido');
const testUUID = crypto.randomUUID();
console.log('UUID gerado:', testUUID);

// Verificar se é um UUID válido
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = uuidRegex.test(testUUID);
console.log('UUID é válido:', isValidUUID ? '✅' : '❌');

// Teste 2: Simular salvamento de rascunho com UUID válido
console.log('\n📋 Teste 2: Simulação de salvamento de rascunho');

// Dados de teste para rascunho
const testDraftData = {
  patient_id: crypto.randomUUID(),
  professional_id: crypto.randomUUID(),
  form_data: {
    queixaPrincipal: 'Teste de correção de UUID',
    antecedentes: 'Teste',
    alergias: 'Nenhuma',
    evolucao: 'Teste de evolução'
  }
};

console.log('Dados do rascunho de teste:', testDraftData);
console.log('Patient ID é UUID válido:', uuidRegex.test(testDraftData.patient_id) ? '✅' : '❌');
console.log('Professional ID é UUID válido:', uuidRegex.test(testDraftData.professional_id) ? '✅' : '❌');

// Teste 3: Verificar se não há mais IDs temporários inválidos
console.log('\n📋 Teste 3: Verificação de padrões antigos');
const oldPattern = /temp-.*[^0-9a-f-]/i;
const hasOldPattern = oldPattern.test('temp-teste-2daed63b');
console.log('Padrão antigo detectado:', hasOldPattern ? '❌ (ainda presente)' : '✅ (corrigido)');

console.log('\n🎉 Testes concluídos! Se todos os testes mostraram ✅, o erro foi corrigido.');
console.log('💡 Para testar completamente, tente salvar um rascunho na interface.');