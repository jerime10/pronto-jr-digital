import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  appointment_id: string | null;
  transaction_date: string;
  type: 'Entrada' | 'Saída';
  description: string;
  value: number; // Mapeado do campo 'amount' do banco
  status: 'Pendente' | 'Pago';
  origin: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  appointment_id?: string;
  transaction_date: string;
  type: 'Entrada' | 'Saída';
  description: string;
  value: number; // Será mapeado para 'amount' no banco
  status: 'Pendente' | 'Pago';
  origin: string;
}

// Interface para dados do banco de dados
interface DatabaseTransaction {
  id: string;
  appointment_id: string | null;
  transaction_date: string;
  description: string;
  amount: number; // Campo real do banco
  status: string;
  payment_method: string;
  origin?: string; // Campo adicionado ao banco
  type?: string; // Campo adicionado ao banco
  created_at: string;
  updated_at: string;
}

// Função para mapear dados do banco para a interface
function mapDatabaseToTransaction(dbTransaction: DatabaseTransaction): Transaction {
  return {
    id: dbTransaction.id,
    appointment_id: dbTransaction.appointment_id,
    transaction_date: dbTransaction.transaction_date,
    type: (dbTransaction.type as 'Entrada' | 'Saída') || 'Entrada',
    description: dbTransaction.description,
    value: dbTransaction.amount, // Mapear amount para value
    status: dbTransaction.status as 'Pendente' | 'Pago', // Usar diretamente os valores do banco
    origin: dbTransaction.origin || 'Sistema',
    created_at: dbTransaction.created_at,
    updated_at: dbTransaction.updated_at
  };
}

