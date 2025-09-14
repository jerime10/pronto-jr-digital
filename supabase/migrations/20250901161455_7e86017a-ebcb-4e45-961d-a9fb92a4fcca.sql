-- Corrigir problemas de segurança restantes
-- Habilitar RLS para todas as tabelas restantes
ALTER TABLE public.exam_models ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para tabelas sem políticas (que agora têm RLS habilitado)
-- Políticas para professionals
CREATE POLICY "Allow all access to professionals" ON public.professionals FOR ALL TO authenticated USING (true);

-- Políticas para patients
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL TO authenticated USING (true);

-- Políticas para medical_records  
CREATE POLICY "Allow all access to medical_records" ON public.medical_records FOR ALL TO authenticated USING (true);

-- Políticas para site_settings
CREATE POLICY "Allow all access to site_settings" ON public.site_settings FOR ALL TO authenticated USING (true);

-- Corrigir funções restantes adicionando search_path
CREATE OR REPLACE FUNCTION public.get_patients_for_search(search_term text DEFAULT NULL::text)
RETURNS TABLE(id uuid, name character varying, sus character varying, age integer, gender character varying, phone character varying, address text, date_of_birth date, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF search_term IS NULL OR search_term = '' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.sus, p.age, p.gender, p.phone, p.address, p.date_of_birth, p.created_at, p.updated_at
    FROM public.patients p
    ORDER BY p.name ASC;
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.sus, p.age, p.gender, p.phone, p.address, p.date_of_birth, p.created_at, p.updated_at
    FROM public.patients p
    WHERE p.name ILIKE '%' || search_term || '%' 
       OR p.sus ILIKE '%' || search_term || '%'
    ORDER BY p.name ASC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_auth_policy(table_name text, policy_name text, operation text, check_expression text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sql text;
BEGIN
    -- Check if policy exists and drop it
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors when dropping policy
        NULL;
    END;

    -- Create the new policy
    sql := format(
        'CREATE POLICY %I ON %I FOR %s TO authenticated USING (%s)',
        policy_name, 
        table_name,
        operation,
        check_expression
    );
    
    EXECUTE sql;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pg_enable_row_level_security(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_active_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Se o template está sendo marcado como ativo
  IF NEW.is_active = true THEN
    -- Desativa todos os outros templates
    UPDATE whatsapp_message_templates 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;