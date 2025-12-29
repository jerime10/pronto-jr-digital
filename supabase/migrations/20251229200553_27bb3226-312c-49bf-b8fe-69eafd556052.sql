-- Criar função para exclusão de pacientes que bypassa RLS
CREATE OR REPLACE FUNCTION public.delete_patient_by_id(patient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.patients WHERE id = patient_id;
  RETURN FOUND;
END;
$$;