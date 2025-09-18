import { supabase } from '@/integrations/supabase/client';
import {
  Schedule,
  ScheduleAssignment,
  Appointment,
  ScheduleFormData,
  ScheduleAssignmentFormData,
  AppointmentFormData,
  AvailableTimeSlot,
  AvailabilityResponse,
  AvailabilityCalendar,
  CalendarDay,
  TimeAvailabilityCheck,
  AppointmentWithDetails,
  ScheduleWithAssignments,
  ScheduleAssignmentWithDetails
} from '../types/database';
import { debugLogger, startTimer, endTimer } from '@/utils/debugLogger';

// ============================================
// GERENCIAMENTO DE HORÁRIOS (SCHEDULES)
// ============================================

export const scheduleService = {
  // Criar novo horário
  async createSchedule(data: ScheduleFormData): Promise<Schedule> {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        ...data,
        available: data.available ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar horário:', error);
      throw new Error(`Erro ao criar horário: ${error.message}`);
    }

    return schedule;
  },

  // Listar todos os horários
  async getAllSchedules(): Promise<Schedule[]> {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('day', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar horários:', error);
      throw new Error(`Erro ao buscar horários: ${error.message}`);
    }

    return schedules || [];
  },

  // Listar horários por dia da semana
  async getSchedulesByDay(day: string): Promise<Schedule[]> {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('day', day)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar horários:', error);
      throw new Error(`Erro ao buscar horários: ${error.message}`);
    }

    return schedules || [];
  },

  // Atualizar horário
  async updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<Schedule> {
    // DEBUG: Log dos dados recebidos no serviço
    console.log('🔍 DEBUG - scheduleService.updateSchedule recebeu:', { id, data });
    
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    // DEBUG: Log do resultado da atualização
    console.log('🔍 DEBUG - Resultado da atualização:', { schedule, error });

    if (error) {
      console.error('Erro ao atualizar horário:', error);
      throw new Error(`Erro ao atualizar horário: ${error.message}`);
    }

    return schedule;
  },

  // Deletar horário
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar horário:', error);
      throw new Error(`Erro ao deletar horário: ${error.message}`);
    }
  },

  // Ativar/Desativar horário
  async toggleScheduleStatus(id: string, isActive: boolean): Promise<Schedule> {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({ available: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status do horário:', error);
      throw new Error(`Erro ao alterar status do horário: ${error.message}`);
    }

    return schedule;
  }
};

// ============================================
// GERENCIAMENTO DE ATRIBUIÇÕES (SCHEDULE_ASSIGNMENTS)
// ============================================

