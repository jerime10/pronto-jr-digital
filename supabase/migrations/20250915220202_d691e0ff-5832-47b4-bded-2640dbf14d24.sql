-- Recreate the professionals table
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    custom_user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    license_type VARCHAR(100),
    license_number VARCHAR(100),
    contact VARCHAR(255),
    signature TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Create policies for professionals table
CREATE POLICY "Users can view all professionals" 
ON public.professionals 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own professional record" 
ON public.professionals 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own professional record" 
ON public.professionals 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own professional record" 
ON public.professionals 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updating updated_at column
CREATE OR REPLACE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();