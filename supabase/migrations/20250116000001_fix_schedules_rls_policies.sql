-- Corrigir políticas RLS para tabelas de horários
-- O sistema usa autenticação customizada, não a do Supabase

-- Remover políticas antigas da tabela schedules
DROP POLICY IF EXISTS "Allow read schedules for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Allow insert schedules for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Allow update schedules for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Allow delete schedules for authenticated users" ON schedules;

-- Criar novas políticas para schedules (permitir acesso público)
CREATE POLICY "Allow read schedules for all users" ON schedules
    FOR SELECT USING (true);

CREATE POLICY "Allow insert schedules for all users" ON schedules
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update schedules for all users" ON schedules
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete schedules for all users" ON schedules
    FOR DELETE USING (true);

-- Remover políticas antigas da tabela schedule_assignments
DROP POLICY IF EXISTS "Allow read assignments for authenticated users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow insert assignments for authenticated users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow update assignments for authenticated users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow delete assignments for authenticated users" ON schedule_assignments;

-- Criar novas políticas para schedule_assignments (permitir acesso público)
CREATE POLICY "Allow read assignments for all users" ON schedule_assignments
    FOR SELECT USING (true);

CREATE POLICY "Allow insert assignments for all users" ON schedule_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update assignments for all users" ON schedule_assignments
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete assignments for all users" ON schedule_assignments
    FOR DELETE USING (true);

-- Remover políticas antigas da tabela appointments
DROP POLICY IF EXISTS "Allow read appointments for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Allow insert appointments for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Allow update appointments for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Allow delete appointments for authenticated users" ON appointments;

-- Criar novas políticas para appointments (permitir acesso público)
CREATE POLICY "Allow read appointments for all users" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Allow insert appointments for all users" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update appointments for all users" ON appointments
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete appointments for all users" ON appointments
    FOR DELETE USING (true);