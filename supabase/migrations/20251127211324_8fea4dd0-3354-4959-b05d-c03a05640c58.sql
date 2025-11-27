-- Fix remaining Security Definer View issue
-- Force recreate view with explicit SECURITY INVOKER

DROP VIEW IF EXISTS public.user_permissions_view CASCADE;

CREATE VIEW public.user_permissions_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  full_name,
  user_type,
  is_active,
  permissions,
  partner_code,
  (permissions->>'dashboard')::BOOLEAN as can_access_dashboard,
  (permissions->>'pacientes')::BOOLEAN as can_access_pacientes,
  (permissions->>'agendamentos')::BOOLEAN as can_access_agendamentos,
  (permissions->>'atendimento')::BOOLEAN as can_access_atendimento,
  (permissions->>'financeiro')::BOOLEAN as can_access_financeiro,
  (permissions->>'configuracoes')::BOOLEAN as can_access_configuracoes,
  (permissions->>'usuarios')::BOOLEAN as can_access_usuarios,
  (permissions->>'prescricoes')::BOOLEAN as can_access_prescricoes,
  (permissions->>'exames')::BOOLEAN as can_access_exames,
  (permissions->>'partner_dashboard')::BOOLEAN as can_access_partner_dashboard,
  (permissions->>'partner_links')::BOOLEAN as can_access_partner_links
FROM public.usuarios
WHERE is_active = true;

COMMENT ON VIEW public.user_permissions_view IS 'View with explicit SECURITY INVOKER - uses querying user permissions';
