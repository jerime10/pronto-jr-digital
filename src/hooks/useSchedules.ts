import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  scheduleService,
  scheduleAssignmentService,
  appointmentService
} from '@/services/scheduleService';
import {
  Schedule,
  ScheduleAssignment,
  Appointment,
  ScheduleFormData,
  ScheduleAssignmentFormData,
  AppointmentFormData,
  ScheduleWithAssignments,
  ScheduleAssignmentWithDetails,
  AppointmentWithDetails
} from '@/types/database';

// ============================================
// HOOK PARA GERENCIAMENTO DE HORÁRIOS
// ============================================

export function useSchedules(attendantId?: string) {
  const queryClient = useQueryClient();

  // Buscar todos os horários
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleService.getAllSchedules(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Criar novo horário
  const createSchedule = useMutation({
    mutationFn: (data: ScheduleFormData) => scheduleService.createSchedule(data),
    onSuccess: () => {
      toast.success('Horário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar horário:', error);
      toast.error(`Erro ao criar horário: ${error.message}`);
    },
  });

  // Atualizar horário
  const updateSchedule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleFormData> }) => 
      scheduleService.updateSchedule(id, data),
    onSuccess: () => {
      toast.success('Horário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar horário:', error);
      toast.error(`Erro ao atualizar horário: ${error.message}`);
    },
  });

  // Deletar horário
  const deleteSchedule = useMutation({
    mutationFn: (id: string) => scheduleService.deleteSchedule(id),
    onSuccess: () => {
      toast.success('Horário excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir horário:', error);
      toast.error(`Erro ao excluir horário: ${error.message}`);
    },
  });

  // Ativar/Desativar horário
  const toggleScheduleStatus = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => 
      scheduleService.toggleScheduleStatus(id, available),
    onSuccess: (_, { available }) => {
      toast.success(`Horário ${available ? 'ativado' : 'desativado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status do horário:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
    isToggling: toggleScheduleStatus.isPending,
  };
}

// ============================================
// HOOK PARA GERENCIAMENTO DE ATRIBUIÇÕES
// ============================================

export function useScheduleAssignments(scheduleId?: string) {
  const queryClient = useQueryClient();

  // Buscar atribuições por horário
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['schedule-assignments', scheduleId],
    queryFn: () => scheduleId ? scheduleAssignmentService.getAssignmentsBySchedule(scheduleId) : Promise.resolve([]),
    enabled: !!scheduleId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Criar nova atribuição
  const createAssignment = useMutation({
    mutationFn: (data: ScheduleAssignmentFormData) => scheduleAssignmentService.createAssignment(data),
    onSuccess: () => {
      toast.success('Atribuição criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedule-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar atribuição:', error);
      toast.error(`Erro ao criar atribuição: ${error.message}`);
    },
  });

  // Atualizar atribuição
  const updateAssignment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleAssignmentFormData> }) => 
      scheduleAssignmentService.updateAssignment(id, data),
    onSuccess: () => {
      toast.success('Atribuição atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedule-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar atribuição:', error);
      toast.error(`Erro ao atualizar atribuição: ${error.message}`);
    },
  });

  // Deletar atribuição
  const deleteAssignment = useMutation({
    mutationFn: (id: string) => scheduleAssignmentService.deleteAssignment(id),
    onSuccess: () => {
      toast.success('Atribuição excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['schedule-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir atribuição:', error);
      toast.error(`Erro ao excluir atribuição: ${error.message}`);
    },
  });

  return {
    assignments: assignments || [],
    isLoading,
    error,
    createAssignment: createAssignment.mutate,
    updateAssignment: updateAssignment.mutate,
    deleteAssignment: deleteAssignment.mutate,
    isCreating: createAssignment.isPending,
    isUpdating: updateAssignment.isPending,
    isDeleting: deleteAssignment.isPending,
  };
}

// ============================================
// HOOK PARA ATRIBUIÇÕES POR ATENDENTE E DATA
// ============================================

export function useScheduleAssignmentsByDate(attendantId?: string, date?: string) {
  return useQuery({
    queryKey: ['schedule-assignments-by-date', attendantId, date],
    queryFn: () => 
      attendantId && date 
        ? scheduleAssignmentService.getAssignmentsByAttendantAndDate(attendantId, date)
        : Promise.resolve([]),
    enabled: !!attendantId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutos (mais frequente para disponibilidade)
  });
}

// ============================================
// HOOK PARA GERENCIAMENTO DE AGENDAMENTOS
// ============================================

export function useAppointments(attendantId?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();

  // Buscar agendamentos por período
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', attendantId, startDate, endDate],
    queryFn: () => 
      attendantId && startDate && endDate
        ? appointmentService.getAppointmentsByAttendantAndPeriod(attendantId, startDate, endDate)
        : Promise.resolve([]),
    enabled: !!attendantId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Criar novo agendamento
  const createAppointment = useMutation({
    mutationFn: (data: AppointmentFormData) => appointmentService.createAppointment(data),
    onSuccess: () => {
      toast.success('Agendamento criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar agendamento:', error);
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  // Atualizar agendamento
  const updateAppointment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentFormData> }) => 
      appointmentService.updateAppointment(id, data),
    onSuccess: () => {
      toast.success('Agendamento atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error(`Erro ao atualizar agendamento: ${error.message}`);
    },
  });

  // Cancelar agendamento
  const cancelAppointment = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success('Agendamento cancelado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(`Erro ao cancelar agendamento: ${error.message}`);
    },
  });

  // Confirmar agendamento
  const confirmAppointment = useMutation({
    mutationFn: (id: string) => appointmentService.confirmAppointment(id),
    onSuccess: () => {
      toast.success('Agendamento confirmado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error(`Erro ao confirmar agendamento: ${error.message}`);
    },
  });

  // Concluir agendamento
  const completeAppointment = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      appointmentService.completeAppointment(id, notes),
    onSuccess: () => {
      toast.success('Agendamento concluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao concluir agendamento:', error);
      toast.error(`Erro ao concluir agendamento: ${error.message}`);
    },
  });

  return {
    appointments: appointments || [],
    isLoading,
    error,
    createAppointment: createAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    cancelAppointment: cancelAppointment.mutate,
    confirmAppointment: confirmAppointment.mutate,
    completeAppointment: completeAppointment.mutate,
    isCreating: createAppointment.isPending,
    isUpdating: updateAppointment.isPending,
    isCancelling: cancelAppointment.isPending,
    isConfirming: confirmAppointment.isPending,
    isCompleting: completeAppointment.isPending,
  };
}

// ============================================
// HOOK PARA AGENDAMENTOS POR DATA
// ============================================

export function useAppointmentsByDate(date?: string) {
  return useQuery({
    queryKey: ['appointments-by-date', date],
    queryFn: () => date ? appointmentService.getAppointmentsByDate(date) : Promise.resolve([]),
    enabled: !!date,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}