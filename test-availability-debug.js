// ============================================
// SCRIPT DE TESTE PARA DEBUG DE DISPONIBILIDADE
// ============================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// SIMULAÇÃO DO DEBUGLOGGER
// ============================================

const debugLogger = {
  info: (service, action, data) => {
    console.log(`🔵 [${service}] ${action}:`, JSON.stringify(data, null, 2));
  },
  debug: (service, action, data) => {
    console.log(`🟡 [${service}] ${action}:`, JSON.stringify(data, null, 2));
  },
  warn: (service, action, data) => {
    console.log(`🟠 [${service}] ${action}:`, JSON.stringify(data, null, 2));
  },
  error: (service, action, data) => {
    console.log(`🔴 [${service}] ${action}:`, JSON.stringify(data, null, 2));
  }
};

const timers = new Map();

const startTimer = (name) => {
  timers.set(name, Date.now());
};

const endTimer = (service, action, name, data = {}) => {
  const startTime = timers.get(name);
  if (startTime) {
    const duration = Date.now() - startTime;
    debugLogger.info(service, action, { ...data, duration_ms: duration });
    timers.delete(name);
  }
};

// ============================================
// UTILITÁRIOS DE TEMPO
// ============================================

const timeUtils = {
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  addMinutes(time, minutes) {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  }
};

// ============================================
// SIMULAÇÃO DOS SERVIÇOS
// ============================================

const scheduleAssignmentService = {
  async getAssignmentsByAttendantAndDate(attendantId, date) {
    const timerName = `getAssignmentsByAttendantAndDate_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('ScheduleService', 'getAssignmentsByAttendantAndDate_start', {
      attendantId,
      date,
      timestamp: new Date().toISOString()
    });

    // Calcular dia da semana
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    debugLogger.debug('ScheduleService', 'date_calculation', {
      attendantId,
      date,
      parsedDate: { year, month, day },
      dateObj: dateObj.toISOString(),
      jsDay,
      dayOfWeek
    });

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDayName = dayNames[jsDay];

    debugLogger.info('ScheduleService', 'day_mapping', {
      attendantId,
      date,
      jsDay,
      currentDayName,
      dayNames
    });

    // Buscar atribuições
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*),
        schedule:schedules(*)
      `)
      .eq('attendant_id', attendantId)
      .eq('is_available', true)
      .or(`specific_date.eq."${date}",specific_date.is.null`)
      .order('start_time', { ascending: true });

    debugLogger.info('ScheduleService', 'schedule_assignments_query_result', {
      attendantId,
      date,
      success: !error,
      error: error?.message,
      assignmentsCount: assignments?.length || 0,
      rawAssignments: assignments?.map(a => ({
        id: a.id,
        schedule_id: a.schedule_id,
        start_time: a.start_time,
        end_time: a.end_time,
        specific_date: a.specific_date,
        is_available: a.is_available,
        schedule: a.schedule ? {
          id: a.schedule.id,
          day: a.schedule.day,
          days: a.schedule.days,
          is_active: a.schedule.is_active
        } : null
      }))
    });

    if (error) {
      debugLogger.error('ScheduleService', 'schedule_assignments_query_error', {
        attendantId,
        date,
        error: error.message
      });
      endTimer('ScheduleService', 'getAssignmentsByAttendantAndDate_error', timerName, { error: error.message });
      throw new Error(`Erro ao buscar atribuições: ${error.message}`);
    }

    // Filtrar por dia da semana
    const filteredAssignments = assignments?.filter(assignment => {
      if (assignment.specific_date) {
        return assignment.specific_date === date;
      }
      
      const schedule = assignment.schedule;
      if (schedule && schedule.is_active) {
        if (schedule.days && Array.isArray(schedule.days)) {
          return schedule.days.includes(currentDayName);
        }
        if (schedule.day) {
          return schedule.day === currentDayName;
        }
      }
      
      return false;
    }) || [];

    debugLogger.info('ScheduleService', 'assignments_filtering_completed', {
      attendantId,
      date,
      currentDayName,
      totalAssignments: assignments?.length || 0,
      filteredAssignments: filteredAssignments.length
    });

    endTimer('ScheduleService', 'getAssignmentsByAttendantAndDate_success', timerName, {
      attendantId,
      date,
      filteredAssignmentsCount: filteredAssignments.length
    });

    return filteredAssignments;
  }
};

