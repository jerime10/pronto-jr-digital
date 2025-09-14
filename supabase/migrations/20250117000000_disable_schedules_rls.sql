-- Desabilitar RLS para tabelas de horários para funcionar com autenticação customizada
-- O sistema usa autenticação simples local, não a do Supabase

-- Desabilitar RLS na tabela schedules
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela schedule_assignments
ALTER TABLE public.schedule_assignments DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela appointments
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Allow read schedules for all users" ON schedules;
DROP POLICY IF EXISTS "Allow insert schedules for all users" ON schedules;
DROP POLICY IF EXISTS "Allow update schedules for all users" ON schedules;
DROP POLICY IF EXISTS "Allow delete schedules for all users" ON schedules;

DROP POLICY IF EXISTS "Allow read assignments for all users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow insert assignments for all users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow update assignments for all users" ON schedule_assignments;
DROP POLICY IF EXISTS "Allow delete assignments for all users" ON schedule_assignments;

DROP POLICY IF EXISTS "Allow read appointments for all users" ON appointments;
DROP POLICY IF EXISTS "Allow insert appointments for all users" ON appointments;
DROP POLICY IF EXISTS "Allow update appointments for all users" ON appointments;
DROP POLICY IF EXISTS "Allow delete appointments for all users" ON appointments;

-- Adicionar comentários explicativos
COMMENT ON TABLE public.schedules IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.schedule_assignments IS 'RLS desabilitado - sistema usa autenticação customizada';
COMMENT ON TABLE public.appointments IS 'RLS desabilitado - sistema usa autenticação customizada';