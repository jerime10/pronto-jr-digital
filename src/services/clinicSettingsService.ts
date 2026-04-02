
import { supabase } from '@/integrations/supabase/client';
import { ClinicInfoInput } from '@/types/siteSettingsTypes';

export async function fetchClinicSettings() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, clinic_name, clinic_address, clinic_phone')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching clinic settings:', error);
      throw error;
    }
    
    return {
      id: data?.id,
      clinicName: data?.clinic_name || '',
      clinicAddress: data?.clinic_address || '',
      clinicPhone: data?.clinic_phone || ''
    };
  } catch (error) {
    console.error('Error in fetchClinicSettings:', error);
    // Return default values in case of error
    return {
      id: undefined,
      clinicName: '',
      clinicAddress: '',
      clinicPhone: ''
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
    });
    
    console.log('🎉 [Service] Clinic settings updated successfully');
  } catch (error) {
    console.error('💥 [Service] Error in updateClinicSettings:', error);
    throw error;
  }
}
