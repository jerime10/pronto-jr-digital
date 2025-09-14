-- Adicionar colunas para estrutura chave-valor na tabela site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS setting_key text,
ADD COLUMN IF NOT EXISTS setting_value text;

-- Criar índice para melhor performance nas consultas por chave
CREATE INDEX IF NOT EXISTS idx_site_settings_setting_key ON public.site_settings(setting_key);

-- Inserir configurações padrão para URLs públicas se não existirem
INSERT INTO public.site_settings (setting_key, setting_value)
SELECT 'public_scheduling_url', 'https://www.google.com/'
WHERE NOT EXISTS (
    SELECT 1 FROM public.site_settings 
    WHERE setting_key = 'public_scheduling_url'
);

INSERT INTO public.site_settings (setting_key, setting_value)
SELECT 'public_exit_url', 'https://www.google.com/'
WHERE NOT EXISTS (
    SELECT 1 FROM public.site_settings 
    WHERE setting_key = 'public_exit_url'
);

-- Comentário explicativo
COMMENT ON COLUMN public.site_settings.setting_key IS 'Chave para configurações no formato chave-valor';
COMMENT ON COLUMN public.site_settings.setting_value IS 'Valor para configurações no formato chave-valor';