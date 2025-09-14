
-- Verificar se a tabela generated_documents existe e criar se necessário
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  medical_record_id UUID,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'prontuario',
  attendance_start_at TIMESTAMP WITH TIME ZONE,
  attendance_end_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE,
  shared_via TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar foreign keys se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'generated_documents_patient_id_fkey'
  ) THEN
    ALTER TABLE public.generated_documents 
    ADD CONSTRAINT generated_documents_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES public.patients(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'generated_documents_professional_id_fkey'
  ) THEN
    ALTER TABLE public.generated_documents 
    ADD CONSTRAINT generated_documents_professional_id_fkey 
    FOREIGN KEY (professional_id) REFERENCES public.professionals(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'generated_documents_medical_record_id_fkey'
  ) THEN
    ALTER TABLE public.generated_documents 
    ADD CONSTRAINT generated_documents_medical_record_id_fkey 
    FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(id);
  END IF;
END $$;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_documents' AND policyname = 'Allow all access to generated_documents'
  ) THEN
    CREATE POLICY "Allow all access to generated_documents" 
    ON public.generated_documents 
    FOR ALL 
    USING (true);
  END IF;
END $$;
