-- Adicionar campo public_registration_url à tabela site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS public_registration_url TEXT;

-- Comentário para documentar o campo
COMMENT ON COLUMN site_settings.public_registration_url IS 'URL para redirecionamento após tentativas fracassadas de CPF/SUS no agendamento público';