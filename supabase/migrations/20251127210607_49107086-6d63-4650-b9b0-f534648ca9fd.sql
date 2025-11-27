-- Enable RLS on tables that have policies but RLS is disabled
-- This fixes the "Policy Exists RLS Disabled" errors

-- Enable RLS for exam_models
ALTER TABLE public.exam_models ENABLE ROW LEVEL SECURITY;

-- Enable RLS for generated_documents
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS for medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS for modelo-result-exames
ALTER TABLE public."modelo-result-exames" ENABLE ROW LEVEL SECURITY;

-- Enable RLS for patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS for prescription_models
ALTER TABLE public.prescription_models ENABLE ROW LEVEL SECURITY;

-- Enable RLS for usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Fix Security Definer View issue
-- Recreate user_permissions_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.user_permissions_view CASCADE;

CREATE VIEW public.user_permissions_view AS
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

-- Add comment to the view
COMMENT ON VIEW public.user_permissions_view IS 'View without SECURITY DEFINER - uses querying user permissions';
