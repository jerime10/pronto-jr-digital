
import { supabase } from '@/integrations/supabase/client';
import { ClinicInfoInput } from '@/types/siteSettingsTypes';

export async function fetchClinicSettings() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, clinic_name, clinic_address, clinic_phone, show_address')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching clinic settings:', error);
      
      // Fallback: try without show_address
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('site_settings')
          .select('id, clinic_name, clinic_address, clinic_phone')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (fallbackError) throw fallbackError;
        
        return {
          id: fallbackData?.id,
          clinicName: fallbackData?.clinic_name || '',
          clinicAddress: fallbackData?.clinic_address || '',
          clinicPhone: fallbackData?.clinic_phone || '',
          showAddress: true
        };
      }
      
      throw error;
    }
    
    return {
      id: data?.id,
      clinicName: data?.clinic_name || '',
      clinicAddress: data?.clinic_address || '',
      clinicPhone: data?.clinic_phone || '',
      showAddress: data?.show_address !== false // Default to true
    };
  } catch (error) {
    console.error('Error in fetchClinicSettings:', error);
    // Return default values in case of error
    return {
      id: undefined,
      clinicName: '',
      clinicAddress: '',
      clinicPhone: '',
      showAddress: true
    };
  }
}

import { upsertSiteSettings } from './siteSettingsSingleton';

export async function updateClinicSettings(
  clinicData: ClinicInfoInput,
  settingsId: string | undefined
): Promise<void> {
  try {
    console.log('🏥 [Service] Updating clinic settings:', { clinicData, settingsId });
    
    // Use unified upsert utility to ensure singleton row and prevent key reset
    await upsertSiteSettings({
      clinic_name: clinicData.clinicName,
      clinic_address: clinicData.clinicAddress,
      clinic_phone: clinicData.clinicPhone,
      show_address: clinicData.showAddress,
    });
    
    console.log('🎉 [Service] Clinic settings updated successfully');
  } catch (error) {
    console.error('💥 [Service] Error in updateClinicSettings:', error);
    throw error;
  }
}
