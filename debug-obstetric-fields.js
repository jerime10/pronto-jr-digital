// Script para debugar campos obstétricos não reconhecidos
// Execute no console do navegador

function debugObstetricFields() {
  console.log('🔍 DEBUGANDO CAMPOS OBSTÉTRICOS...');
  
  // Simular o template obstétrico baseado nos logs
  const obstetricTemplate = `GRAVIDEZ: topica, unica 
FETO: vivo 
APRESENTAÇÃO: cefalica 

BCF: (texto curto) 
CORDÃO UMBILICAL: 2a e 1v 
PLACENTA: anterior alta de grau 1 
AF (MAIOR BOLSÃO VERTICAL): (texto curto) 
SEXO: feminino 

BIOMETRIA FETAL: 
BPD: (texto curto) 
HC: (texto curto) 
AC: (texto curto) 
FL: (texto curto) 
PESO: (texto curto) 
PERCENTIL: calcular 
DPP (formato data "dd/mm/aaaa") 
IG (IDADE GESTACIONAL) (texto curto) 

IMPRESSÃO DIAGNÓSTICA: 
formula 

ACHADOS ADICIONAIS (Campo de texto multilinha (textarea)) 

RECOMENDAÇÕES (Campo de texto multilinha (textarea)) 

OBSERVAÇOES (Campo de texto multilinha (textarea))`;

  console.log('📋 Template completo:', obstetricTemplate);
  
  // Encontrar todos os placeholders
  const placeholders = [
    'BCF: (texto curto)',
    'AF (MAIOR BOLSÃO VERTICAL): (texto curto)',
    'BPD: (texto curto)',
    'HC: (texto curto)',
    'AC: (texto curto)',
    'FL: (texto curto)',
    'PESO: (texto curto)',
    'DPP (formato data "dd/mm/aaaa")',
    'IG (IDADE GESTACIONAL) (texto curto)',
    'ACHADOS ADICIONAIS (Campo de texto multilinha (textarea))',
    'RECOMENDAÇÕES (Campo de texto multilinha (textarea))',
    'OBSERVAÇOES (Campo de texto multilinha (textarea))'
  ];
  
  console.log('🎯 Placeholders encontrados:', placeholders);
  console.log('📊 Total de placeholders:', placeholders.length);
  
  // Testar padrões de regex
  const patterns = [
    { name: 'Padrão 1: textarea', regex: /([A-ZÀ-ÿ\s\(\)]+)\s*\(Campo de texto multilinha \(textarea\)\)/gi },
    { name: 'Padrão 2: texto longo', regex: /([A-ZÀ-ÿ\s\(\)]+)\s*\(texto longo\)/gi },
    { name: 'Padrão 3: texto curto', regex: /([A-ZÀ-ÿ\s\(\)]+)\s*\(texto curto\)/gi },
    { name: 'Padrão 4: dois pontos + underscores', regex: /([A-ZÀ-ÿ\s\(\)]+):\s*_{2,}/gi },
    { name: 'Padrão 5: underscores simples', regex: /([A-ZÀ-ÿ\s\(\)]+)\s+_{2,}/gi },
    { name: 'Padrão 6: data', regex: /([A-ZÀ-ÿ\s\(\)]+):\s*__\/__\/____/gi },
    { name: 'Padrão 7: IG específico', regex: /IG\s*\(IDADE GESTACIONAL\)\s*\(texto curto\)/gi },
    { name: 'Padrão 8: dois pontos + texto curto', regex: /([A-ZÀ-ÿ\s\(\)]+):\s*\(texto curto\)/gi },
    { name: 'Padrão 9: sem dois pontos + texto curto', regex: /([A-ZÀ-ÿ\s\(\)]+)\s+\(texto curto\)/gi }
  ];
  
  console.log('\n🧪 TESTANDO PADRÕES:');
  
  patterns.forEach((pattern, index) => {
    console.log(`\n${index + 1}. ${pattern.name}`);
    console.log('   Regex:', pattern.regex);
    
    pattern.regex.lastIndex = 0; // Reset regex
    const matches = [...obstetricTemplate.matchAll(pattern.regex)];
    
    console.log('   Matches:', matches.length);
    matches.forEach((match, i) => {
      console.log(`   ${i + 1}: "${match[0]}" → Campo: "${match[1] || 'N/A'}"`);
    });
  });
  
  // Verificar quais placeholders NÃO foram capturados
  console.log('\n❌ PLACEHOLDERS NÃO CAPTURADOS:');
  
  let capturedPlaceholders = new Set();
  
  patterns.forEach(pattern => {
    pattern.regex.lastIndex = 0;
    const matches = [...obstetricTemplate.matchAll(pattern.regex)];
    matches.forEach(match => {
      capturedPlaceholders.add(match[0]);
    });
  });
  
  const uncaptured = placeholders.filter(p => !capturedPlaceholders.has(p));
  console.log('Não capturados:', uncaptured);
  console.log('Total não capturados:', uncaptured.length);
  
  return {
    totalPlaceholders: placeholders.length,
    capturedCount: capturedPlaceholders.size,
    uncapturedCount: uncaptured.length,
    uncaptured: uncaptured
  };
}

// Executar automaticamente
console.log('🚀 Executando debug dos campos obstétricos...');
const result = debugObstetricFields();
console.log('\n📊 RESUMO:', result);