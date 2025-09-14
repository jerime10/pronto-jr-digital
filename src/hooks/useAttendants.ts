import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchAttendants, 
  fetchActiveAttendants, 
  fetchAttendantById,
  createAttendant,
  updateAttendant,
  deleteAttendant,
  permanentlyDeleteAttendant
} from '@/services/attendantService';
import { Attendant, AttendantFormData } from '@/types/database';

// ============================================
// HOOK PARA BUSCAR TODOS OS ATENDENTES
// ============================================

export function useAttendants() {
  return useQuery({
    queryKey: ['attendants'],
    queryFn: fetchAttendants,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================
// HOOK PARA BUSCAR APENAS ATENDENTES ATIVOS
// ============================================

export function useActiveAttendants() {
  return useQuery({
    queryKey: ['attendants', 'active'],
    queryFn: fetchActiveAttendants,
    staleTime: 0, // Desabilitar cache temporariamente
    cacheTime: 0, // Não manter em cache
    refetchOnMount: true, // Sempre refetch ao montar
  });
}

// ============================================
// HOOK PARA BUSCAR UM ATENDENTE ESPECÍFICO
// ============================================

export function useAttendant(id?: string) {
  return useQuery({
    queryKey: ['attendants', id],
    queryFn: () => id ? fetchAttendantById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================
// HOOK PARA CRIAR ATENDENTE
// ============================================

export function useCreateAttendant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AttendantFormData) => createAttendant(data),
    onSuccess: () => {
      toast.success('Atendente criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar atendente:', error);
      toast.error(`Erro ao criar atendente: ${error.message}`);
    },
  });
}

// ============================================
// HOOK PARA ATUALIZAR ATENDENTE
// ============================================

export function useUpdateAttendant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendantFormData> }) => 
      updateAttendant(id, data),
    onSuccess: () => {
      toast.success('Atendente atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar atendente:', error);
      toast.error(`Erro ao atualizar atendente: ${error.message}`);
    },
  });
}

// ============================================
// HOOK PARA DELETAR ATENDENTE (SOFT DELETE)
// ============================================

export function useDeleteAttendant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAttendant(id),
    onSuccess: () => {
      toast.success('Atendente desativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao desativar atendente:', error);
      toast.error(`Erro ao desativar atendente: ${error.message}`);
    },
  });
}

// ============================================
// HOOK PARA DELETAR ATENDENTE PERMANENTEMENTE
// ============================================

export function usePermanentlyDeleteAttendant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteAttendant(id),
    onSuccess: () => {
      toast.success('Atendente excluído permanentemente!');
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir atendente:', error);
      toast.error(`Erro ao excluir atendente: ${error.message}`);
    },
  });
}

// ============================================
// HOOK COMPOSTO PARA GESTÃO COMPLETA DE ATENDENTES
// ============================================

export function useAttendantsManager() {
  const queryClient = useQueryClient();
  
  const attendants = useAttendants();
  const activeAttendants = useActiveAttendants();
  const createMutation = useCreateAttendant();
  const updateMutation = useUpdateAttendant();
  const deleteMutation = useDeleteAttendant();
  const permanentDeleteMutation = usePermanentlyDeleteAttendant();

  const refreshAttendants = () => {
    queryClient.invalidateQueries({ queryKey: ['attendants'] });
  };

  return {
    // Dados
    attendants: attendants.data || [],
    activeAttendants: activeAttendants.data || [],
    
    // Estados de loading
    isLoading: attendants.isLoading || activeAttendants.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || permanentDeleteMutation.isPending,
    
    // Erros
    error: attendants.error || activeAttendants.error,
    
    // Ações
    createAttendant: createMutation.mutate,
    updateAttendant: updateMutation.mutate,
    deleteAttendant: deleteMutation.mutate,
    permanentlyDeleteAttendant: permanentDeleteMutation.mutate,
    refreshAttendants,
  };
}