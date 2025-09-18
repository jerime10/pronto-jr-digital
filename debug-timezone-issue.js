// Debug do problema de fuso horário na função isTimeSlotExpired

function analyzeTimezoneIssue() {
  console.log('🕐 ANÁLISE DO PROBLEMA DE FUSO HORÁRIO');
  console.log('=' .repeat(50));

  const now = new Date();
  console.log(`Horário atual (local): ${now.toString()}`);
  console.log(`Horário atual (UTC): ${now.toISOString()}`);
  console.log(`Timezone offset: ${now.getTimezoneOffset()} minutos`);
  console.log('');

  // Simular data de hoje
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const testDate = new Date(dateString + 'T00:00:00.000Z');
  
  console.log('📅 PROBLEMA IDENTIFICADO:');
  console.log(`Data criada: ${testDate.toISOString()}`);
  console.log(`Data criada (local): ${testDate.toString()}`);
  console.log('');

  // Testar criação de horário
  const timeSlot = '08:00';
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  console.log('🔧 MÉTODO ATUAL (BUGADO):');
  const slotDateTime = new Date(testDate);
  slotDateTime.setHours(hours, minutes, 0, 0);
  console.log(`Slot criado: ${slotDateTime.toISOString()}`);
  console.log(`Slot criado (local): ${slotDateTime.toString()}`);
  console.log('');

  console.log('✅ MÉTODO CORRETO:');
  // Criar data no fuso horário local
  const correctSlotDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
  console.log(`Slot correto: ${correctSlotDateTime.toISOString()}`);
  console.log(`Slot correto (local): ${correctSlotDateTime.toString()}`);
  console.log('');

  console.log('🔍 COMPARAÇÃO:');
  console.log(`Diferença: ${Math.abs(slotDateTime.getTime() - correctSlotDateTime.getTime()) / (1000 * 60 * 60)} horas`);
  
  // Testar expiração
  const expirationTime1 = new Date(slotDateTime.getTime() + 15 * 60 * 1000);
  const expirationTime2 = new Date(correctSlotDateTime.getTime() + 15 * 60 * 1000);
  
  console.log('');
  console.log('⏰ TESTE DE EXPIRAÇÃO:');
  console.log(`Método bugado - expira em: ${expirationTime1.toString()}`);
  console.log(`Método correto - expira em: ${expirationTime2.toString()}`);
  console.log(`Bugado expirado? ${now > expirationTime1}`);
  console.log(`Correto expirado? ${now > expirationTime2}`);
}

analyzeTimezoneIssue();