// Debug da disponibilidade de horários
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAvailability() {
  try {
    console.log('🔍 Debug da Disponibilidade de Horários\n');

    const testDate = '2025-01-20'; // Segunda-feira
    const attendantId = '1875a1f1-e3b9-4e7d-acba-946737e03e50'; // Jerime

    console.log(`📅 Testando data: ${testDate}`);
    console.log(`👨‍⚕️ Atendente: ${attendantId}\n`);

    // 1. Verificar se existem atendentes
    console.log('1️⃣ Verificando atendentes...');
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select('*')
      .eq('is_active', true);

    if (attendantsError) {
      console.error('❌ Erro ao buscar atendentes:', attendantsError);
      return;
    }

    console.log(`✅ Atendentes ativos encontrados: ${attendants?.length || 0}`);
    if (attendants?.length > 0) {
      attendants.forEach(att => {
        console.log(`   - ${att.name} (${att.id})`);
      });
    }
    console.log();

    // 2. Verificar se existem schedules
    console.log('2️⃣ Verificando schedules...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true);

    if (schedulesError) {
      console.error('❌ Erro ao buscar schedules:', schedulesError);
      return;
    }

    console.log(`✅ Schedules ativos encontrados: ${schedules?.length || 0}`);
    if (schedules?.length > 0) {
      schedules.forEach(sch => {
        console.log(`   - Dia ${sch.day_of_week}: ${sch.start_time} - ${sch.end_time}`);
      });
    }
    console.log();

    // 3. Verificar schedule_assignments
    console.log('3️⃣ Verificando schedule_assignments...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*),
        schedule:schedules(*)
      `)
      .eq('attendant_id', attendantId)
      .eq('is_available', true);

    if (assignmentsError) {
      console.error('❌ Erro ao buscar assignments:', assignmentsError);
      return;
    }

    console.log(`✅ Assignments encontrados: ${assignments?.length || 0}`);
    if (assignments?.length > 0) {
      assignments.forEach((ass, index) => {
        console.log(`   ${index + 1}. ${ass.start_time} - ${ass.end_time}`);
        console.log(`      Schedule: Dia ${ass.schedule?.day_of_week}, Ativo: ${ass.schedule?.is_active}`);
        console.log(`      Data específica: ${ass.specific_date || 'Nenhuma'}`);
      });
    }
    console.log();

    // 4. Simular a função checkAvailability
    console.log('4️⃣ Simulando checkAvailability...');
    
    // Calcular dia da semana corretamente
    const [year, month, day] = testDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    console.log(`📊 Dia da semana calculado: ${dayOfWeek} (1=segunda, 7=domingo)`);

    // Buscar assignments com filtro de data
    const { data: filteredAssignments, error: filteredError } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*),
        schedule:schedules(*)
      `)
      .eq('attendant_id', attendantId)
      .eq('is_available', true)
      .or(`specific_date.eq."${testDate}",specific_date.is.null`)
      .order('start_time', { ascending: true });

    if (filteredError) {
      console.error('❌ Erro ao buscar assignments filtrados:', filteredError);
      return;
    }

    console.log(`📋 Assignments após filtro de data: ${filteredAssignments?.length || 0}`);

    // Aplicar filtro de dia da semana
    const availableSlots = filteredAssignments?.filter(assignment => {
      console.log(`\n🔍 Analisando assignment ${assignment.id}:`);
      console.log(`   Data específica: ${assignment.specific_date}`);
      console.log(`   Schedule day_of_week: ${assignment.schedule?.day_of_week}`);
      console.log(`   Schedule is_active: ${assignment.schedule?.is_active}`);

      if (assignment.specific_date) {
        const matches = assignment.specific_date === testDate;
        console.log(`   ✅ Corresponde à data específica: ${matches}`);
        return matches;
      }
      
      const schedule = assignment.schedule;
      if (schedule && schedule.day_of_week !== null) {
        const dayMatches = schedule.day_of_week === dayOfWeek;
        const isActive = schedule.is_active;
        const matches = dayMatches && isActive;
        console.log(`   ✅ Corresponde ao dia da semana: ${dayMatches} && ativo: ${isActive} = ${matches}`);
        return matches;
      }
      
      console.log(`   ❌ Não corresponde a nenhum critério`);
      return false;
    }) || [];

    console.log(`\n🎯 Horários disponíveis finais: ${availableSlots.length}`);

    if (availableSlots.length > 0) {
      console.log('\n📅 Lista de horários disponíveis:');
      availableSlots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.start_time} - ${slot.end_time}`);
      });
    } else {
      console.log('\n❌ Nenhum horário disponível encontrado!');
    }

    // 5. Verificar agendamentos existentes
    console.log('\n5️⃣ Verificando agendamentos existentes...');
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('attendant_id', attendantId)
      .eq('appointment_date', testDate)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('❌ Erro ao buscar agendamentos:', appointmentsError);
    } else {
      console.log(`📋 Agendamentos existentes: ${existingAppointments?.length || 0}`);
      if (existingAppointments?.length > 0) {
        existingAppointments.forEach(app => {
          console.log(`   - ${app.start_time} - ${app.end_time} (${app.status})`);
        });
      }
    }

    console.log('\n🎉 Debug concluído!');

  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}

debugAvailability();