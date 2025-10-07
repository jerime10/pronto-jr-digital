-- Migração: Correção completa da descrição das transações
-- Data: 2025-01-07
-- Descrição: Remove completamente o prefixo "Pagamento do serviço:" e caracteres residuais

-- 1. Corrigir a função para usar apenas o nome do serviço (sem prefixo)
CREATE OR REPLACE FUNCTION create_transaction_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o status mudou para 'completed' ou 'atendimento_finalizado'
  IF (NEW.status = 'completed' OR NEW.status = 'atendimento_finalizado') 
     AND (OLD.status IS NULL OR (OLD.status != 'completed' AND OLD.status != 'atendimento_finalizado')) THEN
    
    -- Inserir nova transação com descrição apenas do nome do serviço
    INSERT INTO public.transactions (
      appointment_id,
      transaction_date,
      type,
      description,
      amount,
      status,
      payment_method
    ) VALUES (
      NEW.id,
      NEW.updated_at,
      'Entrada',
      COALESCE(NEW.service_name, 'Serviço não especificado'), -- Apenas o nome do serviço
      COALESCE(NEW.service_price, 0),
      'Pendente',
      'cash'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar transações existentes - Método preciso para remover todos os caracteres residuais
UPDATE public.transactions 
SET description = CASE 
    -- Se começa com "Pagamento do serviço: ", remove completamente
    WHEN description LIKE 'Pagamento do serviço: %' THEN 
        TRIM(SUBSTRING(description FROM 21)) -- Remove "Pagamento do serviço: " (20 chars + espaço)
    -- Se começa com "o: " (caracteres residuais), remove
    WHEN description LIKE 'o: %' THEN 
        TRIM(SUBSTRING(description FROM 4)) -- Remove "o: " (3 chars)
    -- Se começa apenas com ": ", remove
    WHEN description LIKE ': %' THEN 
        TRIM(SUBSTRING(description FROM 3)) -- Remove ": " (2 chars)
    -- Se começa apenas com "o:", remove
    WHEN description LIKE 'o:%' THEN 
        TRIM(SUBSTRING(description FROM 3)) -- Remove "o:" (2 chars)
    ELSE description
END
WHERE description LIKE '%Pagamento do serviço%' 
   OR description LIKE 'o:%'
   OR description LIKE ': %';

-- 3. Limpeza adicional para casos específicos
UPDATE public.transactions 
SET description = TRIM(description)
WHERE description LIKE ' %' OR description LIKE '% ';

-- 4. Comentário sobre a correção
COMMENT ON FUNCTION create_transaction_from_appointment() IS 
'Função corrigida para criar transações com descrição limpa (apenas nome do serviço, sem prefixos)';