-- Corrigir política RLS da tabela individual_field_templates
-- O sistema usa autenticação customizada, não Supabase Auth

-- Remover política antiga
DROP POLICY IF EXISTS "Allow authenticated access to individual_field_templates" ON public.individual_field_templates;

-- Criar nova política que permite acesso total (similar às outras tabelas do sistema)
CREATE POLICY "Allow all access to individual_field_templates"
ON public.individual_field_templates
FOR ALL
USING (true)
WITH CHECK (true);