-- Adicionar coluna created_by_user_id na tabela appointments se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN created_by_user_id UUID NULL;
  END IF;
END $$;

-- Recriar a função insert_appointment com o novo parâmetro
CREATE OR REPLACE FUNCTION public.insert_appointment(
  p_patient_name text, 
  p_patient_phone text, 
  p_patient_id uuid, 
  p_attendant_id uuid, 
  p_attendant_name text, 
  p_service_id uuid, 
  p_service_name text, 
  p_service_price numeric, 
  p_service_duration integer, 
  p_appointment_date text, 
  p_appointment_time text, 
  p_appointment_datetime text, 
  p_end_time text, 
  p_notes text, 
  p_status text, 
  p_dum date, 
  p_gestational_age text, 
  p_estimated_due_date date, 
  p_partner_username character varying, 
  p_partner_code character varying,
  p_created_by_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_appointment_id UUID;
  v_old_timeout TEXT;
BEGIN
  -- Salvar timeout atual
  SELECT current_setting('statement_timeout') INTO v_old_timeout;
  
  -- Aumentar timeout para 60 segundos
  PERFORM set_config('statement_timeout', '60000', true);
  
  -- Inserir agendamento
  INSERT INTO public.appointments (
    patient_name,
    patient_phone,
    patient_id,
    attendant_id,
    attendant_name,
    service_id,
    service_name,
    service_price,
    service_duration,
    appointment_date,
    appointment_time,
    appointment_datetime,
    end_time,
    notes,
    status,
    dum,
    gestational_age,
    estimated_due_date,
    partner_username,
    partner_code,
    created_by_user_id
  ) VALUES (
    p_patient_name,
    p_patient_phone,
    p_patient_id,
    p_attendant_id,
    p_attendant_name,
    p_service_id,
    p_service_name,
    p_service_price,
    p_service_duration,
    p_appointment_date,
    p_appointment_time,
    p_appointment_datetime,
    p_end_time,
    p_notes,
    p_status,
    p_dum,
    p_gestational_age,
    p_estimated_due_date,
    p_partner_username,
    p_partner_code,
    p_created_by_user_id
  )
  RETURNING id INTO v_appointment_id;
  
  -- Restaurar timeout original
  PERFORM set_config('statement_timeout', v_old_timeout, true);
  
  RETURN v_appointment_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Restaurar timeout em caso de erro
    PERFORM set_config('statement_timeout', v_old_timeout, true);
    RAISE;
END;
$function$;