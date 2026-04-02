
-- Migration to enforce a single row in site_settings table
-- This prevents the "resetting" of API keys when multiple rows are inadvertently created

-- 1. Create a function to consolidate all rows into one
DO $$
DECLARE
    main_id UUID;
BEGIN
    -- Get the ID of the most recently updated record that has at least one API key
    SELECT id INTO main_id 
    FROM public.site_settings 
    ORDER BY 
        (groq_api_key IS NOT NULL)::int DESC,
        (openrouter_api_key IS NOT NULL)::int DESC,
        updated_at DESC 
    LIMIT 1;

    -- If no record exists, we don't need to do anything yet (the first insert will handle it)
    IF main_id IS NOT NULL THEN
        -- Delete all other records
        DELETE FROM public.site_settings WHERE id <> main_id;
    END IF;
END $$;

-- 2. Add a singleton guard column and constraint
-- This ensures only one row can ever exist in this table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS singleton_guard BOOLEAN DEFAULT TRUE;

-- Update existing rows to have the guard (should only be one row now)
UPDATE public.site_settings SET singleton_guard = TRUE;

-- Add a unique constraint on the guard column
-- Since it's always TRUE, only one row can exist
ALTER TABLE public.site_settings 
DROP CONSTRAINT IF EXISTS site_settings_singleton_idx;

ALTER TABLE public.site_settings 
ADD CONSTRAINT site_settings_singleton_idx UNIQUE (singleton_guard);

-- 3. Ensure the table has at least one row if it was empty
INSERT INTO public.site_settings (
    primary_color, 
    accent_color, 
    font_family, 
    clinic_name, 
    clinic_address, 
    clinic_phone,
    singleton_guard
)
SELECT 
    '#10b981', 
    '#3b82f6', 
    'Inter', 
    '', 
    '', 
    '',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings)
ON CONFLICT (singleton_guard) DO NOTHING;
