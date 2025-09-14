-- Habilitar extensão pgcrypto para usar digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Recriar funções com hash seguro usando digest (agora que pgcrypto está habilitado)
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

-- Recriar usuário admin com novo hash
DELETE FROM public.custom_users WHERE email = 'admin@sistema.com';

INSERT INTO public.custom_users (id, email, password_hash, name, role, is_active)
VALUES (
  '7cc420ea-61ab-4b9c-9af2-d1cf5b7fee1e',
  'admin@sistema.com',
  encode(digest('admin123' || 'salt_secreto_2025', 'sha256'), 'hex'),
  'Administrador',
  'admin',
  true
);

-- Testar as funções novamente
SELECT 
  'Teste final verify_password' as teste,
  verify_password('admin123', (SELECT password_hash FROM custom_users WHERE email = 'admin@sistema.com')) as login_admin_ok,
  verify_password('senha_errada', (SELECT password_hash FROM custom_users WHERE email = 'admin@sistema.com')) as login_admin_fail;