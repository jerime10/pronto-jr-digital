-- Função para enviar lembrete WhatsApp via Edge Function
CREATE OR REPLACE FUNCTION send_whatsapp_reminder(
  p_appointment_id UUID,
  p_reminder_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
  v_payload JSONB;
  v_response JSONB;
BEGIN
  -- Buscar dados do agendamento
  SELECT 
    a.id,
    a.patient_name,
    a.patient_phone,
    a.appointment_date,
    a.appointment_time,
    a.service_name,
    a.attendant_name
  INTO v_appointment
  FROM appointments a
  WHERE a.id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found: %', p_appointment_id;
  END IF;

  -- Validar telefone
  IF v_appointment.patient_phone IS NULL OR v_appointment.patient_phone = '' THEN
    RAISE NOTICE 'No phone number for appointment: %', p_appointment_id;
    RETURN FALSE;
  END IF;

  -- Preparar payload
  v_payload := jsonb_build_object(
    'appointment_id', v_appointment.id::TEXT,
    'patient_name', COALESCE(v_appointment.patient_name, 'Paciente'),
    'patient_phone', v_appointment.patient_phone,
    'appointment_date', COALESCE(v_appointment.appointment_date, ''),
    'appointment_time', COALESCE(v_appointment.appointment_time, ''),
    'service_name', COALESCE(v_appointment.service_name, 'Consulta'),
    'attendant_name', COALESCE(v_appointment.attendant_name, 'Profissional'),
    'reminder_type', p_reminder_type
  );

  -- Chamar Edge Function
  PERFORM net.http_post(
    url := 'https://vtthxoovjswtrwfrdlha.supabase.co/functions/v1/whatsapp-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg'
    ),
    body := v_payload
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error sending WhatsApp reminder: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Trigger para enviar lembrete 15s após criação
CREATE OR REPLACE FUNCTION trigger_immediate_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Agendar envio para 15 segundos depois
  PERFORM pg_sleep(15);
  PERFORM send_whatsapp_reminder(NEW.id, '15s');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_immediate_whatsapp_reminder ON appointments;
CREATE TRIGGER send_immediate_whatsapp_reminder
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_immediate_reminder();

-- Trigger para lembrete 2 horas antes
CREATE OR REPLACE FUNCTION trigger_2h_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_datetime TIMESTAMP;
  v_now TIMESTAMP;
  v_time_until_2h INTERVAL;
BEGIN
  -- Calcular datetime do agendamento
  v_appointment_datetime := (NEW.appointment_date || ' ' || NEW.appointment_time)::TIMESTAMP;
  v_now := NOW();
  
  -- Calcular tempo até 2h antes
  v_time_until_2h := (v_appointment_datetime - INTERVAL '2 hours') - v_now;
  
  -- Se o tempo for positivo (agendamento no futuro)
  IF v_time_until_2h > INTERVAL '0' THEN
    -- Aguardar até 2h antes e enviar
    PERFORM pg_sleep(EXTRACT(EPOCH FROM v_time_until_2h));
    PERFORM send_whatsapp_reminder(NEW.id, '2h');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_2h_whatsapp_reminder ON appointments;
CREATE TRIGGER send_2h_whatsapp_reminder
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_2h_reminder();

-- Trigger para lembrete 30min antes
CREATE OR REPLACE FUNCTION trigger_30min_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_datetime TIMESTAMP;
  v_now TIMESTAMP;
  v_time_until_30min INTERVAL;
BEGIN
  -- Calcular datetime do agendamento
  v_appointment_datetime := (NEW.appointment_date || ' ' || NEW.appointment_time)::TIMESTAMP;
  v_now := NOW();
  
  -- Calcular tempo até 30min antes
  v_time_until_30min := (v_appointment_datetime - INTERVAL '30 minutes') - v_now;
  
  -- Se o tempo for positivo (agendamento no futuro)
  IF v_time_until_30min > INTERVAL '0' THEN
    -- Aguardar até 30min antes e enviar
    PERFORM pg_sleep(EXTRACT(EPOCH FROM v_time_until_30min));
    PERFORM send_whatsapp_reminder(NEW.id, '30min');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_30min_whatsapp_reminder ON appointments;
CREATE TRIGGER send_30min_whatsapp_reminder
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_30min_reminder();

-- Comentários para documentação
COMMENT ON FUNCTION send_whatsapp_reminder IS 'Envia lembrete WhatsApp via Edge Function para um agendamento específico';
COMMENT ON FUNCTION trigger_immediate_reminder IS 'Trigger que envia lembrete imediato 15s após criação do agendamento';
COMMENT ON FUNCTION trigger_2h_reminder IS 'Trigger que envia lembrete 2 horas antes do agendamento';
COMMENT ON FUNCTION trigger_30min_reminder IS 'Trigger que envia lembrete 30 minutos antes do agendamento';