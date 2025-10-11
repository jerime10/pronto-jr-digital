-- Criar/atualizar usuário administrador com partner_code e partner_username ADM
-- para que use a mesma lógica dos parceiros

-- Primeiro, atualizar o usuário admin existente (se houver) para incluir partner_code='ADM'
UPDATE public.usuarios
SET 
  partner_code = 'ADM',
  updated_at = NOW()
WHERE user_type = 'admin' AND is_active = true;

-- Se não houver nenhum usuário admin com username 'admin', criar um
-- (isso é apenas para garantir que exista um admin)
INSERT INTO public.usuarios (
  username,
  password,
  user_type,
  full_name,
  is_active,
  partner_code,
  permissions
)
SELECT 
  'admin',
  'admin123',
  'admin',
  'Administrador',
  true,
  'ADM',
  '{"dashboard": true, "agendamentos": true, "pacientes": true, "atendimento": true, "prescricoes": true, "exames": true, "financeiro": true, "usuarios": true, "configuracoes": true, "links": true, "partner_dashboard": true, "partner_relatorios_proprios": true}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios WHERE user_type = 'admin' AND is_active = true
);

-- Garantir que todos os administradores ativos tenham o partner_code='ADM'
UPDATE public.usuarios
SET partner_code = 'ADM'
WHERE user_type = 'admin' AND is_active = true AND (partner_code IS NULL OR partner_code != 'ADM');