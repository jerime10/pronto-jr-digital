import { supabase } from '@/integrations/supabase/client';
import {
  AvailableTimeSlot,
  AvailabilityResponse,
  AvailabilityCalendar,
  CalendarDay,
  TimeAvailabilityCheck,
  Service
} from '../types/database';
import { scheduleAssignmentService, appointmentService } from './scheduleService';
import { debugLogger, startTimer, endTimer } from '@/utils/debugLogger';

// ============================================
// UTILITÁRIOS DE TEMPO
// ============================================

const timeUtils = {
  // Converter string de tempo para minutos
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Converter minutos para string de tempo
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  // Adicionar minutos a um horário
  addMinutes(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  },

  // Verificar se um horário está dentro de um intervalo
  isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  },

  // Verificar se dois intervalos se sobrepõem
  intervalsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const start1Min = this.timeToMinutes(start1);
    const end1Min = this.timeToMinutes(end1);
    const start2Min = this.timeToMinutes(start2);
    const end2Min = this.timeToMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  },

  // Gerar slots de tempo em intervalos específicos
  generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = 30
  ): string[] {
    const slots: string[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    while (currentMinutes < endMinutes) {
      slots.push(this.minutesToTime(currentMinutes));
      currentMinutes += intervalMinutes;
    }

    return slots;
  }
};

// ============================================
// SERVIÇO DE DISPONIBILIDADE
// ============================================

