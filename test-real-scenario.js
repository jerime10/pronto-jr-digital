// Teste que simula exatamente o cenário do bug reportado

function isTimeSlotExpired(date, timeSlot, currentTime) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Adiciona 15 minutos ao horário do slot
  const expirationTime = new Date(slotDateTime.getTime() + 15 * 60 * 1000);
  
  return currentTime > expirationTime;
}

function simulateRealScenario() {
  console.log('🎯 SIMULAÇÃO DO CENÁRIO REAL DO BUG');
  console.log('=' .repeat(50));

  // Data de hoje
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  console.log(`📅 Data selecionada: ${selectedDate.toString()}`);
  console.log('');

  // CENÁRIO 1: Primeira consulta - 7:30 AM
  console.log('📋 CENÁRIO 1: Primeira consulta de disponibilidade (7:30 AM)');
  const time730 = new Date(selectedDate);
  time730.setHours(7, 30, 0, 0);
  console.log(`🕐 Horário atual: ${time730.toString()}`);
  
  const initialSlots = ['08:00', '08:30', '09:00', '09:30'];
  console.log('Horários teoricamente disponíveis: 8:00, 8:30, 9:00, 9:30');
  
  console.log('Resultado da filtragem:');
  const availableSlots1 = [];
  initialSlots.forEach(slot => {
    const expired = isTimeSlotExpired(selectedDate, slot, time730);
    console.log(`  ${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
    if (!expired) availableSlots1.push(slot);
  });
  console.log(`Total disponível: ${availableSlots1.length}`);
  console.log('');

  // CENÁRIO 2: Usuário agenda 8:00, agora são 8:05
  console.log('📋 CENÁRIO 2: Usuário agendou 8:00, agora são 8:05');
  const time805 = new Date(selectedDate);
  time805.setHours(8, 5, 0, 0);
  console.log(`🕐 Novo horário: ${time805.toString()}`);
  
  const remainingSlots = ['08:30', '09:00', '09:30'];
  console.log('Horários restantes para verificar: 8:30, 9:00, 9:30');
  
  console.log('Resultado da filtragem:');
  const availableSlots2 = [];
  remainingSlots.forEach(slot => {
    const expired = isTimeSlotExpired(selectedDate, slot, time805);
    console.log(`  ${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
    if (!expired) availableSlots2.push(slot);
  });
  console.log(`Total disponível: ${availableSlots2.length}`);
  console.log('');

  // CENÁRIO 3: Usuário agenda 8:30, agora são 8:35
  console.log('📋 CENÁRIO 3: Usuário agendou 8:30, agora são 8:35');
  const time835 = new Date(selectedDate);
  time835.setHours(8, 35, 0, 0);
  console.log(`🕐 Novo horário: ${time835.toString()}`);
  
  const remainingSlots3 = ['09:00', '09:30'];
  console.log('Horários restantes para verificar: 9:00, 9:30');
  
  console.log('Resultado da filtragem:');
  const availableSlots3 = [];
  remainingSlots3.forEach(slot => {
    const expired = isTimeSlotExpired(selectedDate, slot, time835);
    console.log(`  ${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
    if (!expired) availableSlots3.push(slot);
  });
  console.log(`Total disponível: ${availableSlots3.length}`);
  console.log('');

  console.log('🔍 ANÁLISE DOS RESULTADOS:');
  console.log(`Cenário 1 (7:30): ${availableSlots1.length} horários disponíveis`);
  console.log(`Cenário 2 (8:05): ${availableSlots2.length} horários disponíveis`);
  console.log(`Cenário 3 (8:35): ${availableSlots3.length} horários disponíveis`);
  console.log('');
  
  // Análise detalhada do problema
  console.log('🔍 ANÁLISE DETALHADA:');
  console.log('');
  
  // Verificar se 8:30 expira incorretamente às 8:05
  const slot830At805 = isTimeSlotExpired(selectedDate, '08:30', time805);
  console.log(`❓ 8:30 expira às 8:05? ${slot830At805 ? 'SIM (BUG!)' : 'NÃO (correto)'}`);
  
  // Mostrar quando 8:30 deveria expirar
  const slot830DateTime = new Date(selectedDate);
  slot830DateTime.setHours(8, 30, 0, 0);
  const slot830Expiration = new Date(slot830DateTime.getTime() + 15 * 60 * 1000);
  console.log(`📅 8:30 deveria expirar em: ${slot830Expiration.toString()}`);
  console.log(`📅 Horário atual (8:05): ${time805.toString()}`);
  console.log(`⏰ Diferença: ${(slot830Expiration.getTime() - time805.getTime()) / (1000 * 60)} minutos`);
  console.log('');
  
  if (availableSlots1.length === 4 && availableSlots2.length === 3 && availableSlots3.length === 2) {
    console.log('✅ COMPORTAMENTO CORRETO!');
    console.log('- Às 7:30: 4 horários disponíveis');
    console.log('- Às 8:05 (após agendar 8:00): 3 horários disponíveis');
    console.log('- Às 8:35 (após agendar 8:30): 2 horários disponíveis');
  } else {
    console.log('🐛 BUG DETECTADO!');
    console.log('Comportamento esperado vs atual:');
    console.log(`- Às 7:30: esperado 4, atual ${availableSlots1.length}`);
    console.log(`- Às 8:05: esperado 3, atual ${availableSlots2.length}`);
    console.log(`- Às 8:35: esperado 2, atual ${availableSlots3.length}`);
  }
}

simulateRealScenario();