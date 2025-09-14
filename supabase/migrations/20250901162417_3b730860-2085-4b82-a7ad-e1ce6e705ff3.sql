-- Corrigir sintaxe do search_path nas funções hash_password e verify_password
-- A sintaxe correta é "SET search_path = public" não "SET search_path TO 'public'"

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

-- Testar se as funções estão funcionando corretamente
SELECT 'Teste de hash e verify' as test, 
       hash_password('admin123') as hash_result,
       verify_password('admin123', hash_password('admin123')) as verify_result;