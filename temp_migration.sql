-- Adicionar colunas setting_key e setting_value à tabela site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS setting_key text,
ADD COLUMN IF NOT EXISTS setting_value text;

-- Criar índice para melhor performance nas consultas por setting_key
CREATE INDEX IF NOT EXISTS idx_site_settings_setting_key ON public.site_settings(setting_key);

-- Inserir configurações padrão para as URLs públicas
INSERT INTO public.site_settings (setting_key, setting_value) 
VALUES 
  ('public_scheduling_url', 'https://www.google.com/'),
  ('public_exit_url', 'https://www.google.com/')
ON CONFLICT (setting_key) DO NOTHING;

-- Adicionar comentários às colunas para documentação
COMMENT ON COLUMN public.site_settings.setting_key IS 'Chave da configuração (ex: public_scheduling_url, public_exit_url)';
COMMENT ON COLUMN public.site_settings.setting_value IS 'Valor da configuração correspondente à chave';