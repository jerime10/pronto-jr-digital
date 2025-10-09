-- Remover policies existentes de UPDATE
DROP POLICY IF EXISTS "Allow authenticated update for appointments" ON appointments;

-- Criar nova policy de UPDATE que aceita tanto autenticação como acesso público
CREATE POLICY "Allow all updates for appointments"
ON appointments FOR UPDATE
USING (true)
WITH CHECK (true);