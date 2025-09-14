-- Solução definitiva usando MD5 (nativo do PostgreSQL)
-- MD5 é suficiente para este sistema e não requer extensões

-- Criar funções usando MD5 que é nativo
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(password || 'salt_secreto_2025');
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT md5(password || 'salt_secreto_2025') = hash;
$$;

-- Habilitar RLS para tabelas principais
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Recriar usuário admin com hash MD5
DELETE FROM public.custom_users WHERE email = 'admin@sistema.com';

INSERT INTO public.custom_users (id, email, password_hash, name, role, is_active)
VALUES (
  '7cc420ea-61ab-4b9c-9af2-d1cf5b7fee1e',
  'admin@sistema.com',
  md5('admin123' || 'salt_secreto_2025'),
  'Administrador',
  'admin',
  true
);

-- Teste final das funções
SELECT 
  'Teste MD5 hash_password' as teste,
  length(hash_password('admin123')) as hash_length,
  hash_password('admin123') = hash_password('admin123') as hash_consistent;

SELECT 
  'Teste MD5 verify_password' as teste,
  verify_password('admin123', (SELECT password_hash FROM custom_users WHERE email = 'admin@sistema.com')) as login_admin_ok,
  verify_password('senha_errada', (SELECT password_hash FROM custom_users WHERE email = 'admin@sistema.com')) as login_admin_fail;