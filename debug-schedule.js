import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugScheduleData() {
  console.log('=== DIAGNÓSTICO DE HORÁRIOS DISPONÍVEIS ===\n');

  try {
    // 1. Verificar dados na tabela schedule_assignments
    console.log('1. Verificando dados na tabela schedule_assignments:');
    const { data: assignments, error: assignmentError } = await supabase
      .from('schedule_assignments')
      .select('*');
    
    if (assignmentError) {
      console.error('Erro ao buscar schedule_assignments:', assignmentError);
    } else {
      console.log(`Total de registros: ${assignments?.length || 0}`);
      if (assignments && assignments.length > 0) {
        console.log('Primeiros 3 registros:');
        assignments.slice(0, 3).forEach((assignment, index) => {
          console.log(`  ${index + 1}:`, assignment);
        });
      }
    }

    // 2. Verificar dados na tabela schedules
    console.log('\n2. Verificando dados na tabela schedules:');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');
    
    if (scheduleError) {
      console.error('Erro ao buscar schedules:', scheduleError);
    } else {
      console.log(`Total de registros: ${schedules?.length || 0}`);
      if (schedules && schedules.length > 0) {
        console.log('Primeiros 3 registros:');
        schedules.slice(0, 3).forEach((schedule, index) => {
          console.log(`  ${index + 1}:`, schedule);
        });
      }
    }

    // 3. Verificar dados na tabela attendants
    console.log('\n3. Verificando dados na tabela attendants:');
    const { data: attendants, error: attendantError } = await supabase
      .from('attendants')
      .select('id, name, available, is_active');
    
    if (attendantError) {
      console.error('Erro ao buscar attendants:', attendantError);
    } else {
      console.log(`Total de registros: ${attendants?.length || 0}`);
      if (attendants && attendants.length > 0) {
        console.log('Atendentes disponíveis:');
        attendants.forEach((attendant, index) => {
          console.log(`  ${index + 1}: ${attendant.name} (ID: ${attendant.id}, Disponível: ${attendant.available}, Ativo: ${attendant.is_active})`);
        });
      }
    }

    // 4. Simular busca de horários para um atendente específico
    if (attendants && attendants.length > 0) {
      const firstAttendant = attendants[0];
      console.log(`\n4. Simulando busca de horários para: ${firstAttendant.name} (ID: ${firstAttendant.id})`);
      
      const { data: attendantAssignments, error: attendantAssignmentError } = await supabase
        .from('schedule_assignments')
        .select('schedule_id, schedule_info')
        .eq('attendant_id', firstAttendant.id);

      if (attendantAssignmentError) {
        console.error('Erro ao buscar assignments do atendente:', attendantAssignmentError);
      } else {
        console.log(`Assignments encontrados: ${attendantAssignments?.length || 0}`);
        if (attendantAssignments && attendantAssignments.length > 0) {
          console.log('Schedule IDs:', attendantAssignments.map(a => a.schedule_id));
          
          // Buscar os schedules correspondentes
          const scheduleIds = attendantAssignments.map(a => a.schedule_id);
          const { data: attendantSchedules, error: attendantScheduleError } = await supabase
            .from('schedules')
            .select('*')
            .in('id', scheduleIds);

          if (attendantScheduleError) {
            console.error('Erro ao buscar schedules do atendente:', attendantScheduleError);
          } else {
            console.log(`Schedules encontrados: ${attendantSchedules?.length || 0}`);
            attendantSchedules?.forEach((schedule, index) => {
              console.log(`  Schedule ${index + 1}:`, {
                id: schedule.id,
                days: schedule.days,
                start_time: schedule.start_time,
                duration: schedule.duration,
                available: schedule.available
              });
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugScheduleData();