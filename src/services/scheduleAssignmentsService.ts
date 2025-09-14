import { supabase } from '@/integrations/supabase/client';
import { ScheduleAssignments, ScheduleAssignmentsFormData } from '../types/database';

// ============================================
// GERENCIAMENTO DE ATRIBUIÇÕES DE HORÁRIOS
// ============================================

export const scheduleAssignmentsService = {
  // Criar nova atribuição de horário
  async createAssignment(data: ScheduleAssignmentsFormData): Promise<ScheduleAssignments> {
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atribuição de horário:', error);
      throw new Error(`Erro ao criar atribuição de horário: ${error.message}`);
    }

    return assignment;
  },

  // Criar múltiplas atribuições de horário
  async createMultipleAssignments(assignments: ScheduleAssignmentsFormData[]): Promise<ScheduleAssignments[]> {
    const { data: createdAssignments, error } = await supabase
      .from('schedule_assignments')
      .insert(assignments)
      .select();

    if (error) {
      console.error('Erro ao criar atribuições de horário:', error);
      throw new Error(`Erro ao criar atribuições de horário: ${error.message}`);
    }

    return createdAssignments;
  },

  // Listar todas as atribuições
  async getAllAssignments(): Promise<ScheduleAssignments[]> {
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atribuições:', error);
      throw new Error(`Erro ao buscar atribuições: ${error.message}`);
    }

    return assignments || [];
  },

  // Buscar atribuições por atendente
  async getAssignmentsByAttendant(attendantId: string): Promise<ScheduleAssignments[]> {
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select('*')
      .eq('attendant_id', attendantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atribuições do atendente:', error);
      throw new Error(`Erro ao buscar atribuições do atendente: ${error.message}`);
    }

    return assignments || [];
  },

  // Buscar atribuições por horário
  async getAssignmentsBySchedule(scheduleId: string): Promise<ScheduleAssignments[]> {
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atribuições do horário:', error);
      throw new Error(`Erro ao buscar atribuições do horário: ${error.message}`);
    }

    return assignments || [];
  },

  // Atualizar atribuição
  async updateAssignment(id: string, data: Partial<ScheduleAssignmentsFormData>): Promise<ScheduleAssignments> {
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
  },

  // Deletar múltiplas atribuições por atendente
  async deleteAssignmentsByAttendant(attendantId: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('attendant_id', attendantId);

    if (error) {
      console.error('Erro ao deletar atribuições do atendente:', error);
      throw new Error(`Erro ao deletar atribuições do atendente: ${error.message}`);
    }
  },

  // Deletar múltiplas atribuições por horário
  async deleteAssignmentsBySchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) {
      console.error('Erro ao deletar atribuições do horário:', error);
      throw new Error(`Erro ao deletar atribuições do horário: ${error.message}`);
    }
  }
};