export const availabilityService = {
  // Verificar disponibilidade para um atendente em uma data específica
  async checkAvailability(
    attendantId: string,
    date: string,
    serviceId?: string
  ): Promise<AvailabilityResponse> {
    const timerName = `checkAvailability_${Date.now()}`;
    startTimer(timerName);
    
    debugLogger.info('AvailabilityService', 'checkAvailability_start', {
      attendantId,
      date,
      serviceId,
      timestamp: new Date().toISOString(),
      requestId: timerName
    });

    // Log adicional para detectar múltiplas chamadas simultâneas
    debugLogger.debug('AvailabilityService', 'request_details', {
      requestId: timerName,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
      currentTime: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(0, 5)
    });

    try {
      // Validar parâmetros obrigatórios
      if (!attendantId || !date) {
        throw new Error('Parâmetros obrigatórios não fornecidos: attendantId e date são necessários');
      }

      // Validar formato da data
      if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error(`Formato de data inválido: ${date}. Esperado: YYYY-MM-DD`);
      }

      // Calcular dia da semana evitando problemas de fuso horário
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const jsDay = dateObj.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay; // Converter domingo de 0 para 7

      debugLogger.debug('AvailabilityService', 'date_calculation', {
        originalDate: date,
        parsedValues: { year, month, day },
        dateObj: dateObj.toISOString(),
        jsDay,
        dayOfWeek
      });

      // Buscar atribuições de horário para o atendente na data
      debugLogger.info('AvailabilityService', 'fetching_assignments', {
        attendantId,
        date
      });

      const assignments = await scheduleAssignmentService.getAssignmentsByAttendantAndDate(
        attendantId,
        date
      );

      debugLogger.info('AvailabilityService', 'assignments_received', {
        assignmentsCount: assignments.length,
        assignments: assignments.map(a => ({
          id: a.id,
          schedule_id: a.schedule_id,
          attendant_id: a.attendant_id,
          attendant_name: (a as any).attendant_name,
          schedule_info: a.schedule_info,
          schedule: (a as any).schedule ? {
            id: (a as any).schedule.id,
            start_time: (a as any).schedule.start_time,
            duration: (a as any).schedule.duration,
            day: (a as any).schedule.day,
            days: (a as any).schedule.days,
            is_active: (a as any).schedule.is_active
          } : null
        }))
      });

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

      // Buscar agendamentos existentes para o atendente na data
      debugLogger.info('AvailabilityService', 'fetching_existing_appointments', {
        attendantId,
        date
      });

      const existingAppointments = await appointmentService.getAppointmentsByAttendantAndPeriod(
        attendantId,
        date,
        date
      );

      debugLogger.info('AvailabilityService', 'existing_appointments_received', {
        appointmentsCount: existingAppointments.length,
        appointments: existingAppointments.map(apt => ({
          id: apt.id,
          appointment_datetime: apt.appointment_datetime,
          service_duration: apt.service_duration,
          status: apt.status
        }))
      });

      // Buscar duração do serviço se especificado
      let serviceDuration = 30; // Padrão de 30 minutos
      if (serviceId) {
        debugLogger.info('AvailabilityService', 'fetching_service_duration', {
          serviceId
        });

        const { data: service } = await supabase
          .from('services')
          .select('duration')
          .eq('id', serviceId)
          .single();
        
        if (service?.duration) {
          serviceDuration = service.duration;
        }

        debugLogger.debug('AvailabilityService', 'service_duration_resolved', {
          serviceId,
          serviceDuration,
          serviceData: service
        });
      }

      // Gerar slots disponíveis
      debugLogger.info('AvailabilityService', 'generating_slots_start', {
        assignmentsCount: assignments.length,
        serviceDuration
      });

      const availableSlots: AvailableTimeSlot[] = [];

      for (const assignment of assignments) {
        debugLogger.debug('AvailabilityService', 'processing_assignment', {
          assignmentId: assignment.id,
          scheduleId: assignment.schedule_id,
          attendantId: assignment.attendant_id,
          attendantName: (assignment as any).attendant_name
        });

        // Usar horários da tabela schedules através do JOIN
        const schedule = (assignment as any).schedule;
        if (!schedule || !schedule.start_time || !schedule.duration) {
          debugLogger.warn('AvailabilityService', 'schedule_without_required_data', {
            assignmentId: assignment.id,
            scheduleId: assignment.schedule_id,
            hasSchedule: !!schedule,
            hasStartTime: schedule?.start_time,
            hasDuration: schedule?.duration
          });
          continue;
        }

        debugLogger.debug('AvailabilityService', 'schedule_data', {
          scheduleId: schedule.id,
          startTime: schedule.start_time,
          duration: schedule.duration,
          day: schedule.day,
          days: schedule.days,
          isActive: schedule.is_active
        });

        // Usar apenas o horário exato do schedule, não gerar slots por intervalos
        const startTime = schedule.start_time;
        
        debugLogger.debug('AvailabilityService', 'using_exact_schedule_time', {
          scheduleId: schedule.id,
          exactStartTime: startTime,
          scheduleDuration: schedule.duration,
          serviceDuration
        });

        // Verificar se o serviço cabe no tempo disponível do schedule
        if (serviceDuration > schedule.duration) {
          debugLogger.warn('AvailabilityService', 'service_too_long_for_schedule', {
            scheduleId: schedule.id,
            scheduleStartTime: startTime,
            scheduleDuration: schedule.duration,
            serviceDuration,
            message: 'Serviço requer mais tempo que o disponível no schedule'
          });
          continue; // Pular este schedule se o serviço não cabe
        }

        // Usar apenas o horário exato do schedule como slot disponível
        const slots = [startTime];

        debugLogger.debug('AvailabilityService', 'exact_time_slot_used', {
          scheduleId: schedule.id,
          slots,
          slotsCount: slots.length
        });

        for (const slotStart of slots) {
          const slotEnd = timeUtils.addMinutes(slotStart, serviceDuration);

          debugLogger.debug('AvailabilityService', 'checking_slot_conflict', {
            slotStart,
            slotEnd,
            existingAppointmentsCount: existingAppointments.length
          });

          // Verificar se o slot não conflita com agendamentos existentes
          // Apenas agendamentos ativos (não cancelados, não finalizados) bloqueiam o horário
          const hasConflict = existingAppointments.some(appointment => {
            const activeStatuses = ['scheduled', 'confirmed', 'atendimento_iniciado'];
            
            if (!activeStatuses.includes(appointment.status)) {
              return false;
            }

            // Extrair horário do appointment_datetime sem conversão de timezone
            // Isso evita problemas com UTC vs horário local
            let appointmentTime: string;
            if (appointment.appointment_datetime.includes('T')) {
              // Formato ISO: "2025-01-21T08:00:00"
              appointmentTime = appointment.appointment_datetime.split('T')[1].slice(0, 5);
            } else if (appointment.appointment_datetime.includes(' ')) {
              // Formato com espaço: "2025-01-21 08:00:00"
              appointmentTime = appointment.appointment_datetime.split(' ')[1].slice(0, 5);
            } else {
              // Fallback para outros formatos
              appointmentTime = appointment.appointment_datetime.slice(-8, -3);
            }
            const appointmentDuration = appointment.service_duration || 30;
            const appointmentEndTime = timeUtils.addMinutes(appointmentTime, appointmentDuration);

            const conflict = timeUtils.intervalsOverlap(
              slotStart,
              slotEnd,
              appointmentTime,
              appointmentEndTime
            );

            if (conflict) {
              debugLogger.debug('AvailabilityService', 'slot_conflict_found', {
                slotStart,
                slotEnd,
                appointmentId: appointment.id,
                appointmentTime,
                appointmentEndTime,
                appointmentDuration
              });
            }

            return conflict;
          });

          if (!hasConflict) {
            const availableSlot = {
              start_time: slotStart,
              end_time: slotEnd,
              duration_minutes: serviceDuration
            };

            debugLogger.debug('AvailabilityService', 'slot_available', availableSlot);
            availableSlots.push(availableSlot);
          }
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
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        attendantId,
        date,
        serviceId
      });

      console.error('Erro ao verificar disponibilidade:', error);
      // Calcular dia da semana para o erro também (com validação)
      let errorDayOfWeek = 1; // Default para segunda-feira
      try {
        if (date && typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          const jsDay = dateObj.getDay();
          errorDayOfWeek = jsDay === 0 ? 7 : jsDay;
        }
      } catch (dateError) {
        debugLogger.warn('AvailabilityService', 'error_date_calculation_failed', { date, dateError });
      }

      const errorResponse = {
        success: false,
        available_slots: [],
        date,
        day_of_week: errorDayOfWeek,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };

      endTimer('AvailabilityService', 'checkAvailability_error', timerName, errorResponse);
      return errorResponse;
    }
  },

  // Gerar calendário de disponibilidade para um período
  async getAvailabilityCalendar(
    attendantId: string,
    startDate: string,
    endDate: string,
    serviceId?: string
  ): Promise<AvailabilityCalendar> {
    try {
      const calendar: Record<string, CalendarDay> = {};
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const availability = await this.checkAvailability(attendantId, dateStr, serviceId);

        // Calcular dia da semana corretamente
        const jsDay = currentDate.getDay();
        const dayOfWeek = jsDay === 0 ? 7 : jsDay;

        calendar[dateStr] = {
          date: dateStr,
          day_of_week: dayOfWeek,
          is_available: availability.available_slots.length > 0,
          total_slots: availability.available_slots.length,
          slots: availability.available_slots
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        success: true,
        calendar,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      };

    } catch (error) {
      console.error('Erro ao gerar calendário:', error);
      return {
        success: false,
        calendar: {},
        period: {
          start_date: startDate,
          end_date: endDate
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  // Verificar se um horário específico está disponível
  async checkTimeAvailability(
    attendantId: string,
    date: string,
    startTime: string,
    serviceId?: string
  ): Promise<TimeAvailabilityCheck> {
    try {
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

      const endTime = timeUtils.addMinutes(startTime, serviceDuration);

      // Verificar disponibilidade geral
      const availability = await this.checkAvailability(attendantId, date, serviceId);

      // Verificar se o horário solicitado está nos slots disponíveis
      const isAvailable = availability.available_slots.some(slot => 
        slot.start_time === startTime
      );

      // Se não estiver disponível, sugerir alternativas próximas
      const alternativeSlots = isAvailable ? [] : availability.available_slots
        .filter(slot => {
          const slotMinutes = timeUtils.timeToMinutes(slot.start_time);
          const requestedMinutes = timeUtils.timeToMinutes(startTime);
          const diff = Math.abs(slotMinutes - requestedMinutes);
          return diff <= 120; // Alternativas dentro de 2 horas
        })
        .slice(0, 5); // Máximo 5 alternativas

      return {
        success: true,
        is_available: isAvailable,
        requested_time: startTime,
        service_duration: serviceDuration,
        alternative_slots: alternativeSlots
      };

    } catch (error) {
      console.error('Erro ao verificar horário específico:', error);
      return {
        success: false,
        is_available: false,
        requested_time: startTime,
        service_duration: 30,
        alternative_slots: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  // Buscar próximos horários disponíveis
  async getNextAvailableSlots(
    attendantId: string,
    fromDate: string,
    serviceId?: string,
    limit: number = 10
  ): Promise<AvailableTimeSlot[]> {
    try {
      const slots: AvailableTimeSlot[] = [];
      const currentDate = new Date(fromDate);
      const maxDate = new Date(fromDate);
      maxDate.setDate(maxDate.getDate() + 30); // Buscar até 30 dias à frente

      while (slots.length < limit && currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const availability = await this.checkAvailability(attendantId, dateStr, serviceId);

        for (const slot of availability.available_slots) {
          if (slots.length >= limit) break;
          slots.push({
            ...slot,
            start_time: `${dateStr} ${slot.start_time}`,
            end_time: `${dateStr} ${slot.end_time}`
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return slots;

    } catch (error) {
      console.error('Erro ao buscar próximos horários:', error);
      return [];
    }
  },

  /**
   * Busca horários disponíveis para um atendente específico
   * Retorna apenas os horários cadastrados de seg a sex que não foram atribuídos
   */
  async getAvailableTimes(attendantId: string): Promise<any[]> {
    try {
      // Buscar horários cadastrados para o atendente (seg a sex = 1-5)
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('attendant_id', attendantId)
        .eq('is_active', true)
        .gte('day_of_week', 1) // Segunda-feira
        .lte('day_of_week', 5) // Sexta-feira
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (schedulesError) {
        console.error('Erro ao buscar horários:', schedulesError);
        return [];
      }

      if (!schedules || schedules.length === 0) {
        console.log('Nenhum horário cadastrado para este atendente');
        return [];
      }

      // Buscar horários já atribuídos (appointments) para filtrar
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_datetime, appointment_date')
        .eq('attendant_id', attendantId)
        .in('status', ['scheduled', 'confirmed', 'atendimento_iniciado']);

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
      }

      // Criar conjunto de horários já ocupados
      const occupiedTimes = new Set(
        appointments?.map(apt => {
          // Extrair o horário do appointment_datetime
          const appointmentTime = new Date(apt.appointment_datetime).toTimeString().slice(0, 5);
          return `${apt.appointment_date}_${appointmentTime}`;
        }) || []
      );

      // Processar horários disponíveis
      const availableTimes = schedules.map(schedule => {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const timeKey = `${new Date().toISOString().split('T')[0]}_${schedule.start_time}`;
        
        return {
          id: schedule.id,
          time: schedule.start_time,
          duration: 30, // Duração padrão de 30 minutos
          day_of_week: schedule.day_of_week,
          day_name: dayNames[schedule.day_of_week],
          end_time: schedule.end_time,
          is_occupied: occupiedTimes.has(timeKey)
        };
      }).filter(time => !time.is_occupied); // Filtrar apenas horários não ocupados

      console.log('Horários disponíveis encontrados:', availableTimes);
      return availableTimes;

    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  }
};

/**
 * Hook para usar o serviço de disponibilidade
 */
export function useAvailabilityService() {
  return availabilityService;
}

// Exportar utilitários de tempo para uso em outros módulos
export { timeUtils };