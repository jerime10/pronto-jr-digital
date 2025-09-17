-- Adicionar campo appointment_id na tabela medical_records para conectar agendamentos com atendimentos
ALTER TABLE public.medical_records 
ADD COLUMN appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Adicionar índice para melhorar performance das consultas
CREATE INDEX idx_medical_records_appointment_id ON public.medical_records(appointment_id);

-- Comentário para documentar a nova coluna
COMMENT ON COLUMN public.medical_records.appointment_id IS 'ID do agendamento relacionado ao prontuário médico';