// Função assíncrona para mapear dados do banco com origem detalhada
async function mapDatabaseToTransactionWithOrigin(dbTransaction: DatabaseTransaction): Promise<Transaction> {
  // Se o banco já tem o campo origin preenchido, usar ele
  let origin = dbTransaction.origin || 'Sistema';
  
  // Se não tem origin no banco e tem appointment_id, buscar dinamicamente
  if (!dbTransaction.origin && dbTransaction.appointment_id) {
    try {
      // Buscar informações do agendamento incluindo partner_username
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          id,
          partner_username
        `)
        .eq('id', dbTransaction.appointment_id)
        .single();
      
      if (!error && appointment) {
        if (appointment.partner_username) {
          // Buscar o nome completo do parceiro baseado no partner_username
          const { data: partner, error: partnerError } = await supabase
            .from('usuarios')
            .select('full_name')
            .eq('username', appointment.partner_username)
            .eq('user_type', 'partner')
            .single();
          
          if (!partnerError && partner) {
            origin = partner.full_name || appointment.partner_username;
          } else {
            origin = appointment.partner_username;
          }
        } else {
          origin = 'Agendamento';
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar origem da transação:', error);
      origin = 'Sistema';
    }
  }
  
  return {
    id: dbTransaction.id,
    appointment_id: dbTransaction.appointment_id,
    transaction_date: dbTransaction.transaction_date,
    type: (dbTransaction.type as 'Entrada' | 'Saída') || 'Entrada',
    description: dbTransaction.description,
    value: dbTransaction.amount, // Mapear amount para value
    status: dbTransaction.status as 'Pendente' | 'Pago', // Usar diretamente os valores do banco
    origin,
    created_at: dbTransaction.created_at,
    updated_at: dbTransaction.updated_at
  };
}

// Função para mapear dados da interface para o banco
function mapTransactionToDatabase(transaction: TransactionFormData) {
  return {
    appointment_id: transaction.appointment_id,
    transaction_date: transaction.transaction_date,
    description: transaction.description,
    amount: transaction.value, // Mapear value para amount
    status: transaction.status, // Usar diretamente os valores 'Pendente' e 'Pago'
    payment_method: 'cash', // Valor padrão
    origin: transaction.origin,
    type: transaction.type
  };
}

export const transactionsService = {
  /**
   * Busca todas as transações
   */
  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Erro ao buscar transações');
    }

    // Mapear todas as transações com origem detalhada
    const transactions = await Promise.all(
      (data || []).map(dbTransaction => mapDatabaseToTransactionWithOrigin(dbTransaction))
    );

    return transactions;
  },

  /**
   * Busca transações por período
   */
  async getTransactionsByPeriod(startDate: string, endDate: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações por período:', error);
      throw new Error('Erro ao buscar transações por período');
    }

    // Mapear todas as transações com origem detalhada
    const transactions = await Promise.all(
      (data || []).map(dbTransaction => mapDatabaseToTransactionWithOrigin(dbTransaction))
    );

    return transactions;
  },

  /**
   * Busca transações por status
   */
  async getTransactionsByStatus(status: 'Pendente' | 'Pago'): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', status) // Usar diretamente o status sem conversão
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações por status:', error);
      throw new Error('Erro ao buscar transações por status');
    }

    // Mapear todas as transações com origem detalhada
    const transactions = await Promise.all(
      (data || []).map(dbTransaction => mapDatabaseToTransactionWithOrigin(dbTransaction))
    );

    return transactions;
  },

  /**
   * Cria uma nova transação
   */
  async createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
    const dbData = mapTransactionToDatabase(transactionData);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Erro ao criar transação');
    }

    return mapDatabaseToTransaction(data);
  },

  /**
   * Atualiza uma transação existente
   */
  async updateTransaction(id: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    const dbData = mapTransactionToDatabase(transactionData as TransactionFormData);
    
    const { data, error } = await supabase
      .from('transactions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      throw new Error('Erro ao atualizar transação');
    }

    return mapDatabaseToTransaction(data);
  },

  /**
   * Atualiza o status de uma transação
   */
  async updateTransactionStatus(id: string, status: 'Pendente' | 'Pago'): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: status }) // Usar diretamente o status sem conversão
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status da transação:', error);
      throw new Error('Erro ao atualizar status da transação');
    }

    return mapDatabaseToTransaction(data);
  },

  /**
   * Exclui uma transação
   */
  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir transação:', error);
      throw new Error('Erro ao excluir transação');
    }
  },

  /**
   * Cria transação automaticamente a partir de um agendamento finalizado
   */
  async createTransactionFromAppointment(appointmentId: string): Promise<Transaction | null> {
    try {
      // Buscar dados do agendamento incluindo partner_username
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          service_name,
          service_price,
          appointment_date,
          status,
          updated_at,
          partner_username
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        console.error('Erro ao buscar agendamento:', appointmentError);
        return null;
      }

      // Verificar se o agendamento está finalizado
      if (appointment.status !== 'completed') {
        console.log('Agendamento não está finalizado, não criando transação');
        return null;
      }

      // Verificar se já existe uma transação para este agendamento
      const { data: existingTransaction, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (!checkError && existingTransaction) {
        console.log('Transação já existe para este agendamento');
        return null;
      }

      // Determinar a origem baseada no partner_username
      let origin = 'Sistema';
      if (appointment.partner_username) {
        // Buscar o nome completo do parceiro baseado no partner_username
         const { data: partner, error: partnerError } = await supabase
           .from('usuarios')
           .select('full_name')
           .eq('username', appointment.partner_username)
           .eq('user_type', 'partner')
           .single();
         
         if (!partnerError && partner) {
           origin = partner.full_name || appointment.partner_username;
        } else {
          origin = appointment.partner_username;
        }
      } else {
        origin = 'Agendamento';
      }

      // Criar nova transação
      const transactionData: TransactionFormData = {
        appointment_id: appointment.id,
        transaction_date: appointment.updated_at || appointment.appointment_date,
        type: 'Entrada',
        description: appointment.service_name || 'Serviço não especificado',
        value: appointment.service_price || 0,
        status: 'Pendente',
        origin: origin
      };

      return await this.createTransaction(transactionData);

    } catch (error) {
      console.error('Erro ao criar transação a partir do agendamento:', error);
      return null;
    }
  },

  /**
   * Busca transações de agendamentos finalizados
   */
  async getTransactionsFromCompletedAppointments(): Promise<Transaction[]> {
    try {
      // Buscar agendamentos finalizados que não têm transação
      const { data: completedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          service_name,
          service_price,
          appointment_date,
          updated_at
        `)
        .eq('status', 'completed');

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos finalizados:', appointmentsError);
        return [];
      }

      if (!completedAppointments || completedAppointments.length === 0) {
        console.log('Nenhum agendamento finalizado encontrado');
        return [];
      }

      // Buscar transações existentes para estes agendamentos
      const appointmentIds = completedAppointments.map(apt => apt.id);
      const { data: existingTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('appointment_id')
        .in('appointment_id', appointmentIds);

      if (transactionsError) {
        console.error('Erro ao buscar transações existentes:', transactionsError);
        return [];
      }

      const existingAppointmentIds = new Set(
        existingTransactions?.map(t => t.appointment_id) || []
      );

      // Criar transações para agendamentos que não têm transação
      const newTransactions: Transaction[] = [];
      
      for (const appointment of completedAppointments) {
        if (!existingAppointmentIds.has(appointment.id)) {
          const transaction = await this.createTransactionFromAppointment(appointment.id);
          if (transaction) {
            newTransactions.push(transaction);
          }
        }
      }

      console.log(`Criadas ${newTransactions.length} novas transações`);
      
      // Retornar todas as transações
      return await this.getAllTransactions();

    } catch (error) {
      console.error('Erro ao processar transações de agendamentos:', error);
      return [];
    }
  }
};