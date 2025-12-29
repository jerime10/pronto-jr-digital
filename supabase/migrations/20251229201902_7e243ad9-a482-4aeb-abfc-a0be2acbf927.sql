-- Speed up draft listing by professional (fix 57014 statement timeout)
CREATE INDEX IF NOT EXISTS idx_medical_record_drafts_professional_updated_at
ON public.medical_record_drafts (professional_id, updated_at DESC);

ANALYZE public.medical_record_drafts;