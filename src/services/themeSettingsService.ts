
import { supabase } from '@/integrations/supabase/client';
import { ThemeSettingsInput } from '@/types/siteSettingsTypes';
import { uploadLogo } from '@/lib/uploadUtils';

export async function fetchThemeSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('id, primary_color, accent_color, font_family, logo_url')
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching theme settings:', error);
    throw error;
  }
  
  return {
    id: data?.id,
    primaryColor: data?.primary_color || '#10b981',
    accentColor: data?.accent_color || '#3b82f6',
    fontFamily: data?.font_family || 'Inter',
    logoUrl: data?.logo_url || null
  };
}

export async function updateThemeSettings(
  themeData: ThemeSettingsInput,
  settingsId: string | undefined,
  currentLogoUrl: string | null
): Promise<string | null> {
  let logoUrl = currentLogoUrl;
  
  // Upload new logo if selected
  if (themeData.logoFile) {
    logoUrl = await uploadLogo(themeData.logoFile);
  }
  
  const updateData = {
    primary_color: themeData.primaryColor,
    accent_color: themeData.accentColor,
    font_family: themeData.fontFamily,
    logo_url: logoUrl,
    updated_at: new Date().toISOString(),
  };
  
  if (settingsId) {
    // Update existing settings
    const { error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', settingsId);
    
    if (error) throw error;
  } else {
    // Create new settings
    const { error } = await supabase
      .from('site_settings')
      .insert(updateData);
    
    if (error) throw error;
  }
  
  return logoUrl;
}
