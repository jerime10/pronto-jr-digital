
-- Adicionar colunas de início e fim de atendimento na tabela generated_documents
ALTER TABLE generated_documents 
ADD COLUMN attendance_start_at timestamp with time zone,
ADD COLUMN attendance_end_at timestamp with time zone;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN generated_documents.attendance_start_at IS 'Data e hora de início do atendimento';
COMMENT ON COLUMN generated_documents.attendance_end_at IS 'Data e hora de fim do atendimento';
