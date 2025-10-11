-- Criar trigger para gerar partner_code automaticamente
CREATE OR REPLACE FUNCTION auto_generate_partner_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário é do tipo partner e não tem partner_code
  IF NEW.user_type = 'partner' AND (NEW.partner_code IS NULL OR NEW.partner_code = '') THEN
    -- Gera o partner_code usando a função existente
    NEW.partner_code := generate_partner_code(NEW.username);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que dispara antes de inserir um novo usuário
DROP TRIGGER IF EXISTS trigger_auto_generate_partner_code ON usuarios;
CREATE TRIGGER trigger_auto_generate_partner_code
  BEFORE INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_partner_code();

-- Atualizar usuários existentes que são parceiros mas não têm partner_code
UPDATE usuarios 
SET partner_code = generate_partner_code(username)
WHERE user_type = 'partner' 
  AND (partner_code IS NULL OR partner_code = '');