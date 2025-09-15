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
    try {
      const dayOfWeek = new Date(date).getDay();

      // Buscar atribuições de horário para o atendente na data
      const assignments = await scheduleAssignmentService.getAssignmentsByAttendantAndDate(
        attendantId,
        date
      );

      if (assignments.length === 0) {
        return {
          success: true,
          available_slots: [],
          date,
          day_of_week: dayOfWeek,
          error: 'Nenhum horário configurado para esta data'
        };
      }

      // Buscar agendamentos existentes para o atendente na data
      const existingAppointments = await appointmentService.getAppointmentsByAttendantAndPeriod(
        attendantId,
        date,
        date
      );

      // Buscar duração do serviço se especificado
      let serviceDuration = 30; // Padrão de 30 minutos
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

      // Gerar slots disponíveis
      const availableSlots: AvailableTimeSlot[] = [];

      for (const assignment of assignments) {
        // Filtrar por serviço se especificado
        if (serviceId && assignment.service_id !== serviceId) {
          continue;
        }

        const slots = timeUtils.generateTimeSlots(
          assignment.start_time,
          assignment.end_time,
          serviceDuration
        );

        for (const slotStart of slots) {
          const slotEnd = timeUtils.addMinutes(slotStart, serviceDuration);

          // Verificar se o slot não conflita com agendamentos existentes
          const hasConflict = existingAppointments.some(appointment => 
            appointment.status !== 'cancelled' &&
            timeUtils.intervalsOverlap(
              slotStart,
              slotEnd,
              appointment.start_time,
              appointment.end_time
            )
          );

          if (!hasConflict) {
            availableSlots.push({
              start_time: slotStart,
              end_time: slotEnd,
              duration_minutes: serviceDuration
            });
          }
        }
      }

      return {
        success: true,
        available_slots: availableSlots.sort((a, b) => 
          timeUtils.timeToMinutes(a.start_time) - timeUtils.timeToMinutes(b.start_time)
        ),
        date,
        day_of_week: dayOfWeek
      };

    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        success: false,
        available_slots: [],
        date,
        day_of_week: new Date(date).getDay(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
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

        calendar[dateStr] = {
          date: dateStr,
          day_of_week: currentDate.getDay(),
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
        .select('start_time, appointment_date')
        .eq('attendant_id', attendantId)
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
      }

      // Criar conjunto de horários já ocupados
      const occupiedTimes = new Set(
        appointments?.map(apt => `${apt.appointment_date}_${apt.start_time}`) || []
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