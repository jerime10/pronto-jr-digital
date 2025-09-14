-- Verificar se a extensão pgcrypto está habilitada
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Recriar as funções com search_path definido
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;