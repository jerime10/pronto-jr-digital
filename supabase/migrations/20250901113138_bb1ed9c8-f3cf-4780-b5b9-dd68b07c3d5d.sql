-- Simplificar políticas RLS para permitir acesso completo a usuários autenticados
-- Remover políticas existentes e criar novas mais permissivas

-- Pacientes
DROP POLICY IF EXISTS patients_select_policy ON patients;
DROP POLICY IF EXISTS patients_insert_policy ON patients;
DROP POLICY IF EXISTS patients_update_policy ON patients;
DROP POLICY IF EXISTS patients_delete_policy ON patients;

CREATE POLICY patients_all_policy ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prescrições
DROP POLICY IF EXISTS prescription_models_select_policy ON prescription_models;
DROP POLICY IF EXISTS prescription_models_update_policy ON prescription_models;
DROP POLICY IF EXISTS prescription_models_delete_policy ON prescription_models;

CREATE POLICY prescription_models_all_policy ON prescription_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exames
DROP POLICY IF EXISTS exam_models_select_policy ON exam_models;
DROP POLICY IF EXISTS exam_models_update_policy ON exam_models;
DROP POLICY IF EXISTS exam_models_delete_policy ON exam_models;

CREATE POLICY exam_models_all_policy ON exam_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profissionais
DROP POLICY IF EXISTS professionals_select_policy ON professionals;
DROP POLICY IF EXISTS professionals_insert_policy ON professionals;
DROP POLICY IF EXISTS professionals_update_policy ON professionals;
DROP POLICY IF EXISTS professionals_delete_policy ON professionals;

CREATE POLICY professionals_all_policy ON professionals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Registros médicos
DROP POLICY IF EXISTS medical_records_select_policy ON medical_records;
DROP POLICY IF EXISTS medical_records_insert_policy ON medical_records;
DROP POLICY IF EXISTS medical_records_update_policy ON medical_records;
DROP POLICY IF EXISTS medical_records_delete_policy ON medical_records;

CREATE POLICY medical_records_all_policy ON medical_records FOR ALL TO authenticated USING (true) WITH CHECK (true);