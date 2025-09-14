-- Desabilitar RLS na tabela site_settings para permitir acesso com autenticação customizada
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS site_settings_delete_policy ON site_settings;
DROP POLICY IF EXISTS site_settings_insert_policy ON site_settings;
DROP POLICY IF EXISTS site_settings_select_policy ON site_settings;
DROP POLICY IF EXISTS site_settings_update_policy ON site_settings;

-- Adicionar comentário explicativo
COMMENT ON TABLE public.site_settings IS 'RLS desabilitado - sistema usa autenticação customizada';