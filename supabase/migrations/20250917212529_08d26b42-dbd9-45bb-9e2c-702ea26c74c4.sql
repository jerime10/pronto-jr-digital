-- Add missing appointment_id column to medical_records with foreign key constraint
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

-- Add missing patient_id column to appointments with foreign key constraint  
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);

-- Add missing end_time column to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Update appointments status enum to include more status values
ALTER TABLE appointments ADD CONSTRAINT check_status_valid 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'finalizado', 'atendimento_finalizado'));