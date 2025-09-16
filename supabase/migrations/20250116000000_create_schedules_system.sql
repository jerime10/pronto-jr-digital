-- ============================================
-- MIGRAÇÃO: SISTEMA DE HORÁRIOS COMPLETO
-- Data: 2025-01-16
-- Descrição: Criação das tabelas para gerenciamento de horários e agendamentos
-- ============================================

-- 1. Criar tabela de horários base (schedules)
-- Esta tabela define os horários de trabalho padrão dos atendentes
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que start_time < end_time
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    
    -- Constraint para evitar duplicatas de horário para o mesmo atendente/dia
    CONSTRAINT unique_attendant_day UNIQUE (attendant_id, day_of_week, start_time, end_time)
);

-- 2. Criar tabela de atribuições de horário (schedule_assignments)
-- Esta tabela permite horários específicos e exceções
CREATE TABLE IF NOT EXISTS schedule_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    specific_date DATE, -- Para horários específicos (opcional)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    schedule_info TEXT, -- Informações adicionais sobre o horário
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que start_time < end_time
    CONSTRAINT valid_assignment_time_range CHECK (start_time < end_time)
);

-- 3. Criar tabela de agendamentos (appointments)
-- Esta tabela armazena os agendamentos efetivos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    patient_name VARCHAR(255), -- Nome do paciente para casos onde patient_id é NULL
    patient_phone VARCHAR(20), -- Telefone do paciente para contato
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir que start_time < end_time
    CONSTRAINT valid_appointment_time_range CHECK (start_time < end_time),
    
    -- Constraint para garantir que pelo menos patient_id ou patient_name esteja preenchido
    CONSTRAINT patient_info_required CHECK (
        patient_id IS NOT NULL OR 
        (patient_name IS NOT NULL AND patient_name != '')
    )
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para tabela schedules
CREATE INDEX IF NOT EXISTS idx_schedules_attendant ON schedules(attendant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_attendant_day_active 
    ON schedules(attendant_id, day_of_week, is_active) 
    WHERE is_active = true;

-- Índices para tabela schedule_assignments
CREATE INDEX IF NOT EXISTS idx_assignments_attendant ON schedule_assignments(attendant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_service ON schedule_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_assignments_schedule ON schedule_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON schedule_assignments(specific_date);
CREATE INDEX IF NOT EXISTS idx_assignments_available ON schedule_assignments(is_available);
CREATE INDEX IF NOT EXISTS idx_assignments_attendant_date 
    ON schedule_assignments(attendant_id, specific_date) 
    WHERE specific_date IS NOT NULL;

-- Índices para tabela appointments
CREATE INDEX IF NOT EXISTS idx_appointments_attendant ON appointments(attendant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_attendant_date 
    ON appointments(attendant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_active_status 
    ON appointments(status) 
    WHERE status IN ('scheduled', 'confirmed');

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela schedules
CREATE POLICY "Allow read schedules for authenticated users" ON schedules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert schedules for authenticated users" ON schedules
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update schedules for authenticated users" ON schedules
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete schedules for authenticated users" ON schedules
    FOR DELETE TO authenticated USING (true);

-- Políticas para tabela schedule_assignments
CREATE POLICY "Allow read assignments for authenticated users" ON schedule_assignments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert assignments for authenticated users" ON schedule_assignments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update assignments for authenticated users" ON schedule_assignments
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete assignments for authenticated users" ON schedule_assignments
    FOR DELETE TO authenticated USING (true);

-- Políticas para tabela appointments
CREATE POLICY "Allow read appointments for authenticated users" ON appointments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert appointments for authenticated users" ON appointments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update appointments for authenticated users" ON appointments
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete appointments for authenticated users" ON appointments
    FOR DELETE TO authenticated USING (true);

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

-- Comentários para tabela schedules
COMMENT ON TABLE schedules IS 'Horários de trabalho padrão dos atendentes por dia da semana';
COMMENT ON COLUMN schedules.day_of_week IS 'Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)';
COMMENT ON COLUMN schedules.start_time IS 'Horário de início do expediente';
COMMENT ON COLUMN schedules.end_time IS 'Horário de fim do expediente';
COMMENT ON COLUMN schedules.is_active IS 'Se o horário está ativo/disponível';

-- Comentários para tabela schedule_assignments
COMMENT ON TABLE schedule_assignments IS 'Atribuições específicas de horários para serviços e datas';
COMMENT ON COLUMN schedule_assignments.specific_date IS 'Data específica para horários excepcionais (opcional)';
COMMENT ON COLUMN schedule_assignments.is_available IS 'Se o horário está disponível para agendamentos';
COMMENT ON COLUMN schedule_assignments.schedule_info IS 'Informações adicionais sobre o horário';

-- Comentários para tabela appointments
COMMENT ON TABLE appointments IS 'Agendamentos efetivos de pacientes com atendentes';
COMMENT ON COLUMN appointments.status IS 'Status do agendamento: scheduled, confirmed, completed, cancelled, no_show';
COMMENT ON COLUMN appointments.patient_name IS 'Nome do paciente quando não há cadastro (patient_id NULL)';
COMMENT ON COLUMN appointments.patient_phone IS 'Telefone do paciente para contato';

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_assignments_updated_at 
    BEFORE UPDATE ON schedule_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS DE EXEMPLO (OPCIONAL)
-- ============================================

-- Inserir horários padrão para teste (descomente se necessário)
/*
INSERT INTO schedules (attendant_id, day_of_week, start_time, end_time) 
SELECT 
    id as attendant_id,
    generate_series(1, 5) as day_of_week, -- Segunda a Sexta
    '08:00:00'::time as start_time,
    '17:00:00'::time as end_time
FROM attendants 
WHERE is_active = true
LIMIT 1; -- Apenas para o primeiro atendente ativo
*/

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================