-- Habilitar RLS na tabela services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos serviços
CREATE POLICY "Allow public select for services"
ON services
FOR SELECT
USING (true);

-- Permitir inserção, atualização e exclusão apenas para usuários autenticados
CREATE POLICY "Allow all access to services for authenticated users"
ON services
FOR ALL
USING (true)
WITH CHECK (true);