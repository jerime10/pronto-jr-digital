// Teste para confirmar o bug na função isTimeSlotExpired
// Hipótese: A função está marcando horários como expirados incorretamente

function isTimeSlotExpired(date, timeSlot) {
  const now = new Date();
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Adiciona 15 minutos ao horário do slot
  const expirationTime = new Date(slotDateTime.getTime() + 15 * 60 * 1000);
  
  console.log(`Verificando expiração para ${timeSlot}:`);
  console.log(`  Data do slot: ${slotDateTime.toISOString()}`);
  console.log(`  Horário atual: ${now.toISOString()}`);
  console.log(`  Expira em: ${expirationTime.toISOString()}`);
  console.log(`  Expirado? ${now > expirationTime}`);
  console.log('');
  
  return now > expirationTime;
}

function testExpirationBug() {
  console.log('🔍 TESTE: Bug na função isTimeSlotExpired');
  console.log('=' .repeat(50));

  // Simular data de hoje
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const testDate = new Date(dateString + 'T00:00:00.000Z');
  
  console.log(`Data de teste: ${testDate.toISOString()}`);
  console.log(`Horário atual: ${new Date().toISOString()}`);
  console.log('');

  // Testar horários típicos de agendamento
  const testSlots = [
    '08:00',
    '08:30', 
    '09:00',
    '09:30',
    '10:00',
    '14:00',
    '15:00',
    '16:00'
  ];

  console.log('📅 CENÁRIO 1: Testando horários para hoje');
  testSlots.forEach(slot => {
    const expired = isTimeSlotExpired(testDate, slot);
    console.log(`${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
  });

  // Testar com data futura
  console.log('\n📅 CENÁRIO 2: Testando horários para amanhã');
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  const tomorrowDate = new Date(tomorrowString + 'T00:00:00.000Z');
  
  console.log(`Data de teste: ${tomorrowDate.toISOString()}`);
  console.log('');
  
  testSlots.forEach(slot => {
    const expired = isTimeSlotExpired(tomorrowDate, slot);
    console.log(`${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
  });

  // Testar cenário específico do bug
  console.log('\n📅 CENÁRIO 3: Simulando o bug reportado');
  console.log('Situação: Usuário agenda 8:00, depois tenta ver horários disponíveis');
  
  // Simular que são 8:20 (após agendar 8:00)
  const simulatedTime = new Date(testDate);
  simulatedTime.setHours(8, 20, 0, 0);
  
  // Sobrescrever Date.now() temporariamente
  const originalNow = Date.now;
  Date.now = () => simulatedTime.getTime();
  
  console.log(`Horário simulado: ${simulatedTime.toISOString()}`);
  console.log('Verificando disponibilidade dos horários restantes:');
  
  const remainingSlots = ['08:30', '09:00', '09:30'];
  remainingSlots.forEach(slot => {
    const expired = isTimeSlotExpired(testDate, slot);
    console.log(`${slot}: ${expired ? '❌ EXPIRADO' : '✅ DISPONÍVEL'}`);
  });
  
  // Restaurar Date.now()
  Date.now = originalNow;

  console.log('\n🔍 ANÁLISE DO BUG:');
  console.log('Se o horário 8:00 foi agendado e agora são 8:20,');
  console.log('os horários 8:30, 9:00, 9:30 deveriam estar disponíveis.');
  console.log('Se algum deles aparece como EXPIRADO, há um bug na lógica.');
}

// Executar teste
testExpirationBug();