const appointmentService = {
  async getAppointmentsByAttendantAndPeriod(attendantId, startDate, endDate) {
    const timerName = `getAppointmentsByAttendantAndPeriod_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('AppointmentService', 'getAppointmentsByAttendantAndPeriod_start', {
      attendantId,
      startDate,
      endDate,
      timestamp: new Date().toISOString()
    });

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*)
      `)
      .eq('attendant_id', attendantId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true })
      .order('appointment_datetime', { ascending: true });

    debugLogger.info('AppointmentService', 'appointments_query_result', {
      attendantId,
      startDate,
      endDate,
      success: !error,
      error: error?.message,
      appointmentsCount: appointments?.length || 0,
      appointments: appointments?.map(a => ({
        id: a.id,
        appointment_date: a.appointment_date,
        appointment_datetime: a.appointment_datetime,
        appointment_time: a.appointment_time,
        status: a.status
      }))
    });

    if (error) {
      debugLogger.error('AppointmentService', 'appointments_query_error', {
        attendantId,
        startDate,
        endDate,
        error: error.message
      });
      endTimer('AppointmentService', 'getAppointmentsByAttendantAndPeriod_error', timerName, { error: error.message });
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    endTimer('AppointmentService', 'getAppointmentsByAttendantAndPeriod_success', timerName, {
      attendantId,
      appointmentsCount: appointments?.length || 0
    });

    return appointments || [];
  }
};

// ============================================
// SERVIÇO DE DISPONIBILIDADE
// ============================================

const availabilityService = {
  async checkAvailability(attendantId, date, serviceId) {
    const timerName = `checkAvailability_${Date.now()}`;
    startTimer(timerName);
    
    debugLogger.info('AvailabilityService', 'checkAvailability_start', {
      attendantId,
      date,
      serviceId,
      timestamp: new Date().toISOString()
    });

    try {
      // Calcular dia da semana
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const jsDay = dateObj.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;

      debugLogger.debug('AvailabilityService', 'date_calculation', {
        originalDate: date,
        parsedValues: { year, month, day },
        dateObj: dateObj.toISOString(),
        jsDay,
        dayOfWeek
      });

      // Buscar atribuições
      const assignments = await scheduleAssignmentService.getAssignmentsByAttendantAndDate(attendantId, date);

      if (assignments.length === 0) {
        debugLogger.warn('AvailabilityService', 'no_assignments_found', {
          attendantId,
          date,
          dayOfWeek
        });

        const response = {
          success: true,
          available_slots: [],
          date,
          day_of_week: dayOfWeek,
          error: 'Nenhum horário configurado para esta data'
        };

        endTimer('AvailabilityService', 'checkAvailability_no_assignments', timerName, response);
        return response;
      }

      // Buscar agendamentos existentes
      const existingAppointments = await appointmentService.getAppointmentsByAttendantAndPeriod(attendantId, date, date);

      // Buscar duração do serviço
      let serviceDuration = 30;
      if (serviceId) {
        const { data: service } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single();
        
        if (service?.duration_minutes) {
          serviceDuration = service.duration_minutes;
        }
      }

      debugLogger.info('AvailabilityService', 'service_duration', {
        serviceId,
        serviceDuration
      });

      // Gerar slots disponíveis
      const availableSlots = [];
      const slotInterval = 30; // Intervalo de 30 minutos

      for (const assignment of assignments) {
        const startTime = assignment.start_time;
        const endTime = assignment.end_time;
        
        debugLogger.debug('AvailabilityService', 'processing_assignment', {
          assignmentId: assignment.id,
          startTime,
          endTime,
          serviceDuration
        });

        // Gerar slots de 30 em 30 minutos
        let currentTime = startTime;
        while (timeUtils.timeToMinutes(currentTime) + serviceDuration <= timeUtils.timeToMinutes(endTime)) {
          const slotStart = currentTime;
          const slotEnd = timeUtils.addMinutes(slotStart, serviceDuration);

          // Verificar conflitos com agendamentos existentes
          let hasConflict = false;
          for (const appointment of existingAppointments) {
            if (appointment.status === 'cancelled') continue;

            const appointmentStart = appointment.appointment_time;
            const appointmentEnd = timeUtils.addMinutes(appointmentStart, serviceDuration);

            if (timeUtils.timeToMinutes(slotStart) < timeUtils.timeToMinutes(appointmentEnd) &&
                timeUtils.timeToMinutes(slotEnd) > timeUtils.timeToMinutes(appointmentStart)) {
              hasConflict = true;
              debugLogger.debug('AvailabilityService', 'slot_conflict', {
                slotStart,
                slotEnd,
                appointmentStart,
                appointmentEnd,
                appointmentId: appointment.id
              });
              break;
            }
          }

          if (!hasConflict) {
            const availableSlot = {
              start_time: slotStart,
              end_time: slotEnd,
              duration_minutes: serviceDuration
            };

            debugLogger.debug('AvailabilityService', 'slot_available', availableSlot);
            availableSlots.push(availableSlot);
          }

          currentTime = timeUtils.addMinutes(currentTime, slotInterval);
        }
      }

      const response = {
        success: true,
        available_slots: availableSlots.sort((a, b) => 
          timeUtils.timeToMinutes(a.start_time) - timeUtils.timeToMinutes(b.start_time)
        ),
        date,
        day_of_week: dayOfWeek
      };

      debugLogger.info('AvailabilityService', 'checkAvailability_success', {
        totalSlotsFound: availableSlots.length,
        response
      });

      endTimer('AvailabilityService', 'checkAvailability_success', timerName, response);
      return response;

    } catch (error) {
      debugLogger.error('AvailabilityService', 'checkAvailability_error', {
        error: error.message,
        stack: error.stack,
        attendantId,
        date,
        serviceId
      });

      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const jsDay = dateObj.getDay();
      const errorDayOfWeek = jsDay === 0 ? 7 : jsDay;

      const errorResponse = {
        success: false,
        available_slots: [],
        date,
        day_of_week: errorDayOfWeek,
        error: error.message
      };

      endTimer('AvailabilityService', 'checkAvailability_error', timerName, errorResponse);
      return errorResponse;
    }
  }
};

