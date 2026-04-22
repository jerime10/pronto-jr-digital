
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified service to ensure site_settings is handled as a singleton.
 * This prevents multiple rows from being created and causing key reset issues.
 */
export async function getSiteSettingsId(): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('id')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching site settings ID:', error);
    throw error; // Throw error to prevent accidentally inserting new rows during network failures
  }

  if (!data || data.length === 0) {
    return undefined;
  }

  // Always return the ID of the most recently updated row
  return data[0].id;
}

/**
 * Robustly update or insert site settings as a singleton.
 */
export async function upsertSiteSettings(updates: Record<string, any>): Promise<void> {
  const settingsId = await getSiteSettingsId();
  
  const finalUpdates = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // We only add singleton_guard if the column exists to avoid DB errors
  // Since we can't easily check column existence here without a query, 
  // and the migration might have failed, we'll skip it for now or 
  // provide a more resilient way.
  
  if (settingsId) {
    console.log('📝 [Singleton] Updating existing site settings:', settingsId);
    const { error } = await supabase
      .from('site_settings')
      .update(finalUpdates)
      .eq('id', settingsId);
    
    if (error) {
      console.error('Error updating site settings singleton:', error);
      throw error;
    }
  } else {
    console.log('🆕 [Singleton] No site settings found, creating new row');
    const { error } = await supabase
      .from('site_settings')
      .insert([finalUpdates]);
    
    if (error) {
      console.error('Error inserting site settings singleton:', error);
      throw error;
    }
  }
}
