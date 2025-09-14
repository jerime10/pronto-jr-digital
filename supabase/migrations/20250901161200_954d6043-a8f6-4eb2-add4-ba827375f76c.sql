-- Corrigir problemas de segurança RLS
-- Habilitar RLS para tabelas que têm políticas mas não têm RLS habilitado

-- Habilitar RLS para professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para patients  
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Corrigir funções adicionando search_path seguro
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(digest(password || 'salt_secreto_2025', 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT encode(digest(password || 'salt_secreto_2025', 'sha256'), 'hex') = hash;
$$;

CREATE OR REPLACE FUNCTION public.validate_session(session_token text)
RETURNS TABLE(user_id uuid, email character varying, name character varying, role character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cu.id, cu.email, cu.name, cu.role
  FROM public.user_sessions us
  JOIN public.custom_users cu ON cu.id = us.user_id
  WHERE us.token = session_token
    AND us.expires_at > now()
    AND us.is_active = true
    AND cu.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

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
  -- Tentar pegar o token do header Authorization
  auth_header := current_setting('request.headers', true)::json->>'authorization';
  
  IF auth_header IS NOT NULL AND auth_header LIKE 'Bearer %' THEN
    current_token := substr(auth_header, 8); -- Remove 'Bearer '
  ELSE
    -- Fallback para o jwt claims se existir
    BEGIN
      current_token := current_setting('request.jwt.claims', true)::json->>'token';
    EXCEPTION WHEN OTHERS THEN
      current_token := NULL;
    END;
  END IF;
  
  IF current_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Busca usuário pela sessão ativa
  SELECT us.user_id INTO user_id
  FROM public.user_sessions us
  WHERE us.token = current_token
    AND us.expires_at > now()
    AND us.is_active = true;
    
  RETURN user_id;
END;
$$;