-- Atualizar políticas RLS para usar o sistema customizado
-- Primeiro vamos dropar as políticas antigas que usam auth.uid()

-- Dropar políticas antigas da tabela professionals
DROP POLICY IF EXISTS "Users can create their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can delete their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can update their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can view all professionals" ON public.professionals;

-- Dropar políticas antigas da tabela patients
DROP POLICY IF EXISTS "Allow admin access to all tables" ON public.patients;

-- Dropar políticas antigas da tabela medical_records
DROP POLICY IF EXISTS "Allow admin access to all tables" ON public.medical_records;

-- Dropar políticas antigas da tabela site_settings
DROP POLICY IF EXISTS "Allow admin access to all tables" ON public.site_settings;
DROP POLICY IF EXISTS "Allow read access to site settings for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Allow update access to site settings for admin users" ON public.site_settings;

-- Criar novas políticas para professionals
CREATE POLICY "Custom users can view all professionals" ON public.professionals
  FOR SELECT USING (get_current_user_id() IS NOT NULL);

CREATE POLICY "Custom users can create professional profiles" ON public.professionals
  FOR INSERT WITH CHECK (get_current_user_id() IS NOT NULL);

CREATE POLICY "Custom users can update professional profiles" ON public.professionals
  FOR UPDATE USING (get_current_user_id() IS NOT NULL);

CREATE POLICY "Custom users can delete professional profiles" ON public.professionals
  FOR DELETE USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para patients
CREATE POLICY "Custom users can manage patients" ON public.patients
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para medical_records
CREATE POLICY "Custom users can manage medical records" ON public.medical_records
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para generated_documents
CREATE POLICY "Custom users can manage documents" ON public.generated_documents
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para prescription_models
CREATE POLICY "Custom users can manage prescription models" ON public.prescription_models
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para exam_models
CREATE POLICY "Custom users can manage exam models" ON public.exam_models
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para completed_exams
CREATE POLICY "Custom users can manage completed exams" ON public.completed_exams
  FOR ALL USING (get_current_user_id() IS NOT NULL);

-- Criar novas políticas para site_settings
CREATE POLICY "Custom users can read site settings" ON public.site_settings
  FOR SELECT USING (get_current_user_id() IS NOT NULL);

CREATE POLICY "Custom admins can manage site settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.custom_users 
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  );

-- Atualizar a função get_current_user_id para funcionar corretamente com edge functions
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;