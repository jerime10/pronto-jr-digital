import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, Transaction, TransactionFormData } from '@/services/transactionsService';
import { toast } from 'sonner';

export const useTransactions = () => {
  const queryClient = useQueryClient();

  // Query para buscar todas as transações
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAllTransactions,
    staleTime: 30000, // 30 segundos
  });

  // Mutation para criar transação
  const createTransactionMutation = useMutation({
    mutationFn: transactionsService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
    },
  });

  // Mutation para atualizar transação
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) =>
      transactionsService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    },
  });

  // Mutation para atualizar status da transação
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Pendente' | 'Pago' }) =>
      transactionsService.updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  // Mutation para excluir transação
  const deleteTransactionMutation = useMutation({
    mutationFn: transactionsService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    },
  });

  // Mutation para sincronizar transações de agendamentos
  const syncTransactionsMutation = useMutation({
    mutationFn: transactionsService.getTransactionsFromCompletedAppointments,
    onSuccess: (data) => {
      queryClient.setQueryData(['transactions'], data);
      toast.success('Transações sincronizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao sincronizar transações:', error);
      toast.error('Erro ao sincronizar transações');
    },
  });

  return {
    // Data
    transactions,
    isLoading,
    error,
    
    // Actions
    refetch,
    createTransaction: createTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    syncTransactions: syncTransactionsMutation.mutate,
    
    // Loading states
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
    isSyncing: syncTransactionsMutation.isPending,
  };
};

export const useTransactionsByPeriod = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['transactions', 'period', startDate, endDate],
    queryFn: () => transactionsService.getTransactionsByPeriod(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 30000,
  });
};

export const useTransactionsByStatus = (status: 'Pendente' | 'Pago') => {
  return useQuery({
    queryKey: ['transactions', 'status', status],
    queryFn: () => transactionsService.getTransactionsByStatus(status),
    staleTime: 30000,
  });
};