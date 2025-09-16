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

  return {
    data: appointments,
    counts,
    isLoading,
    isLoadingCounts,
    error,
    refetch,
    updateAppointmentStatus: updateAppointmentStatus.mutate,
    isUpdating: updateAppointmentStatus.isPending,
  };
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsService.getAppointmentById(id),
    enabled: !!id,
  });
}