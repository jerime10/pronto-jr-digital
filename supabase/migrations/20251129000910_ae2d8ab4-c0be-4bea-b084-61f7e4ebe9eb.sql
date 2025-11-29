-- Add RLS policies for exam_models and modelo-result-exames
-- These tables need policies to allow authenticated users to read data

-- Policy for exam_models (used in Solicitar Exames)
CREATE POLICY "Allow authenticated users to read exam_models"
ON public.exam_models
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert exam_models"
ON public.exam_models
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update exam_models"
ON public.exam_models
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete exam_models"
ON public.exam_models
FOR DELETE
TO authenticated
USING (true);

-- Policy for modelo-result-exames (used in Resultados de Exames)
CREATE POLICY "Allow authenticated users to read modelo_result_exames"
ON public."modelo-result-exames"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert modelo_result_exames"
ON public."modelo-result-exames"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update modelo_result_exames"
ON public."modelo-result-exames"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete modelo_result_exames"
ON public."modelo-result-exames"
FOR DELETE
TO authenticated
USING (true);