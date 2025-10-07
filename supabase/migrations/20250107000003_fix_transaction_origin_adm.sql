-- Migração para corrigir origem das transações para usar 'ADM' quando agendamento é via administrador
-- Data: 2025-01-07
-- Descrição: Ajusta função update_transaction_origin e corrige transações existentes

-- 1. Atualizar a função update_transaction_origin para usar 'ADM'
CREATE OR REPLACE FUNCTION update_transaction_origin()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir origin baseado no appointment_id e partner_username
  IF NEW.appointment_id IS NOT NULL THEN
    -- Buscar o nome do parceiro se existir
    SELECT u.full_name INTO NEW.origin
    FROM appointments a 
    JOIN usuarios u ON a.partner_username = u.username 
    WHERE a.id = NEW.appointment_id 
    AND u.user_type = 'partner' 
    AND u.is_active = true
    LIMIT 1;
    
    -- Se não encontrou parceiro, verificar se há partner_username no agendamento
    IF NEW.origin IS NULL THEN
      -- Verificar se o agendamento tem partner_username
      DECLARE
        has_partner_username BOOLEAN := FALSE;
      BEGIN
        SELECT (partner_username IS NOT NULL) INTO has_partner_username
        FROM appointments 
        WHERE id = NEW.appointment_id;
        
        -- Se não tem partner_username, é agendamento via administrador
        IF NOT has_partner_username THEN
          NEW.origin := 'ADM';
        ELSE
          NEW.origin := 'Agendamento';
        END IF;
      END;
    END IF;
  ELSE
    NEW.origin := COALESCE(NEW.origin, 'Sistema');
  END IF;
  
  -- Definir type padrão se não especificado
  NEW.type := COALESCE(NEW.type, 'Entrada');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar transações existentes que têm appointment_id mas origin incorreto
UPDATE transactions 
SET origin = 'ADM'
WHERE appointment_id IS NOT NULL 
  AND origin IN ('Agendamento', 'Sistema')
  AND appointment_id IN (
    SELECT id 
    FROM appointments 
    WHERE partner_username IS NULL
  );

-- 3. Comentário para documentação
COMMENT ON FUNCTION update_transaction_origin() IS 'Função que define automaticamente a origem das transações: nome do parceiro, ADM (para agendamentos via administrador) ou Sistema';

-- 4. Verificação final
DO $$
BEGIN
  RAISE NOTICE 'Função update_transaction_origin atualizada para usar ADM quando agendamento é via administrador';
  RAISE NOTICE 'Transações existentes corrigidas para mostrar origem ADM quando apropriado';
END $$;