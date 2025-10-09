import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appointmentsService, AppointmentData, AppointmentFilters } from '@/services/appointmentsService';

export function useAppointments(filters?: AppointmentFilters) {
  const queryClient = useQueryClient();

  // Buscar agendamentos
  const { 
    data: appointments = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsService.getAllAppointments(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Buscar contadores de status
  const { 
    data: counts = {}, 
    isLoading: isLoadingCounts 
  } = useQuery({
    queryKey: ['appointment-counts'],
    queryFn: () => appointmentsService.getAppointmentCounts(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Atualizar status do agendamento
  const updateAppointmentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      appointmentsService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Status do agendamento atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-counts'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  // Excluir agendamento
  const deleteAppointment = useMutation({
    mutationFn: (id: string) => appointmentsService.deleteAppointment(id),
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-counts'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir agendamento:', error);
      toast.error(`Erro ao excluir agendamento: ${error.message}`);
    },
  });

  return {
    data: appointments,
    counts,
    isLoading,
    isLoadingCounts,
    error,
    refetch,
    updateAppointmentStatus: updateAppointmentStatus.mutate,
    deleteAppointment: deleteAppointment.mutateAsync,
    isUpdating: updateAppointmentStatus.isPending,
    isDeleting: deleteAppointment.isPending,
  };
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsService.getAppointmentById(id),
    enabled: !!id,
  });
}