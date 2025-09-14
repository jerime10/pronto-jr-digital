
-- Create storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('site-assets', 'Site Assets', true, 5242880, '{image/jpeg,image/png,image/gif,image/svg+xml}')
ON CONFLICT (id) DO UPDATE 
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = '{image/jpeg,image/png,image/gif,image/svg+xml}';

-- Add columns for PDF template settings to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS pdf_header_template text,
ADD COLUMN IF NOT EXISTS pdf_footer_template text,
ADD COLUMN IF NOT EXISTS pdf_patient_info_template text,
ADD COLUMN IF NOT EXISTS pdf_prescription_template text,
ADD COLUMN IF NOT EXISTS pdf_exams_template text,
ADD COLUMN IF NOT EXISTS pdf_custom_styles text;

-- Add columns for clinic information to site_settings table if they don't exist yet
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS clinic_name text,
ADD COLUMN IF NOT EXISTS clinic_address text,
ADD COLUMN IF NOT EXISTS clinic_phone text;
