-- Remove all RLS policies and disable RLS on all tables

-- Drop all policies from patients table
DROP POLICY IF EXISTS "Custom users can manage patients" ON patients;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar pacientes" ON patients;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir pacientes" ON patients;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir pacientes" ON patients;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver pacientes" ON patients;
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;
DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;

-- Drop all policies from prescription_models table
DROP POLICY IF EXISTS "Allow admin access to all tables" ON prescription_models;
DROP POLICY IF EXISTS "Custom users can manage prescription models" ON prescription_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar modelos de prescri" ON prescription_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir modelos de prescriç" ON prescription_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir modelos de prescriç" ON prescription_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver modelos de prescrição" ON prescription_models;
DROP POLICY IF EXISTS "prescription_models_delete_policy" ON prescription_models;
DROP POLICY IF EXISTS "prescription_models_select_policy" ON prescription_models;
DROP POLICY IF EXISTS "prescription_models_update_policy" ON prescription_models;

-- Drop all policies from exam_models table
DROP POLICY IF EXISTS "Allow admin access to all tables" ON exam_models;
DROP POLICY IF EXISTS "Custom users can manage exam models" ON exam_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar modelos de exame" ON exam_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir modelos de exame" ON exam_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir modelos de exame" ON exam_models;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver modelos de exame" ON exam_models;
DROP POLICY IF EXISTS "exam_models_delete_policy" ON exam_models;
DROP POLICY IF EXISTS "exam_models_select_policy" ON exam_models;
DROP POLICY IF EXISTS "exam_models_update_policy" ON exam_models;

-- Drop all policies from completed_exams table
DROP POLICY IF EXISTS "Allow admin access to all tables" ON completed_exams;
DROP POLICY IF EXISTS "Custom users can manage completed exams" ON completed_exams;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar exames completados" ON completed_exams;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir exames completados" ON completed_exams;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir exames completados" ON completed_exams;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver exames completados" ON completed_exams;
DROP POLICY IF EXISTS "completed_exams_delete_policy" ON completed_exams;
DROP POLICY IF EXISTS "completed_exams_select_policy" ON completed_exams;
DROP POLICY IF EXISTS "completed_exams_update_policy" ON completed_exams;

-- Drop all policies from medical_records table
DROP POLICY IF EXISTS "Custom users can manage medical records" ON medical_records;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar prontuários" ON medical_records;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir prontuários" ON medical_records;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir prontuários" ON medical_records;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver prontuários" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;

-- Drop all policies from generated_documents table
DROP POLICY IF EXISTS "Custom users can manage documents" ON generated_documents;
DROP POLICY IF EXISTS "Todos usuários autenticados podem atualizar documentos" ON generated_documents;
DROP POLICY IF EXISTS "Todos usuários autenticados podem excluir documentos" ON generated_documents;
DROP POLICY IF EXISTS "Todos usuários autenticados podem inserir documentos" ON generated_documents;
DROP POLICY IF EXISTS "Todos usuários autenticados podem ver documentos" ON generated_documents;

-- Drop all policies from professionals table
DROP POLICY IF EXISTS "Allow admin access to all tables" ON professionals;
DROP POLICY IF EXISTS "Custom users can create professional profiles" ON professionals;
DROP POLICY IF EXISTS "Custom users can delete professional profiles" ON professionals;
DROP POLICY IF EXISTS "Custom users can update professional profiles" ON professionals;
DROP POLICY IF EXISTS "Custom users can view all professionals" ON professionals;
DROP POLICY IF EXISTS "professionals_delete_policy" ON professionals;
DROP POLICY IF EXISTS "professionals_select_policy" ON professionals;
DROP POLICY IF EXISTS "professionals_update_policy" ON professionals;

-- Drop all policies from custom_users table
DROP POLICY IF EXISTS "Admins can view all users" ON custom_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON custom_users;

-- Drop all policies from site_settings table
DROP POLICY IF EXISTS "Custom admins can manage site settings" ON site_settings;
DROP POLICY IF EXISTS "Custom users can read site settings" ON site_settings;
DROP POLICY IF EXISTS "site_settings_delete_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_select_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_update_policy" ON site_settings;

-- Drop all policies from user_sessions table
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;

-- Drop all policies from whatsapp_message_templates table
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON whatsapp_message_templates;

-- Disable RLS on all tables
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE completed_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates DISABLE ROW LEVEL SECURITY;