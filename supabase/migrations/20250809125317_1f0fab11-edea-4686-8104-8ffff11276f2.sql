
-- Clean up duplicate records in site_settings table, keeping only the most recent one
WITH ranked_settings AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) as rn
  FROM site_settings
)
DELETE FROM site_settings 
WHERE id IN (
  SELECT id FROM ranked_settings WHERE rn > 1
);

-- Ensure we have at least one record with default values if table is empty
INSERT INTO site_settings (
  primary_color, 
  accent_color, 
  font_family, 
  clinic_name, 
  clinic_address, 
  clinic_phone, 
  n8n_webhook_url, 
  medical_record_webhook_url
)
SELECT 
  '#10b981', 
  '#3b82f6', 
  'Inter', 
  '', 
  '', 
  '', 
  '', 
  ''
WHERE NOT EXISTS (SELECT 1 FROM site_settings);
