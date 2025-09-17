-- Adicionar coluna DUM (Data da Última Menstruação) à tabela appointments
-- Esta coluna será usada para calcular dinamicamente a Idade Gestacional e DPP

ALTER TABLE appointments 
ADD COLUMN dum DATE;

-- Adicionar comentário para documentar o propósito da coluna
COMMENT ON COLUMN appointments.dum IS 'Data da Última Menstruação - usado para calcular Idade Gestacional e Data Provável do Parto em serviços obstétricos';

-- Criar índice para otimizar consultas que filtram por DUM
CREATE INDEX IF NOT EXISTS idx_appointments_dum ON appointments(dum) WHERE dum IS NOT NULL;