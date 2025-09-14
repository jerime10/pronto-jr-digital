-- Solução definitiva para o erro de webhook: Corrigir políticas RLS e funções

-- 1. Primeiro, melhorar a função get_current_user_id() para trabalhar melhor com autenticação customizada
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_token TEXT;
  user_id UUID;
  auth_header TEXT;
BEGIN
  -- Tentar pegar o token do header Authorization primeiro
  BEGIN
    auth_header := current_setting('request.headers', true)::json->>'authorization';
    
    IF auth_header IS NOT NULL AND auth_header LIKE 'Bearer %' THEN
      current_token := substr(auth_header, 8); -- Remove 'Bearer '
    END IF;
  EXCEPTION WHEN OTHERS THEN
    auth_header := NULL;
  END;
  
  -- Se não conseguiu do Authorization, tentar do jwt claims
  IF current_token IS NULL THEN
    BEGIN
      current_token := current_setting('request.jwt.claims', true)::json->>'token';
    EXCEPTION WHEN OTHERS THEN
      current_token := NULL;
    END;
  END IF;
  
  -- Se ainda não tem token, retornar null
  IF current_token IS NULL OR current_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Busca usuário pela sessão ativa
  SELECT us.user_id INTO user_id
  FROM public.user_sessions us
  JOIN public.custom_users cu ON cu.id = us.user_id
  WHERE us.token = current_token
    AND us.expires_at > now()
    AND us.is_active = true
    AND cu.is_active = true;
    
  RETURN user_id;
END;
$$;

-- 2. Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := public.get_current_user_id();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT cu.role INTO user_role
  FROM public.custom_users cu
  WHERE cu.id = current_user_id
    AND cu.is_active = true;
    
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- 3. Remover todas as políticas RLS existentes da tabela site_settings
DROP POLICY IF EXISTS "Allow all access to site_settings" ON public.site_settings;

-- 4. Criar novas políticas RLS adequadas para autenticação customizada
-- Política para SELECT - permite leitura para usuários autenticados
CREATE POLICY "Allow authenticated users to read site_settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.get_current_user_id() IS NOT NULL);

-- Política para INSERT - permite apenas para admins, e quando não há registros existentes
CREATE POLICY "Allow admin users to insert site_settings"
ON public.site_settings 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_current_user_admin() = true AND
  NOT EXISTS (SELECT 1 FROM public.site_settings)
);

-- Política para UPDATE - permite apenas para admins
CREATE POLICY "Allow admin users to update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin() = true)
WITH CHECK (public.is_current_user_admin() = true);

-- Política para DELETE - permite apenas para admins  
CREATE POLICY "Allow admin users to delete site_settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (public.is_current_user_admin() = true);

-- 5. Garantir que RLS está habilitado
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 6. Inserir configuração inicial se não existir (apenas se a tabela estiver vazia)
INSERT INTO public.site_settings (
  primary_color,
  accent_color, 
  font_family,
  clinic_name,
  clinic_address,
  clinic_phone,
  n8n_webhook_url,
  medical_record_webhook_url
) 
SELECT 
  '#10b981',
  '#3b82f6',
  'Inter',
  'Clínica Exemplo',
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 7. Testar se as funções estão funcionando
SELECT 
  'Teste de autenticação customizada' as test,
  public.get_current_user_id() as current_user_id,
  public.is_current_user_admin() as is_admin;