-- Verificar e corrigir dados inconsistentes na tabela transactions
-- Se houver dados com status = 'Entrada', corrigir para 'Pendente'
UPDATE public.transactions 
SET status = 'Pendente' 
WHERE status = 'Entrada';

-- Verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;