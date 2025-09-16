import { supabase } from '@/integrations/supabase/client';

export interface AppointmentData {
  id: string;
  patient_name: string;
  patient_phone: string;
  attendant_id: string;
  attendant_name: string;
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  appointment_date: string;
  appointment_time: string | null;
  appointment_datetime: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFilters {
  status?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

export const appointmentsService = {
  // Buscar todos os agendamentos
  async getAllAppointments(filters?: AppointmentFilters): Promise<AppointmentData[]> {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('appointment_datetime', { ascending: true });

    // Aplicar filtros
    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    if (filters?.searchTerm) {
      query = query.or(`patient_name.ilike.%${filters.searchTerm}%,patient_phone.ilike.%${filters.searchTerm}%,service_name.ilike.%${filters.searchTerm}%`);
    }

    if (filters?.startDate) {
      query = query.gte('appointment_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('appointment_date', filters.endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }

    return appointments || [];
  },

  // Buscar agendamento por ID
  async getAppointmentById(id: string): Promise<AppointmentData | null> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar agendamento:', error);
      throw new Error(`Erro ao buscar agendamento: ${error.message}`);
    }

    return appointment;
  },

  // Atualizar status do agendamento
  async updateAppointmentStatus(id: string, status: string): Promise<AppointmentData> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      throw new Error(`Erro ao atualizar status do agendamento: ${error.message}`);
    }

    return appointment;
  },

  // Contar agendamentos por status
  async getAppointmentCounts(): Promise<Record<string, number>> {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('status');

    if (error) {
      console.error('Erro ao contar agendamentos:', error);
      throw new Error(`Erro ao contar agendamentos: ${error.message}`);
    }

    const counts: Record<string, number> = {
      todos: appointments?.length || 0,
      scheduled: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };

    appointments?.forEach(appointment => {
      const status = appointment.status || 'scheduled';
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }
};