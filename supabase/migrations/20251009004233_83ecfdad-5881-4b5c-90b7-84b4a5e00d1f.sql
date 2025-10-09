-- Habilitar RLS na tabela appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir INSERT público (necessário para agendamentos públicos)
CREATE POLICY "Allow public insert for appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);

-- Criar policy para permitir SELECT público (para verificar disponibilidade)
CREATE POLICY "Allow public select for appointments"
ON public.appointments
FOR SELECT
TO public
USING (true);

-- Criar policy para permitir UPDATE autenticado (para administração)
CREATE POLICY "Allow authenticated update for appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar policy para permitir DELETE autenticado (para administração)
CREATE POLICY "Allow authenticated delete for appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (true);