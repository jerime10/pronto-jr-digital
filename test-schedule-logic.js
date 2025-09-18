import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para obter o nome do dia da semana em português
const getDayOfWeekName = (date) => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
};

// Função para verificar se um horário expirou (15 minutos após o horário)
const isTimeSlotExpired = (date, timeSlot) => {
  const now = new Date();
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Adiciona 15 minutos ao horário do slot
  const expirationTime = new Date(slotDateTime.getTime() + 15 * 60 * 1000);
  
  return now > expirationTime;
};

async function testScheduleLogic() {
  console.log('=== TESTE DA LÓGICA DE HORÁRIOS ===\n');
  
  // Teste com data de hoje
  const today = new Date();
  const dayOfWeek = getDayOfWeekName(today);
  
  console.log(`Data de teste: ${today.toLocaleDateString('pt-BR')}`);
  console.log(`Dia da semana: ${dayOfWeek}\n`);
  
  // Teste com o primeiro atendente (Jerime)
  const attendantId = '1875a1f1-e3b9-4e7d-acba-946737e03e50';
  console.log(`Testando com atendente ID: ${attendantId}\n`);
  
  try {
    // 1. Buscar schedule_assignments do atendente
    console.log('1. Buscando schedule_assignments...');
    const { data: scheduleAssignments, error: assignmentError } = await supabase
      .from('schedule_assignments')
      .select('schedule_id, schedule_info')
      .eq('attendant_id', attendantId);

    if (assignmentError) throw assignmentError;
    
    console.log(`   Encontrados: ${scheduleAssignments?.length || 0} assignments`);
    if (scheduleAssignments?.length > 0) {
      scheduleAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}: ${assignment.schedule_info} (ID: ${assignment.schedule_id})`);
      });
    }
    console.log('');

    if (!scheduleAssignments || scheduleAssignments.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Atendente não tem schedule_assignments!');
      console.log('   Solução: Associar horários ao atendente na tabela schedule_assignments\n');
      
      // Vamos verificar se existem schedules disponíveis
      console.log('2. Verificando schedules disponíveis para associar...');
      const { data: availableSchedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('id, day, days, start_time, duration, available')
        .eq('available', true);
        
      if (scheduleError) throw scheduleError;
      
      console.log(`   Schedules disponíveis: ${availableSchedules?.length || 0}`);
      if (availableSchedules?.length > 0) {
        availableSchedules.forEach((schedule, index) => {
          console.log(`   ${index + 1}: ${schedule.start_time} - Dias: ${schedule.days?.join(', ')} (ID: ${schedule.id})`);
        });
        
        console.log('\n3. Criando associação para o atendente...');
        // Vamos associar o primeiro schedule ao atendente
        const scheduleToAssign = availableSchedules[0];
        
        const { data: newAssignment, error: insertError } = await supabase
          .from('schedule_assignments')
          .insert({
            attendant_id: attendantId,
            attendant_name: 'Jerime R. Soares p',
            schedule_id: scheduleToAssign.id,
            schedule_info: `${scheduleToAssign.days?.join(' à ')} - ${scheduleToAssign.start_time} (${scheduleToAssign.duration} minutos)`
          })
          .select();
          
        if (insertError) {
          console.log(`   ❌ Erro ao criar associação: ${insertError.message}`);
        } else {
          console.log(`   ✅ Associação criada com sucesso!`);
          console.log(`   Detalhes: ${newAssignment[0].schedule_info}`);
        }
      }
      return;
    }

    // 2. Buscar os schedules correspondentes
    console.log('2. Buscando schedules correspondentes...');
    const scheduleIds = scheduleAssignments.map(assignment => assignment.schedule_id);
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('id, day, days, start_time, duration, available')
      .in('id', scheduleIds)
      .eq('available', true);

    if (scheduleError) throw scheduleError;
    
    console.log(`   Schedules encontrados: ${schedules?.length || 0}`);
    if (schedules?.length > 0) {
      schedules.forEach((schedule, index) => {
        console.log(`   ${index + 1}: ${schedule.start_time} - Dias: ${schedule.days?.join(', ')}`);
      });
    }
    console.log('');

    // 3. Filtrar por dia da semana
    console.log('3. Filtrando por dia da semana...');
    const daySchedules = schedules?.filter(schedule => {
      return schedule.days && schedule.days.includes(dayOfWeek);
    }) || [];
    
    console.log(`   Schedules para ${dayOfWeek}: ${daySchedules.length}`);
    if (daySchedules.length > 0) {
      daySchedules.forEach((schedule, index) => {
        console.log(`   ${index + 1}: ${schedule.start_time} (${schedule.duration} min)`);
      });
    }
    console.log('');

    // 4. Gerar slots e verificar expiração
    console.log('4. Gerando slots de horário...');
    const availableSlots = [];
    
    for (const schedule of daySchedules) {
      const startTime = schedule.start_time;
      
      // Converter start_time para formato HH:MM se necessário
      let formattedStartTime = startTime;
      if (startTime.includes(':')) {
        const timeParts = startTime.split(':');
        formattedStartTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
      
      // Verificar se o horário não expirou
      const expired = isTimeSlotExpired(today, formattedStartTime);
      console.log(`   ${formattedStartTime} - ${expired ? 'EXPIRADO' : 'DISPONÍVEL'}`);
      
      if (!expired) {
        availableSlots.push(formattedStartTime);
      }
    }
    
    console.log(`\n   Slots disponíveis após filtro de expiração: ${availableSlots.length}`);
    console.log(`   Horários: ${availableSlots.join(', ')}\n`);

    // 5. Adicionar mais horários para teste
    console.log('5. Adicionando mais horários para teste...');
    const currentHour = new Date().getHours();
    const futureHours = [];
    
    // Adicionar horários futuros (próximas 3 horas)
    for (let i = 1; i <= 3; i++) {
      const futureHour = currentHour + i;
      if (futureHour < 18) { // Até 18h
        futureHours.push(`${futureHour.toString().padStart(2, '0')}:00`);
      }
    }
    
    if (futureHours.length > 0) {
      console.log(`   Adicionando horários: ${futureHours.join(', ')}`);
      
      for (const hour of futureHours) {
        // Verificar se já existe um schedule para este horário
        const { data: existingSchedule } = await supabase
          .from('schedules')
          .select('id')
          .eq('start_time', hour)
          .single();
          
        if (!existingSchedule) {
          // Criar novo schedule
          const { data: newSchedule, error: scheduleError } = await supabase
            .from('schedules')
            .insert({
              day: 'Segunda',
              days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
              start_time: hour,
              duration: 30,
              available: true
            })
            .select()
            .single();
            
          if (!scheduleError && newSchedule) {
            // Criar assignment para o atendente
            await supabase
              .from('schedule_assignments')
              .insert({
                attendant_id: attendantId,
                attendant_name: 'Jerime R. Soares p',
                schedule_id: newSchedule.id,
                schedule_info: `Segunda à Sexta - ${hour} (30 minutos)`
              });
              
            console.log(`   ✅ Horário ${hour} adicionado com sucesso`);
          }
        }
      }
    }

    // 6. Verificar agendamentos existentes
    console.log('\n6. Verificando agendamentos existentes...');
    const dateString = today.toISOString().split('T')[0];
    
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', dateString)
      .eq('professional_id', attendantId)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (appointmentError) {
      console.error('Erro ao buscar agendamentos:', appointmentError);
      console.log('Isso é normal se a tabela appointments ainda não existir');
    }
    
    console.log(`   Agendamentos encontrados: ${appointments?.length || 0}`);
    
    if (appointments?.length > 0) {
      console.log('   Estrutura do primeiro agendamento:');
      console.log('   ', Object.keys(appointments[0]));
    }
    
    const occupiedSlots = appointments?.map(apt => {
      // Tentar diferentes campos possíveis
      const timeStr = apt.appointment_time || apt.time;
      if (timeStr && timeStr.includes(':')) {
        const timeParts = timeStr.split(':');
        return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
      return timeStr;
    }).filter(Boolean) || [];
    
    if (occupiedSlots.length > 0) {
      console.log(`   Horários ocupados: ${occupiedSlots.join(', ')}`);
    }

    // 7. Resultado final
    const finalAvailableSlots = availableSlots
      .filter(slot => !occupiedSlots.includes(slot))
      .sort();
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`Horários disponíveis: ${finalAvailableSlots.length}`);
    if (finalAvailableSlots.length > 0) {
      console.log(`Horários: ${finalAvailableSlots.join(', ')}`);
    } else {
      console.log('❌ Nenhum horário disponível para esta data');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testScheduleLogic();