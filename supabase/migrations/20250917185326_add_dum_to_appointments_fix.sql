-- Garantir que a coluna DUM existe na tabela appointments
-- Esta migração é idempotente e só adiciona a coluna se ela não existir

DO $$ 
BEGIN
    -- Verificar se a coluna dum já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'dum'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna dum
        ALTER TABLE public.appointments ADD COLUMN dum DATE;
        
        -- Adicionar comentário para documentar o propósito da coluna
        COMMENT ON COLUMN public.appointments.dum IS 'Data da Última Menstruação - usado para calcular Idade Gestacional e Data Provável do Parto em serviços obstétricos';
        
        -- Criar índice para otimizar consultas que filtram por DUM
        CREATE INDEX IF NOT EXISTS idx_appointments_dum ON public.appointments(dum) WHERE dum IS NOT NULL;
        
        RAISE NOTICE 'Coluna dum adicionada à tabela appointments com sucesso';
    ELSE
        RAISE NOTICE 'Coluna dum já existe na tabela appointments';
    END IF;
END $$;