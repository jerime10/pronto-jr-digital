-- Script para criar dados de teste
-- Inserir paciente de teste
INSERT INTO patients (id, name, sus, phone, address, gender, date_of_birth, age) 
VALUES (
  gen_random_uuid(),
  'João Silva',
  '123456789012345',
  '(11) 99999-9999',
  'Rua das Flores, 123 - São Paulo, SP',
  'masculino',
  '1985-05-15',
  39
) ON CONFLICT (sus) DO NOTHING;

-- Inserir profissional de teste se não existir
INSERT INTO professionals (id, name, specialty, crm, email, phone) 
VALUES (
  gen_random_uuid(),
  'Dr. Maria Santos',
  'Clínico Geral',
  'CRM-SP 123456',
  'maria.santos@clinica.com',
  '(11) 88888-8888'
) ON CONFLICT (crm) DO NOTHING;

-- Inserir agendamento de teste
INSERT INTO appointments (
  id,
  patient_id,
  patient_name,
  patient_phone,
  professional_id,
  service_description,
  appointment_date,
  appointment_time,
  appointment_datetime,
  status,
  notes
) 
SELECT 
  gen_random_uuid(),
  p.id,
  p.name,
  p.phone,
  pr.id,
  'Consulta Médica',
  CURRENT_DATE,
  '14:00:00',
  CURRENT_DATE + INTERVAL '14 hours',
  'scheduled',
  'Agendamento de teste para debug'
FROM patients p, professionals pr 
WHERE p.name = 'João Silva' 
  AND pr.name = 'Dr. Maria Santos'
LIMIT 1;