// ============================================
// FUNÇÃO PRINCIPAL DE TESTE
// ============================================

async function testAvailabilityDebug() {
  try {
    console.log('🚀 INICIANDO TESTE DE DEBUG DE DISPONIBILIDADE\n');

    // Parâmetros de teste
    const testDate = '2025-01-20'; // Segunda-feira
    const attendantId = '1875a1f1-e3b9-4e7d-acba-946737e03e50'; // Jerime
    const serviceId = 'b8f7e6d5-c4b3-a291-8f7e-6d5c4b3a2918'; // Consulta Médica

    console.log(`📅 Data de teste: ${testDate}`);
    console.log(`👨‍⚕️ Atendente: ${attendantId}`);
    console.log(`🏥 Serviço: ${serviceId}\n`);

    // Executar teste de disponibilidade
    console.log('🔍 EXECUTANDO VERIFICAÇÃO DE DISPONIBILIDADE...\n');
    
    const availability = await availabilityService.checkAvailability(
      attendantId,
      testDate,
      serviceId
    );

    console.log('\n📊 RESULTADO FINAL:');
    console.log('='.repeat(50));
    console.log(`✅ Sucesso: ${availability.success}`);
    console.log(`📅 Data: ${availability.date}`);
    console.log(`📆 Dia da semana: ${availability.day_of_week}`);
    console.log(`🕐 Horários disponíveis: ${availability.available_slots.length}`);
    
    if (availability.available_slots.length > 0) {
      console.log('\n🕐 HORÁRIOS DISPONÍVEIS:');
      availability.available_slots.forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.start_time} - ${slot.end_time} (${slot.duration_minutes}min)`);
      });
    } else {
      console.log(`❌ Erro: ${availability.error || 'Nenhum horário disponível'}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 TESTE CONCLUÍDO');

  } catch (error) {
    console.error('💥 ERRO NO TESTE:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testAvailabilityDebug();