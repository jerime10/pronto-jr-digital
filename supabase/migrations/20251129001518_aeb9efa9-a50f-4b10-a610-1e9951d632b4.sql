-- Drop old authenticated-only policies and create public access policies
-- These tables need to be accessible without native Supabase auth since the system uses custom authentication

-- Drop old exam_models policies
DROP POLICY IF EXISTS "Allow authenticated users to read exam_models" ON public.exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to insert exam_models" ON public.exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to update exam_models" ON public.exam_models;
DROP POLICY IF EXISTS "Allow authenticated users to delete exam_models" ON public.exam_models;

-- Create new public policies for exam_models
CREATE POLICY "exam_models_public_select"
ON public.exam_models
FOR SELECT
TO public
USING (true);

CREATE POLICY "exam_models_public_insert"
ON public.exam_models
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "exam_models_public_update"
ON public.exam_models
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "exam_models_public_delete"
ON public.exam_models
FOR DELETE
TO public
USING (true);

-- Drop old modelo-result-exames policies
DROP POLICY IF EXISTS "Allow authenticated users to read modelo_result_exames" ON public."modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to insert modelo_result_exames" ON public."modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to update modelo_result_exames" ON public."modelo-result-exames";
DROP POLICY IF EXISTS "Allow authenticated users to delete modelo_result_exames" ON public."modelo-result-exames";

-- Create new public policies for modelo-result-exames
CREATE POLICY "modelo_result_exames_public_select"
ON public."modelo-result-exames"
FOR SELECT
TO public
USING (true);

CREATE POLICY "modelo_result_exames_public_insert"
ON public."modelo-result-exames"
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "modelo_result_exames_public_update"
ON public."modelo-result-exames"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "modelo_result_exames_public_delete"
ON public."modelo-result-exames"
FOR DELETE
TO public
USING (true);