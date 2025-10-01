-- Adicionar colunas faltantes em medical_records se não existirem
DO $$ 
BEGIN
  -- Adicionar attendant_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' 
    AND column_name = 'attendant_id'
  ) THEN
    ALTER TABLE medical_records 
    ADD COLUMN attendant_id uuid REFERENCES attendants(id);
  END IF;

  -- Garantir que appointment_id exista
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' 
    AND column_name = 'appointment_id'
  ) THEN
    ALTER TABLE medical_records 
    ADD COLUMN appointment_id uuid REFERENCES appointments(id);
  END IF;
END $$;

-- Adicionar colunas faltantes em appointments se necessário
DO $$ 
BEGIN
  -- Adicionar patient_id se não existir (já existe, mas garantindo)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN patient_id uuid REFERENCES patients(id);
  END IF;

  -- Adicionar end_time se não existir (já existe como text)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN end_time text;
  END IF;
END $$;