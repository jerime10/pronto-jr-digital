import { supabase } from '@/integrations/supabase/client';

export interface PatientData {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
}

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
  dum?: string | null; // Data da Última Menstruação para serviços obstétricos
  gestational_age?: string | null; // Idade gestacional
  estimated_due_date?: string | null; // Data provável do parto
  patient_id?: string | null; // Nova coluna adicionada
  end_time?: string | null; // Nova coluna adicionada
  partner_username?: string | null; // Nome do usuário parceiro
  partner_code?: string | null; // Código do parceiro
  created_at: string;
  updated_at: string;
  patient?: PatientData | null; // Dados completos do paciente via join
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
    console.log('🔍 getAllAppointments chamado com filtros:', filters);
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          name,
          sus,
          phone,
          address,
          date_of_birth,
          age,
          gender,
          created_at,
          updated_at
        )
      `)
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

    // Mapear os dados para incluir o paciente corretamente
    const mappedAppointments = appointments?.map(appointment => ({
      ...appointment,
      patient: appointment.patients || null
    })) || [];
    
    return mappedAppointments;
  },

  // Buscar agendamento por ID
  async getAppointmentById(id: string): Promise<AppointmentData | null> {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          name,
          sus,
          phone,
          address,
          date_of_birth,
          age,
          gender,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar agendamento:', error);
      throw new Error(`Erro ao buscar agendamento: ${error.message}`);
    }

    // Mapear os dados para incluir o paciente corretamente
    const mappedAppointment = appointment ? {
      ...appointment,
      patient: appointment.patients || null
    } : null;
    return mappedAppointment;
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

  // Excluir agendamento permanentemente
  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir agendamento:', error);
      throw new Error(`Erro ao excluir agendamento: ${error.message}`);
    }
  },

  // Criar novo agendamento via edge function (mais robusto)
  async createAppointment(appointmentData: Partial<AppointmentData>): Promise<{ success: boolean; data?: AppointmentData; error?: string }> {
    try {
      console.log('📅 [appointmentsService] Criando agendamento via edge function:', JSON.stringify(appointmentData, null, 2));

      // Usar edge function para criar o agendamento (melhor timeout e performance)
      const { data, error } = await supabase.functions.invoke('create-appointment', {
        body: appointmentData
      });

      if (error) {
        console.error('❌ [appointmentsService] Erro ao chamar edge function:', error);
        return { success: false, error: `Erro ao salvar: ${error.message}` };
      }

      if (!data.success) {
        console.error('❌ [appointmentsService] Edge function retornou erro:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ [appointmentsService] Agendamento criado com sucesso:', data.data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('❌ [appointmentsService] Erro inesperado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: `Erro inesperado: ${errorMessage}` };
    }
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
      atendimento_iniciado: 0,
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