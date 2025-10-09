-- Criar índices para otimizar queries de agendamentos
-- Índice composto para verificação de conflitos (attendant_id + appointment_date)
CREATE INDEX IF NOT EXISTS idx_appointments_attendant_date 
ON public.appointments (attendant_id, appointment_date);

-- Índice para filtros de status
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON public.appointments (status);

-- Índice para appointment_datetime (usado em ordenações)
CREATE INDEX IF NOT EXISTS idx_appointments_datetime 
ON public.appointments (appointment_datetime);

-- Índice para patient_id (usado em joins e filtros)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
ON public.appointments (patient_id);

-- Comentários explicativos
COMMENT ON INDEX idx_appointments_attendant_date IS 'Otimiza verificação de conflitos de horários';
COMMENT ON INDEX idx_appointments_status IS 'Otimiza filtros por status';
COMMENT ON INDEX idx_appointments_datetime IS 'Otimiza ordenação por data/hora';
COMMENT ON INDEX idx_appointments_patient_id IS 'Otimiza joins com tabela patients';