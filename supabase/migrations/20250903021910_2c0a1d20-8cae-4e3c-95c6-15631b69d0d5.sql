-- Adicionar coluna file_url_storage na tabela medical_records
ALTER TABLE medical_records 
ADD COLUMN file_url_storage text;

-- Comentário: Esta coluna irá armazenar a URL do PDF gerado pelo n8n no storage Supabase