-- Adicionar campos origin e type à tabela transactions
-- Data: 2025-01-07

-- Adicionar coluna origin (origem da transação)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS origin VARCHAR(255) DEFAULT 'Sistema';

-- Adicionar coluna type (tipo da transação: Entrada ou Saída)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'Entrada' 
CHECK (type IN ('Entrada', 'Saída'));

-- Atualizar transações existentes com valores padrão
UPDATE public.transactions 
SET origin = 'Sistema', type = 'Entrada' 
WHERE origin IS NULL OR type IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.transactions.origin IS 'Origem da transação (Sistema, Administrador, Parceiro, etc.)';
COMMENT ON COLUMN public.transactions.type IS 'Tipo da transação: Entrada (receita) ou Saída (despesa)';

-- Criar índice para melhorar performance nas consultas por tipo
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Criar índice para melhorar performance nas consultas por origem
CREATE INDEX IF NOT EXISTS idx_transactions_origin ON public.transactions(origin);