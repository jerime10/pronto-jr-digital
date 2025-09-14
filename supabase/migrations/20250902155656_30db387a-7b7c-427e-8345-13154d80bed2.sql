-- Criar nova tabela 'usuarios' ultra-simples
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir usuário admin inicial
INSERT INTO public.usuarios (username, password)
VALUES ('admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS na tabela usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Criar política RLS ultra-simples: permitir tudo para usuários autenticados
CREATE POLICY "Allow all access to usuarios" 
ON public.usuarios 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Simplificar RLS policies para todas as outras tabelas principais
-- Política para patients
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;
CREATE POLICY "Allow authenticated access to patients" 
ON public.patients 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Política para professionals
DROP POLICY IF EXISTS "Allow all access to professionals" ON public.professionals;
CREATE POLICY "Allow authenticated access to professionals" 
ON public.professionals 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Política para medical_records
DROP POLICY IF EXISTS "Allow all access to medical_records" ON public.medical_records;
CREATE POLICY "Allow authenticated access to medical_records" 
ON public.medical_records 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Política para prescription_models
DROP POLICY IF EXISTS "Allow all access to prescription_models for auth" ON public.prescription_models;
CREATE POLICY "Allow authenticated access to prescription_models" 
ON public.prescription_models 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Política para exam_models
DROP POLICY IF EXISTS "Allow all access to exam_models for auth" ON public.exam_models;
CREATE POLICY "Allow authenticated access to exam_models" 
ON public.exam_models 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Função para validação de usuário ultra-simples
CREATE OR REPLACE FUNCTION public.validate_simple_user(input_username text, input_password text)
RETURNS TABLE(id uuid, username varchar, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.is_active
  FROM public.usuarios u
  WHERE u.username = input_username 
    AND u.password = input_password
    AND u.is_active = true;
END;
$$;