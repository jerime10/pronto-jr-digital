-- Criar tabela de transações financeiras
-- Data: 2025-01-06
-- Descrição: Tabela para gerenciar transações financeiras baseadas em agendamentos

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  transaction_date timestamp with time zone NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('Entrada', 'Saída')),
  description text NOT NULL,
  value decimal(10,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago')),
  origin varchar(100) NOT NULL DEFAULT 'Agendamento',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON public.transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para usuários autenticados
CREATE POLICY "Allow authenticated access to transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Função para criar transação automaticamente quando agendamento for finalizado
CREATE OR REPLACE FUNCTION create_transaction_on_appointment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o status mudou para 'completed' (finalizado)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Inserir nova transação
    INSERT INTO public.transactions (
      appointment_id,
      transaction_date,
      type,
      description,
      value,
      status,
      origin
    ) VALUES (
      NEW.id,
      NEW.updated_at,
      'Entrada',
      COALESCE(NEW.service_name, 'Serviço não especificado'),
      COALESCE(NEW.service_price, 0),
      'Pendente',
      'Agendamento'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar transação quando agendamento for finalizado
CREATE TRIGGER trigger_create_transaction_on_completion
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_on_appointment_completion();