-- Add foreign key relationship between medical_records and professionals tables

-- First, let's check if the foreign key constraint already exists
-- If not, we'll add it

-- Add foreign key constraint from medical_records.professional_id to professionals.id
ALTER TABLE public.medical_records 
ADD CONSTRAINT fk_medical_records_professional 
FOREIGN KEY (professional_id) 
REFERENCES public.professionals(id) 
ON DELETE CASCADE;