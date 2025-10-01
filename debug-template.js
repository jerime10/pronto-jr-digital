// Debug dos padrões de regex

const template = `EXAME MÉDICO

IMPRESSÃO DIAGNÓSTICA:
. ___

Peso: ___

DATA DO EXAME: ___

Observações gerais do exame.`;

console.log('=== TEMPLATE ORIGINAL ===');
console.log(template);
console.log('\n=== ANÁLISE LINHA POR LINHA ===');

const lines = template.split('\n');
lines.forEach((line, index) => {
  console.log(`Linha ${index + 1}: "${line}"`);
  
  // Verificar se contém underscores
  if (line.includes('___')) {
    console.log(`  ✅ Contém placeholders: ${line.match(/_{3,}/g)}`);
    
    // Testar padrões específicos
    console.log('  🔍 Testando padrões:');
    
    // Padrão 1: CAMPO: ___
    const pattern1 = /^([^:]+):\s*_{2,}/;
    const match1 = line.match(pattern1);
    console.log(`    Padrão "CAMPO: ___": ${match1 ? 'MATCH' : 'NO MATCH'}`);
    if (match1) console.log(`      Campo encontrado: "${match1[1]}"`);
    
    // Padrão 2: CAMPO ___
    const pattern2 = /^([^:]+)\s+_{2,}/;
    const match2 = line.match(pattern2);
    console.log(`    Padrão "CAMPO ___": ${match2 ? 'MATCH' : 'NO MATCH'}`);
    if (match2) console.log(`      Campo encontrado: "${match2[1]}"`);
    
    // Padrão 3: . ___
    const pattern3 = /^\.\s+_{2,}/;
    const match3 = line.match(pattern3);
    console.log(`    Padrão ". ___": ${match3 ? 'MATCH' : 'NO MATCH'}`);
  }
  console.log('');
});

console.log('\n=== TESTE DE SUBSTITUIÇÃO ESPECÍFICA ===');

// Teste específico para "Peso: ___"
const pesoPattern = /Peso:\s*_{2,}/gi;
console.log('Padrão para Peso:', pesoPattern);
console.log('Teste no template:', pesoPattern.test(template));
console.log('Matches:', template.match(pesoPattern));

// Teste específico para "DATA DO EXAME: ___"
const dataPattern = /DATA DO EXAME:\s*_{2,}/gi;
console.log('\nPadrão para Data:', dataPattern);
console.log('Teste no template:', dataPattern.test(template));
console.log('Matches:', template.match(dataPattern));

// Teste de substituição real
console.log('\n=== TESTE DE SUBSTITUIÇÃO REAL ===');
let result = template;

// Substituir Peso
result = result.replace(/Peso:\s*_{2,}/gi, 'Peso: 75kg');
console.log('Após substituir Peso:');
console.log(result);

// Substituir Data
result = result.replace(/DATA DO EXAME:\s*_{2,}/gi, 'DATA DO EXAME: 15/01/2024');
console.log('\nApós substituir Data:');
console.log(result);

console.log('\n=== RESULTADO FINAL ===');
console.log('Ainda tem placeholders?', result.includes('___'));