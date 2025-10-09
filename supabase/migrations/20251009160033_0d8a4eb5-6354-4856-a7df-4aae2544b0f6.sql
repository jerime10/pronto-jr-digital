-- Remover constraint de foreign key com CASCADE DELETE se existir
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_appointment_id_fkey;

-- Tornar appointment_id nullable
ALTER TABLE public.transactions 
ALTER COLUMN appointment_id DROP NOT NULL;

-- Recriar foreign key SEM CASCADE DELETE (apenas RESTRICT para evitar deleção acidental)
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_appointment_id_fkey
FOREIGN KEY (appointment_id)
REFERENCES public.appointments(id)
ON DELETE SET NULL; -- Quando appointment for deletado, apenas seta o appointment_id como NULL na transaction

-- Comentário explicativo
COMMENT ON COLUMN public.transactions.appointment_id IS 'Referência opcional ao agendamento. Quando o agendamento for excluído, este campo será definido como NULL, preservando a transação.';