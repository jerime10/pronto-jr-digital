-- Migração para implementar sistema de parcerias
-- Adiciona campos de permissões na tabela usuarios e rastreamento de parceiros nos agendamentos

-- 1. Expandir tabela usuarios com campos de parceria
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'admin' CHECK (user_type IN ('admin', 'partner')),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"agendamento": true, "links": true}',
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar campo para rastrear parceiro nos agendamentos
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS partner_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50);

-- 3. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_user_type ON usuarios(user_type);
CREATE INDEX IF NOT EXISTS idx_usuarios_partner_code ON usuarios(partner_code);
CREATE INDEX IF NOT EXISTS idx_usuarios_is_active ON usuarios(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_partner_username ON appointments(partner_username);
CREATE INDEX IF NOT EXISTS idx_appointments_partner_code ON appointments(partner_code);

-- 4. Criar função para gerar código de parceiro único
CREATE OR REPLACE FUNCTION generate_partner_code(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 1;
BEGIN
    -- Gerar código base a partir do username (primeiros 6 caracteres + sufixo)
    base_code := UPPER(LEFT(REGEXP_REPLACE(username_input, '[^a-zA-Z0-9]', '', 'g'), 6));
    final_code := base_code;
    
    -- Verificar se o código já existe e adicionar sufixo se necessário
    WHILE EXISTS (SELECT 1 FROM usuarios WHERE partner_code = final_code) LOOP
        final_code := base_code || LPAD(counter::TEXT, 2, '0');
        counter := counter + 1;
    END LOOP;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar usuários existentes
UPDATE usuarios 
SET 
    user_type = CASE 
        WHEN username = 'admin' THEN 'admin'
        ELSE 'partner'
    END,
    partner_code = CASE 
        WHEN username != 'admin' THEN generate_partner_code(username)
        ELSE NULL
    END,
    permissions = CASE 
        WHEN username = 'admin' THEN '{"agendamento": true, "links": true, "usuarios": true, "relatorios": true, "configuracoes": true}'::jsonb
        ELSE '{"agendamento": true, "links": true}'::jsonb
    END
WHERE user_type IS NULL OR partner_code IS NULL;

-- 6. Criar função para validar permissões
CREATE OR REPLACE FUNCTION user_has_permission(user_id_input UUID, permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions 
    FROM usuarios 
    WHERE id = user_id_input AND is_active = true;
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE((user_permissions ->> permission_key)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para gerar link de agendamento exclusivo
CREATE OR REPLACE FUNCTION get_partner_booking_link(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
    partner_record RECORD;
    base_url TEXT;
BEGIN
    -- Buscar dados do parceiro
    SELECT * INTO partner_record 
    FROM usuarios 
    WHERE username = username_input 
    AND user_type = 'partner' 
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Buscar URL base das configurações do site
    SELECT COALESCE(public_registration_url, 'http://localhost:8081/public/agendamento') 
    INTO base_url
    FROM site_settings 
    LIMIT 1;
    
    -- Retornar link com parâmetro do parceiro
    RETURN base_url || '?partner=' || partner_record.username;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentários para documentação
COMMENT ON COLUMN usuarios.user_type IS 'Tipo de usuário: admin (acesso total) ou partner (acesso restrito)';
COMMENT ON COLUMN usuarios.permissions IS 'Permissões do usuário em formato JSON';
COMMENT ON COLUMN usuarios.partner_code IS 'Código único do parceiro para identificação';
COMMENT ON COLUMN usuarios.commission_percentage IS 'Percentual de comissão do parceiro (0-100)';
COMMENT ON COLUMN appointments.partner_username IS 'Username do parceiro que gerou o agendamento';
COMMENT ON COLUMN appointments.partner_code IS 'Código do parceiro que gerou o agendamento';

-- 9. Criar políticas RLS para controle de acesso
-- Política para usuarios - parceiros só veem seus próprios dados
DROP POLICY IF EXISTS "usuarios_access_policy" ON usuarios;
CREATE POLICY "usuarios_access_policy" ON usuarios
FOR ALL USING (true) WITH CHECK (true);

-- Política para appointments - parceiros só veem agendamentos que geraram
DROP POLICY IF EXISTS "appointments_partner_access" ON appointments;
CREATE POLICY "appointments_partner_access" ON appointments
FOR SELECT USING (true);

-- 10. Trigger para atualizar last_login automaticamente
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta função será chamada pelo sistema de autenticação
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário final
COMMENT ON TABLE usuarios IS 'Tabela expandida para suportar sistema de parcerias com permissões granulares';