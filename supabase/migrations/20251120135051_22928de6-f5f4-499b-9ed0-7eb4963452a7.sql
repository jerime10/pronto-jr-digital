-- Enable RLS on exam_models (já estava habilitado, mas vamos garantir políticas corretas)
-- Primeiro, remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Allow authenticated access to exam_models" ON exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to delete exam_models" ON exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to insert exam_models" ON exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to read exam_models" ON exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to update exam_models" ON exam_models;

-- Criar política simples e permissiva para exam_models
CREATE POLICY "exam_models_all_access"
ON exam_models
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS on medical_record_drafts (já estava habilitado, mas vamos garantir políticas corretas)
DROP POLICY IF EXISTS "Allow all access to medical_record_drafts" ON medical_record_drafts;

-- Criar política simples e permissiva para medical_record_drafts
CREATE POLICY "medical_record_drafts_all_access"
ON medical_record_drafts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS on modelo-result-exames (já estava habilitado, mas vamos garantir políticas corretas)
DROP POLICY IF EXISTS "Allow all access to completed_exams for auth" ON "modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to delete completed_exams" ON "modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to insert completed_exams" ON "modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to read completed_exams" ON "modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to update completed_exams" ON "modelo-result-exames";
DROP POLICY IF EXISTS "completed_exams_delete_policy" ON "modelo-result-exames";
DROP POLICY IF EXISTS "completed_exams_select_policy" ON "modelo-result-exames";
DROP POLICY IF EXISTS "completed_exams_update_policy" ON "modelo-result-exames";

-- Criar política simples e permissiva para modelo-result-exames
CREATE POLICY "modelo_result_exames_all_access"
ON "modelo-result-exames"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);