export const scheduleAssignmentService = {
  // Criar nova atribuição
  async createAssignment(data: ScheduleAssignmentFormData): Promise<ScheduleAssignment> {
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atribuição:', error);
      throw new Error(`Erro ao criar atribuição: ${error.message}`);
    }

    return assignment;
  },

  // Listar atribuições por horário
  async getAssignmentsBySchedule(scheduleId: string): Promise<ScheduleAssignmentWithDetails[]> {
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        schedule:schedules(*)
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar atribuições:', error);
      throw new Error(`Erro ao buscar atribuições: ${error.message}`);
    }

    return assignments || [];
  },

  // Listar atribuições por atendente e data
  async getAssignmentsByAttendantAndDate(
    attendantId: string,
    date: string
  ): Promise<ScheduleAssignmentWithDetails[]> {
    const timerName = `getAssignmentsByAttendantAndDate_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('ScheduleService', 'getAssignmentsByAttendantAndDate_start', {
      attendantId,
      date,
      timestamp: new Date().toISOString()
    });

    // Calcular dia da semana evitando problemas de fuso horário
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // Converter domingo de 0 para 7

    debugLogger.debug('ScheduleService', 'date_calculation', {
      attendantId,
      date,
      parsedDate: { year, month, day },
      dateObj: dateObj.toISOString(),
      jsDay,
      dayOfWeek
    });

    // Mapeamento de números para nomes dos dias
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDayName = dayNames[jsDay]; // Usar jsDay original (0-6)

    debugLogger.info('ScheduleService', 'day_mapping', {
      attendantId,
      date,
      jsDay,
      currentDayName,
      dayNames
    });

    // Buscar atribuições com JOIN para filtrar pelo dia da semana
    debugLogger.debug('ScheduleService', 'querying_schedule_assignments', {
      attendantId,
      date,
      currentDayName,
      query: {
        table: 'schedule_assignments',
        select: 'attendant, schedule relations',
        filters: {
          attendant_id: attendantId
        }
      }
    });

    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        schedule:schedules(*)
      `)
      .eq('attendant_id', attendantId)
      .order('created_at', { ascending: true });

    debugLogger.info('ScheduleService', 'schedule_assignments_query_result', {
      attendantId,
      date,
      success: !error,
      error: error?.message,
      assignmentsCount: assignments?.length || 0,
      rawAssignments: assignments?.map(a => ({
        id: a.id,
        schedule_id: a.schedule_id,
        attendant_id: a.attendant_id,
        attendant_name: a.attendant_name,
        schedule_info: a.schedule_info,
        schedule: (a as any).schedule ? {
          id: (a as any).schedule.id,
          day: (a as any).schedule.day,
          days: (a as any).schedule.days,
          start_time: (a as any).schedule.start_time,
          duration: (a as any).schedule.duration,
          is_active: (a as any).schedule.is_active
        } : null
      }))
    });

    if (error) {
      debugLogger.error('ScheduleService', 'schedule_assignments_query_error', {
        attendantId,
        date,
        error: error.message,
        stack: error.stack
      });

      endTimer('ScheduleService', 'getAssignmentsByAttendantAndDate_error', timerName, { error: error.message });
      throw new Error(`Erro ao buscar atribuições: ${error.message}`);
    }

    // Filtrar apenas atribuições que correspondem ao dia da semana
    debugLogger.debug('ScheduleService', 'filtering_assignments_by_day', {
      attendantId,
      date,
      currentDayName,
      totalAssignments: assignments?.length || 0
    });

    const filteredAssignments = assignments?.filter(assignment => {
      debugLogger.debug('ScheduleService', 'filtering_assignment', {
        assignmentId: assignment.id,
        schedule: (assignment as any).schedule
      });

      // Verificar se o schedule corresponde ao dia da semana
      const schedule = (assignment as any).schedule;
      if (schedule && schedule.is_active) {
        debugLogger.debug('ScheduleService', 'checking_schedule_days', {
          assignmentId: assignment.id,
          scheduleId: schedule.id,
          scheduleDays: schedule.days,
          scheduleDay: schedule.day,
          currentDayName,
          isActive: schedule.is_active
        });

        // Verificar se o dia atual está no array 'days' do schedule
        if (schedule.days && Array.isArray(schedule.days)) {
          const matches = schedule.days.includes(currentDayName);
          debugLogger.debug('ScheduleService', 'days_array_match', {
            assignmentId: assignment.id,
            scheduleDays: schedule.days,
            currentDayName,
            matches
          });
          return matches;
        }
        // Fallback: verificar o campo 'day' individual
        if (schedule.day) {
          const matches = schedule.day === currentDayName;
          debugLogger.debug('ScheduleService', 'single_day_match', {
            assignmentId: assignment.id,
            scheduleDay: schedule.day,
            currentDayName,
            matches
          });
          return matches;
        }
      }
      
      debugLogger.debug('ScheduleService', 'assignment_filtered_out', {
        assignmentId: assignment.id,
        reason: 'no_matching_schedule_or_inactive'
      });
      return false;
    }) || [];

    debugLogger.info('ScheduleService', 'assignments_filtering_completed', {
      attendantId,
      date,
      currentDayName,
      totalAssignments: assignments?.length || 0,
      filteredAssignments: filteredAssignments.length,
      filteredData: filteredAssignments.map(a => ({
        id: a.id,
        schedule_id: a.schedule_id,
        attendant_id: a.attendant_id,
        attendant_name: a.attendant_name,
        schedule_info: a.schedule_info,
        start_time: a.start_time,
        end_time: a.end_time,
        specific_date: a.specific_date,
        schedule: (a as any).schedule ? {
          id: (a as any).schedule.id,
          day: (a as any).schedule.day,
          days: (a as any).schedule.days,
          start_time: (a as any).schedule.start_time,
          duration: (a as any).schedule.duration
        } : null
      }))
    });

    endTimer('ScheduleService', 'getAssignmentsByAttendantAndDate_success', timerName, {
      attendantId,
      date,
      filteredAssignmentsCount: filteredAssignments.length
    });

    return filteredAssignments;
  },

  // Atualizar atribuição
  async updateAssignment(id: string, data: Partial<ScheduleAssignmentFormData>): Promise<ScheduleAssignment> {
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar atribuição:', error);
      throw new Error(`Erro ao atualizar atribuição: ${error.message}`);
    }

    return assignment;
  },

  // Deletar atribuição
  async deleteAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar atribuição:', error);
      throw new Error(`Erro ao deletar atribuição: ${error.message}`);
    }
  }
};

