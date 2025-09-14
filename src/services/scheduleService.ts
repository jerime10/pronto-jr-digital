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
      .insert({
        ...data,
        is_available: data.is_available ?? true
      })
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
        service:services(*),
        schedule:schedules(*)
      `)
      .eq('schedule_id', scheduleId)
      .order('start_time', { ascending: true });

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
    const dayOfWeek = new Date(date).getDay();

    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        attendant:attendants(*),
        service:services(*),
        schedule:schedules!inner(*)
      `)
      .eq('attendant_id', attendantId)
      .eq('is_available', true)
      .or(`specific_date.eq.${date},and(specific_date.is.null,schedule.day_of_week.eq.${dayOfWeek})`)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar atribuições por data:', error);
      throw new Error(`Erro ao buscar atribuições: ${error.message}`);
    }

    return assignments || [];
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
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        attendant:attendants(*),
        service:services(*)
      `)
      .eq('attendant_id', attendantId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    return appointments || [];
  },

  // Listar agendamentos por data
  async getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        attendant:attendants(*),
        service:services(*)
      `)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

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
    return this.updateAppointment(id, {
      status: 'cancelled',
      notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
    });
  },

  // Confirmar agendamento
  async confirmAppointment(id: string): Promise<Appointment> {
    return this.updateAppointment(id, { status: 'confirmed' });
  },

  // Marcar como concluído
  async completeAppointment(id: string, notes?: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'completed',
      notes: notes || undefined
    });
  }
};
