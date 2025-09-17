-- Adicionar coluna DUM (Data da Última Menstruação) à tabela medical_records
-- Esta coluna será usada para exibir informações obstétricas no histórico de atendimentos

ALTER TABLE medical_records 
ADD COLUMN dum DATE;

-- Adicionar comentário para documentar o propósito da coluna
COMMENT ON COLUMN medical_records.dum IS 'Data da Última Menstruação - copiada do agendamento para exibir informações obstétricas no histórico';

-- Criar índice para otimizar consultas que filtram por DUM
CREATE INDEX IF NOT EXISTS idx_medical_records_dum ON medical_records(dum) WHERE dum IS NOT NULL;