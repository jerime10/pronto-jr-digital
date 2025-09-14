-- Add working_days column to attendants table
-- This column will store an array of integers representing the days of the week (0-6, where 0 = Sunday)

ALTER TABLE attendants 
ADD COLUMN working_days integer[] DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN attendants.working_days IS 'Array of integers representing working days of the week (0=Sunday, 1=Monday, ..., 6=Saturday)';

-- Add missing columns that are referenced in the code but don't exist in the database
ALTER TABLE attendants 
ADD COLUMN IF NOT EXISTS position character varying,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS share_link text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;

-- Add comments for the new columns
COMMENT ON COLUMN attendants.position IS 'Job position or title of the attendant';
COMMENT ON COLUMN attendants.photo_url IS 'URL of the attendant profile photo';
COMMENT ON COLUMN attendants.share_link IS 'Shareable link for the attendant profile';
COMMENT ON COLUMN attendants.bio IS 'Biography or description of the attendant';
COMMENT ON COLUMN attendants.available IS 'Whether the attendant is currently available for appointments';