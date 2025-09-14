-- Habilitar RLS para TODAS as tabelas restantes no schema public
-- Isso deve resolver todos os erros "RLS Disabled in Public"

-- Verificar e habilitar RLS para todas as tabelas
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS habilitado para tabela: %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao habilitar RLS para %: %', table_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Criar políticas básicas para tabelas que ainda não têm políticas
-- (para resolver erros "RLS Enabled No Policy")

-- Para completed_exams (se não tiver política ainda)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'completed_exams' 
        AND policyname = 'Allow all access to completed_exams for auth'
    ) THEN
        CREATE POLICY "Allow all access to completed_exams for auth" 
        ON public.completed_exams 
        FOR ALL TO authenticated USING (true);
    END IF;
END;
$$;

-- Para prescription_models (se não tiver política ainda)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prescription_models' 
        AND policyname = 'Allow all access to prescription_models for auth'
    ) THEN
        CREATE POLICY "Allow all access to prescription_models for auth" 
        ON public.prescription_models 
        FOR ALL TO authenticated USING (true);
    END IF;
END;
$$;

-- Para exam_models (se não tiver política ainda)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'exam_models' 
        AND policyname = 'Allow all access to exam_models for auth'
    ) THEN
        CREATE POLICY "Allow all access to exam_models for auth" 
        ON public.exam_models 
        FOR ALL TO authenticated USING (true);
    END IF;
END;
$$;

-- Para whatsapp_message_templates (se não tiver política ainda)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_message_templates' 
        AND policyname = 'Allow all access to whatsapp_message_templates for auth'
    ) THEN
        CREATE POLICY "Allow all access to whatsapp_message_templates for auth" 
        ON public.whatsapp_message_templates 
        FOR ALL TO authenticated USING (true);
    END IF;
END;
$$;