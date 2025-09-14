-- Desabilitar RLS temporariamente para permitir acesso aos dados com autenticação customizada
-- O sistema usa autenticação customizada, não Supabase Auth

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_drafts DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS patients_all_policy ON patients;
DROP POLICY IF EXISTS prescription_models_all_policy ON prescription_models;
DROP POLICY IF EXISTS exam_models_all_policy ON exam_models;
DROP POLICY IF EXISTS professionals_all_policy ON professionals;
DROP POLICY IF EXISTS medical_records_all_policy ON medical_records;

-- Adicionar comentário explicativo
COMMENT ON TABLE public.patients IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.prescription_models IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.exam_models IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.professionals IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.medical_records IS 'RLS desabilitado - sistema usa autenticação customizada';