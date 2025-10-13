-- Adicionar coluna pix_key à tabela site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS pix_key text;

-- Adicionar comentário à coluna
COMMENT ON COLUMN public.site_settings.pix_key IS 'Chave PIX para pagamentos (pode ser CPF, CNPJ, email, telefone ou chave aleatória)';