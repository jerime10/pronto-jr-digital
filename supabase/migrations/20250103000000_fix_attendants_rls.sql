-- Fix RLS for attendants table
-- Enable RLS and create policy to allow all operations

-- Enable RLS for attendants table
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access for authenticated users
CREATE POLICY "Allow all access to attendants for authenticated users"
ON public.attendants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.attendants IS 'RLS enabled with full access policy for authenticated users';