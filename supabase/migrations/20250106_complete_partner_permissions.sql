-- Migração: Sistema Completo de Permissões para Parceiros
-- Data: 2025-01-06
-- Descrição: Define todas as permissões granulares para controlar acesso de usuários parceiros

-- 1. Atualizar estrutura de permissões com todas as funcionalidades do sistema
UPDATE usuarios 
SET permissions = jsonb_build_object(
  -- Funcionalidades principais do menu
  'dashboard', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  'pacientes', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'prescricoes', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'exames', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'atendimento', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'historico_atendimentos', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  -- Sistema de agendamento
  'agendamentos', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  'atendentes', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'horarios', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'servicos', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'financeiro', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  -- Funcionalidades administrativas
  'configuracoes', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'usuarios', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  -- Funcionalidades específicas de parceiros
  'links', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  'relatorios', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  -- Permissões granulares dentro de cada módulo
  'pacientes_criar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'pacientes_editar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'pacientes_excluir', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'pacientes_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  'prescricoes_criar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'prescricoes_editar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'prescricoes_excluir', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'prescricoes_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  'exames_criar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'exames_editar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'exames_excluir', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'exames_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  'atendimento_criar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'atendimento_editar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'atendimento_excluir', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'atendimento_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  'agendamentos_criar', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  'agendamentos_editar', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  'agendamentos_excluir', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'agendamentos_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE true END,
  
  'financeiro_visualizar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  'financeiro_editar', CASE WHEN user_type = 'admin' THEN true ELSE false END,
  
  -- Permissões específicas para parceiros
  'partner_dashboard', CASE WHEN user_type = 'partner' THEN true ELSE false END,
  'partner_links', CASE WHEN user_type = 'partner' THEN true ELSE false END,
  'partner_agendamentos_proprios', CASE WHEN user_type = 'partner' THEN true ELSE false END,
  'partner_relatorios_proprios', CASE WHEN user_type = 'partner' THEN true ELSE false END
)
WHERE user_type IN ('admin', 'partner');

-- 2. Criar função para verificar permissões específicas de parceiros
CREATE OR REPLACE FUNCTION check_partner_permission(
  user_id_input UUID,
  permission_key TEXT,
  resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Buscar dados do usuário
    SELECT user_type, permissions, partner_code, is_active 
    INTO user_record
    FROM usuarios 
    WHERE id = user_id_input AND is_active = true;
    
    -- Se usuário não encontrado ou inativo
    IF user_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Admin tem todas as permissões
    IF user_record.user_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permissão básica
    has_permission := COALESCE((user_record.permissions ->> permission_key)::BOOLEAN, FALSE);
    
    -- Para parceiros, verificar permissões específicas
    IF user_record.user_type = 'partner' THEN
        -- Verificar se é uma permissão específica de parceiro
        CASE permission_key
            WHEN 'agendamentos_visualizar' THEN
                -- Parceiro pode ver apenas agendamentos relacionados a ele
                IF resource_id IS NOT NULL THEN
                    SELECT EXISTS(
                        SELECT 1 FROM appointments 
                        WHERE id = resource_id 
                        AND partner_code = user_record.partner_code
                    ) INTO has_permission;
                ELSE
                    has_permission := COALESCE((user_record.permissions ->> 'agendamentos')::BOOLEAN, FALSE);
                END IF;
            
            WHEN 'financeiro_visualizar' THEN
                -- Parceiro pode ver apenas seus próprios dados financeiros
                has_permission := COALESCE((user_record.permissions ->> 'partner_relatorios_proprios')::BOOLEAN, FALSE);
            
            ELSE
                -- Para outras permissões, usar verificação padrão
                has_permission := COALESCE((user_record.permissions ->> permission_key)::BOOLEAN, FALSE);
        END CASE;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_input UUID)
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
    user_type_val TEXT;
BEGIN
    SELECT permissions, user_type 
    INTO user_permissions, user_type_val
    FROM usuarios 
    WHERE id = user_id_input AND is_active = true;
    
    IF user_permissions IS NULL THEN
        RETURN '{}'::JSONB;
    END IF;
    
    -- Adicionar informações de contexto
    user_permissions := user_permissions || jsonb_build_object(
        'user_type', user_type_val,
        'is_admin', user_type_val = 'admin',
        'is_partner', user_type_val = 'partner'
    );
    
    RETURN user_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar função para atualizar permissões de um usuário
CREATE OR REPLACE FUNCTION update_user_permissions(
    user_id_input UUID,
    new_permissions JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE usuarios 
    SET permissions = new_permissions,
        updated_at = NOW()
    WHERE id = user_id_input;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar view para facilitar consultas de permissões
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.user_type,
    u.partner_code,
    u.is_active,
    u.permissions,
    -- Extrair permissões principais
    COALESCE((u.permissions ->> 'dashboard')::BOOLEAN, FALSE) as can_access_dashboard,
    COALESCE((u.permissions ->> 'pacientes')::BOOLEAN, FALSE) as can_access_pacientes,
    COALESCE((u.permissions ->> 'prescricoes')::BOOLEAN, FALSE) as can_access_prescricoes,
    COALESCE((u.permissions ->> 'exames')::BOOLEAN, FALSE) as can_access_exames,
    COALESCE((u.permissions ->> 'atendimento')::BOOLEAN, FALSE) as can_access_atendimento,
    COALESCE((u.permissions ->> 'agendamentos')::BOOLEAN, FALSE) as can_access_agendamentos,
    COALESCE((u.permissions ->> 'financeiro')::BOOLEAN, FALSE) as can_access_financeiro,
    COALESCE((u.permissions ->> 'configuracoes')::BOOLEAN, FALSE) as can_access_configuracoes,
    COALESCE((u.permissions ->> 'usuarios')::BOOLEAN, FALSE) as can_access_usuarios,
    -- Permissões específicas de parceiros
    COALESCE((u.permissions ->> 'partner_links')::BOOLEAN, FALSE) as can_access_partner_links,
    COALESCE((u.permissions ->> 'partner_dashboard')::BOOLEAN, FALSE) as can_access_partner_dashboard
FROM usuarios u
WHERE u.is_active = true;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_permissions_gin ON usuarios USING GIN (permissions);
CREATE INDEX IF NOT EXISTS idx_usuarios_user_type ON usuarios (user_type) WHERE is_active = true;

-- 7. Comentários para documentação
COMMENT ON FUNCTION check_partner_permission IS 'Verifica permissões específicas considerando o tipo de usuário e contexto';
COMMENT ON FUNCTION get_user_permissions IS 'Retorna todas as permissões de um usuário com informações de contexto';
COMMENT ON FUNCTION update_user_permissions IS 'Atualiza as permissões de um usuário específico';
COMMENT ON VIEW user_permissions_view IS 'View para facilitar consultas de permissões dos usuários';

-- 8. Inserir log da migração
INSERT INTO public.migration_logs (migration_name, executed_at, description) 
VALUES (
    '20250106_complete_partner_permissions',
    NOW(),
    'Sistema completo de permissões para usuários parceiros com controle granular de acesso'
) ON CONFLICT (migration_name) DO NOTHING;