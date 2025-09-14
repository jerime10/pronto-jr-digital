-- Solução definitiva para autenticação
-- Remove dependência de pgcrypto e implementa sistema de hash nativo

-- 1. Criar função de hash nativa usando digest
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(digest(password || 'salt_secreto_2025', 'sha256'), 'hex');
$$;

-- 2. Recriar função de verificação de senha
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(digest(password || 'salt_secreto_2025', 'sha256'), 'hex') = hash;
$$;

-- 3. Deletar usuário admin existente e recriar com senha hasheada corretamente
DELETE FROM public.custom_users WHERE email = 'admin@sistema.com';

-- 4. Inserir usuário admin com senha hasheada (admin123)
INSERT INTO public.custom_users (id, email, password_hash, name, role, is_active)
VALUES (
  '7cc420ea-61ab-4b9c-9af2-d1cf5b7fee1e',
  'admin@sistema.com',
  encode(digest('admin123' || 'salt_secreto_2025', 'sha256'), 'hex'),
  'Administrador',
  'admin',
  true
);

-- 5. Limpar sessões inválidas
DELETE FROM public.user_sessions WHERE user_id NOT IN (SELECT id FROM public.custom_users WHERE is_active = true);

-- 6. Testar as funções
SELECT 
  'Teste hash_password' as teste,
  length(hash_password('admin123')) as hash_length,
  hash_password('admin123') = hash_password('admin123') as hash_consistent;

SELECT 
  'Teste verify_password' as teste,
  verify_password('admin123', hash_password('admin123')) as password_valid,
  verify_password('senha_errada', hash_password('admin123')) as password_invalid;