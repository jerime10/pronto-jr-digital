-- Corrigir políticas RLS da tabela medical_record_drafts para funcionar com autenticação customizada
-- Drop política antiga que exige autenticação nativa do Supabase
DROP POLICY IF EXISTS "medical_record_drafts_all_access" ON public.medical_record_drafts;

-- Criar novas políticas públicas para permitir acesso via anon key (usado pelo sistema de auth customizado)
CREATE POLICY "medical_record_drafts_public_select"
ON public.medical_record_drafts
FOR SELECT
TO public
USING (true);

CREATE POLICY "medical_record_drafts_public_insert"
ON public.medical_record_drafts
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "medical_record_drafts_public_update"
ON public.medical_record_drafts
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "medical_record_drafts_public_delete"
ON public.medical_record_drafts
FOR DELETE
TO public
USING (true);