-- Corrigir política RLS para medical_record_drafts
-- A política anterior não permitia INSERT/UPDATE corretamente

DROP POLICY IF EXISTS "medical_record_drafts_all_access" ON medical_record_drafts;

-- Criar política que permite usuários autenticados gerenciar rascunhos
-- Sem restrição por professional_id já que usamos autenticação custom
CREATE POLICY "medical_record_drafts_authenticated_access"
ON medical_record_drafts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);