-- Corrigir RLS de medical_record_drafts para funcionar com cliente anon
-- Remover política anterior restrita a authenticated
DROP POLICY IF EXISTS "medical_record_drafts_authenticated_access" ON medical_record_drafts;

-- Criar política aberta para todas as roles (public = anon + authenticated)
CREATE POLICY "medical_record_drafts_all_access"
ON medical_record_drafts
FOR ALL
TO public
USING (true)
WITH CHECK (true);