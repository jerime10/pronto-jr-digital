-- Adicionar campo título aos rascunhos para permitir múltiplos rascunhos por paciente/profissional
ALTER TABLE public.medical_record_drafts 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Rascunho sem título';

-- Criar índice para melhorar performance de buscas por paciente e profissional
CREATE INDEX IF NOT EXISTS idx_medical_record_drafts_patient_professional 
ON public.medical_record_drafts(patient_id, professional_id, created_at DESC);