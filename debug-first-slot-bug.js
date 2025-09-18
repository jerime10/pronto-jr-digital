// Script para debugar o bug do primeiro horário (8:00)
// Problema: Ao escolher 8:00, próximo agendamento mostra apenas 2 horários
// Ao escolher outros horários, próximo agendamento mostra 3 horários

import { availabilityService } from './src/services/availabilityService.js';
import { scheduleService } from './src/services/scheduleService.js';

async function testFirstSlotBug() {
  console.log('🔍 TESTE: Bug do primeiro horário (8:00)');
  console.log('=' .repeat(50));

  // Configuração do teste
  const attendantId = 'test-attendant-id'; // Substitua por um ID real
  const serviceId = 'test-service-id'; // Substitua por um ID real
  const testDate = '2024-01-15'; // Segunda-feira para teste

  try {
    // 1. Verificar disponibilidade inicial (deve ter 4 horários)
    console.log('\n1️⃣ Verificando disponibilidade inicial...');
    const initialAvailability = await availabilityService.checkAvailability(
      attendantId,
      testDate,
      serviceId
    );
    
    console.log('Horários iniciais disponíveis:', initialAvailability.available_slots?.length || 0);
    console.log('Slots:', initialAvailability.available_slots?.map(slot => slot.time));

    if (!initialAvailability.available_slots || initialAvailability.available_slots.length === 0) {
      console.log('❌ Nenhum horário disponível encontrado. Verifique os dados de teste.');
      return;
    }

    // 2. Simular agendamento do primeiro horário (8:00)
    console.log('\n2️⃣ Simulando agendamento do primeiro horário (8:00)...');
    const firstSlot = initialAvailability.available_slots[0];
    console.log('Primeiro slot:', firstSlot);

    // Criar agendamento fictício para o primeiro horário
    const firstAppointment = await scheduleService.createAppointment({
      patient_name: 'Teste Paciente 1',
      attendant_id: attendantId,
      service_id: serviceId,
      appointment_date: testDate,
      appointment_time: firstSlot.time,
      appointment_datetime: `${testDate}T${firstSlot.time}`,
      status: 'scheduled'
    });

    console.log('Agendamento criado:', firstAppointment.id);

    // 3. Verificar disponibilidade após agendar 8:00
    console.log('\n3️⃣ Verificando disponibilidade após agendar 8:00...');
    const availabilityAfterFirst = await availabilityService.checkAvailability(
      attendantId,
      testDate,
      serviceId
    );

    console.log('Horários após agendar 8:00:', availabilityAfterFirst.available_slots?.length || 0);
    console.log('Slots restantes:', availabilityAfterFirst.available_slots?.map(slot => slot.time));

    // 4. Limpar o primeiro agendamento
    console.log('\n4️⃣ Limpando primeiro agendamento...');
    await scheduleService.deleteAppointment(firstAppointment.id);

    // 5. Simular agendamento do segundo horário (não 8:00)
    console.log('\n5️⃣ Simulando agendamento do segundo horário...');
    const secondSlot = initialAvailability.available_slots[1];
    console.log('Segundo slot:', secondSlot);

    const secondAppointment = await scheduleService.createAppointment({
      patient_name: 'Teste Paciente 2',
      attendant_id: attendantId,
      service_id: serviceId,
      appointment_date: testDate,
      appointment_time: secondSlot.time,
      appointment_datetime: `${testDate}T${secondSlot.time}`,
      status: 'scheduled'
    });

    console.log('Agendamento criado:', secondAppointment.id);

    // 6. Verificar disponibilidade após agendar segundo horário
    console.log('\n6️⃣ Verificando disponibilidade após agendar segundo horário...');
    const availabilityAfterSecond = await availabilityService.checkAvailability(
      attendantId,
      testDate,
      serviceId
    );

    console.log('Horários após agendar segundo:', availabilityAfterSecond.available_slots?.length || 0);
    console.log('Slots restantes:', availabilityAfterSecond.available_slots?.map(slot => slot.time));

    // 7. Comparar resultados
    console.log('\n7️⃣ COMPARAÇÃO DE RESULTADOS:');
    console.log('=' .repeat(30));
    console.log(`Após agendar 8:00 (primeiro): ${availabilityAfterFirst.available_slots?.length || 0} horários`);
    console.log(`Após agendar outro horário: ${availabilityAfterSecond.available_slots?.length || 0} horários`);
    
    const bugDetected = (availabilityAfterFirst.available_slots?.length || 0) !== (availabilityAfterSecond.available_slots?.length || 0);
    
    if (bugDetected) {
      console.log('🐛 BUG DETECTADO! Comportamento diferente entre primeiro e outros horários.');
    } else {
      console.log('✅ Comportamento consistente entre todos os horários.');
    }

    // Limpar segundo agendamento
    await scheduleService.deleteAppointment(secondAppointment.id);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirstSlotBug();
}

export { testFirstSlotBug };