// ============================================
// GERENCIAMENTO DE AGENDAMENTOS (APPOINTMENTS)
// ============================================

export const appointmentService = {
  // Criar novo agendamento
  async createAppointment(data: AppointmentFormData): Promise<Appointment> {
    // Validar se o horário está disponível antes de criar o agendamento
    if (data.attendant_id && data.appointment_date && data.appointment_datetime) {
      // Verificar se já existe um agendamento ativo no mesmo horário
      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('attendant_id', data.attendant_id)
        .eq('appointment_date', data.appointment_date)
        .eq('appointment_datetime', data.appointment_datetime)
        .in('status', ['scheduled', 'confirmed', 'atendimento_iniciado']);

      if (checkError) {
        console.error('Erro ao verificar agendamentos existentes:', checkError);
        throw new Error(`Erro ao verificar disponibilidade: ${checkError.message}`);
      }

      if (existingAppointments && existingAppointments.length > 0) {
        throw new Error('Já existe um agendamento ativo neste horário. Escolha outro horário.');
      }

      // Importar o availabilityService dinamicamente para evitar dependência circular
      const { availabilityService } = await import('./availabilityService');
      
      const timeCheck = await availabilityService.checkTimeAvailability(
        data.attendant_id,
        data.appointment_date,
        data.appointment_time,
        data.service_id
      );

      if (!timeCheck.is_available) {
        const errorMessage = timeCheck.alternative_slots.length > 0
          ? `Horário não disponível. Horários alternativos: ${timeCheck.alternative_slots.map(slot => slot.start_time).join(', ')}`
          : 'Horário não disponível. Nenhum horário alternativo encontrado.';
        
        throw new Error(errorMessage);
      }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        ...data,
        status: data.status ?? 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }

    return appointment;
  },

  // Listar agendamentos por atendente e período
  async getAppointmentsByAttendantAndPeriod(
    attendantId: string,
    startDate: string,
    endDate: string
  ): Promise<AppointmentWithDetails[]> {
    const timerName = `getAppointmentsByAttendantAndPeriod_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('AppointmentService', 'getAppointmentsByAttendantAndPeriod_start', {
      attendantId,
      startDate,
      endDate,
      timestamp: new Date().toISOString()
    });

    debugLogger.debug('AppointmentService', 'querying_appointments', {
      attendantId,
      startDate,
      endDate,
      query: {
        table: 'appointments',
        select: 'patient, attendant, service relations',
        filters: {
          attendant_id: attendantId,
          appointment_date_gte: startDate,
          appointment_date_lte: endDate
        },
        orderBy: ['appointment_date asc', 'appointment_datetime asc']
      }
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
        status: a.status,
        service_id: a.service_id
      }))
    });

    if (error) {
      debugLogger.error('AppointmentService', 'appointments_query_error', {
        attendantId,
        startDate,
        endDate,
        error: error.message,
        stack: error.stack
      });

      endTimer('AppointmentService', 'getAppointmentsByAttendantAndPeriod_error', timerName, { error: error.message });
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    debugLogger.info('AppointmentService', 'getAppointmentsByAttendantAndPeriod_success', {
      attendantId,
      startDate,
      endDate,
      appointmentsCount: appointments?.length || 0
    });

    endTimer('AppointmentService', 'getAppointmentsByAttendantAndPeriod_success', timerName, {
      attendantId,
      appointmentsCount: appointments?.length || 0
    });

    return appointments || [];
  },

  // Listar agendamentos por data
  async getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*)
      `)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .order('appointment_datetime', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos por data:', error);
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    return appointments || [];
  },

  // Atualizar agendamento
  async updateAppointment(id: string, data: Partial<AppointmentFormData>): Promise<Appointment> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
    }

    return appointment;
  },

  // Cancelar agendamento
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.updateAppointment(id, {
      status: 'cancelled',
      notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
    });

    // Liberar o horário quando o agendamento for cancelado
    await this.releaseTimeSlot(appointment);
    
    return appointment;
  },

  // Confirmar agendamento
  async confirmAppointment(id: string): Promise<Appointment> {
    return this.updateAppointment(id, { status: 'confirmed' });
  },

  // Marcar como concluído
  async completeAppointment(id: string, notes?: string): Promise<Appointment> {
    const appointment = await this.updateAppointment(id, {
      status: 'completed',
      notes: notes || undefined
    });

    // Liberar o horário quando o agendamento for finalizado
    await this.releaseTimeSlot(appointment);
    
    return appointment;
  },

  // Função auxiliar para liberar horários
  async releaseTimeSlot(appointment: Appointment): Promise<void> {
    try {
      // Buscar o schedule_assignment correspondente ao agendamento
      const appointmentDate = new Date(appointment.appointment_date);
      const dayOfWeek = this.getDayOfWeekName(appointmentDate);
      
      const { data: scheduleAssignments, error } = await supabase
        .from('schedule_assignments')
        .select(`
          id,
          schedule_id,
          schedules!inner(
            id,
            day,
            days,
            start_time,
            duration,
            available
          )
        `)
        .eq('attendant_id', appointment.attendant_id);
        
      // Extrair horário do appointment_datetime para comparação
      const appointmentTime = new Date(appointment.appointment_datetime).toTimeString().slice(0, 5);

      if (error) {
        console.error('Erro ao buscar schedule assignment para liberação:', error);
        return;
      }

      if (scheduleAssignments && scheduleAssignments.length > 0) {
        // Filtrar pelo dia da semana e horário corretos
        const correctAssignment = scheduleAssignments.find(assignment => {
          const schedule = assignment.schedules;
          return schedule.days && schedule.days.includes(dayOfWeek) && 
                 schedule.start_time === appointmentTime;
        });

        if (correctAssignment) {
          // Marcar o schedule como disponível novamente
          const { error: updateError } = await supabase
            .from('schedules')
            .update({ available: true })
            .eq('id', correctAssignment.schedule_id);

          if (updateError) {
            console.error('Erro ao liberar horário:', updateError);
          } else {
            const appointmentTime = new Date(appointment.appointment_datetime).toTimeString().slice(0, 5);
            console.log(`Horário ${appointmentTime} liberado com sucesso`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao liberar horário:', error);
    }
  },

  // Função auxiliar para obter nome do dia da semana
  getDayOfWeekName(date: Date): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  }
};
