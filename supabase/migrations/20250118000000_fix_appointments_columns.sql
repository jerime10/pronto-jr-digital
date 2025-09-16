-- Correção da inconsistência na tabela appointments
-- O problema: a tabela foi criada com start_time/end_time mas alguns índices e código usam appointment_time

-- 1. Remover o índice incorreto que usa appointment_time
DROP INDEX IF EXISTS idx_appointments_datetime;

-- 2. Criar o índice correto usando start_time
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, start_time);

-- 3. Verificar se a estrutura está correta
-- A tabela appointments deve ter:
-- - start_time TIME NOT NULL
-- - end_time TIME NOT NULL
-- E NÃO deve ter appointment_time

-- Comentário: O código deve ser atualizado para usar consistentemente start_time e end_time