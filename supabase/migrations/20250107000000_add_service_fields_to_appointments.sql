-- Adicionar campos service_name e service_price à tabela appointments
-- Data: 2025-01-07
-- Descrição: Adicionar campos necessários para o sistema de transações

-- 1. Adicionar campos service_name e service_price à tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS service_price DECIMAL(10,2);

-- 2. Atualizar registros existentes com dados dos serviços
UPDATE public.appointments 
SET 
  service_name = services.name,
  service_price = services.price
FROM public.services 
WHERE appointments.service_id = services.id 
AND (appointments.service_name IS NULL OR appointments.service_price IS NULL);

-- 3. Recriar o trigger para criar transação automaticamente quando agendamento for finalizado
DROP TRIGGER IF EXISTS trigger_create_transaction_on_completion ON public.appointments;
DROP FUNCTION IF EXISTS create_transaction_on_appointment_completion();

CREATE OR REPLACE FUNCTION create_transaction_on_appointment_completion()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
  transaction_origin VARCHAR(100);
BEGIN
  -- Verificar se o status mudou para 'completed' (finalizado)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Buscar informações do usuário para determinar a origem
    SELECT u.name, u.user_type 
    INTO user_profile
    FROM usuarios u
    JOIN attendants a ON a.user_id = u.id
    WHERE a.id = NEW.attendant_id;
    
    -- Determinar a origem baseada no tipo de usuário
    IF user_profile.user_type = 'admin' THEN
      transaction_origin := 'Admin: ' || COALESCE(user_profile.name, 'Administrador');
    ELSIF user_profile.user_type = 'partner' THEN
      transaction_origin := 'Parceiro: ' || COALESCE(user_profile.name, 'Parceiro');
    ELSE
      transaction_origin := COALESCE(user_profile.name, 'Sistema');
    END IF;
    
    -- Se não encontrou o usuário, usar 'Sistema'
    IF user_profile IS NULL THEN
      transaction_origin := 'Sistema';
    END IF;
    
    -- Inserir nova transação
    INSERT INTO public.transactions (
      appointment_id,
      transaction_date,
      type,
      description,
      value,
      status,
      origin
    ) VALUES (
      NEW.id,
      NEW.updated_at,
      'Entrada',
      COALESCE(NEW.service_name, 'Serviço não especificado'),
      COALESCE(NEW.service_price, 0),
      'Pendente',
      transaction_origin
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER trigger_create_transaction_on_completion
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_on_appointment_completion();

-- 4. Criar trigger para atualizar service_name e service_price quando service_id mudar
CREATE OR REPLACE FUNCTION update_appointment_service_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Se service_id mudou, atualizar service_name e service_price
  IF NEW.service_id IS DISTINCT FROM OLD.service_id AND NEW.service_id IS NOT NULL THEN
    SELECT name, price 
    INTO NEW.service_name, NEW.service_price
    FROM public.services 
    WHERE id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_service_info
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_service_info();

-- 5. Criar trigger para definir service_name e service_price na inserção
CREATE OR REPLACE FUNCTION set_appointment_service_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Se service_id está definido, buscar name e price
  IF NEW.service_id IS NOT NULL THEN
    SELECT name, price 
    INTO NEW.service_name, NEW.service_price
    FROM public.services 
    WHERE id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_service_info
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_service_info();