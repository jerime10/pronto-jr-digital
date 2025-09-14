-- Fix RLS policy for site_settings to work with simple auth system
-- Remove the current policy that expects Supabase auth
DROP POLICY IF EXISTS "Allow authenticated users full access to site_settings" ON site_settings;

-- Create a policy that allows any access for now, since we're using simple auth
-- In a production system, you'd want to check for valid tokens through a security definer function
CREATE POLICY "Allow all access to site_settings for simple auth" 
ON site_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Comment explaining the temporary approach
COMMENT ON POLICY "Allow all access to site_settings for simple auth" ON site_settings IS 'Allows full access to site_settings for the simple authentication system - consider adding token validation in production';