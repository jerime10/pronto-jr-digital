-- Simplificar RLS policies para site_settings - permitir acesso para usuários autenticados
DROP POLICY IF EXISTS "Allow admin users to update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admin users to insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admin users to delete site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read site_settings" ON site_settings;

-- Criar políticas mais permissivas para usuários autenticados
CREATE POLICY "Allow authenticated users full access to site_settings" 
ON site_settings 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Comentário: Simplifica o acesso às configurações do site para usuários autenticados via novo sistema
COMMENT ON POLICY "Allow authenticated users full access to site_settings" ON site_settings IS 'Permite acesso completo às configurações para usuários autenticados no novo sistema simples';