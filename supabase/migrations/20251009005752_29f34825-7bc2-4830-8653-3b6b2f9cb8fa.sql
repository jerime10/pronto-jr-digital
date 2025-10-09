-- Criar função para inserir agendamento com timeout aumentado
CREATE OR REPLACE FUNCTION insert_appointment(
  p_patient_name TEXT,
  p_patient_phone TEXT,
  p_patient_id UUID,
  p_attendant_id UUID,
  p_attendant_name TEXT,
  p_service_id UUID,
  p_service_name TEXT,
  p_service_price NUMERIC,
  p_service_duration INTEGER,
  p_appointment_date TEXT,
  p_appointment_time TEXT,
  p_appointment_datetime TEXT,
  p_end_time TEXT,
  p_notes TEXT,
  p_status TEXT,
  p_dum DATE,
  p_gestational_age TEXT,
  p_estimated_due_date DATE,
  p_partner_username VARCHAR,
  p_partner_code VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    partner_code
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
    p_partner_code
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
$$;