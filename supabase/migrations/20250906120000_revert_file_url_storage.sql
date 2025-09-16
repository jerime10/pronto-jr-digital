-- Reverter adição da coluna file_url_storage na tabela medical_records
ALTER TABLE medical_records 
DROP COLUMN IF EXISTS file_url_storage;

-- Comentário: Esta migração reverte a adição da coluna file_url_storage que foi adicionada em 20250903021910