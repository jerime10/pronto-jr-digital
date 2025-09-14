
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

export async function updateClinicSettings(
  clinicData: ClinicInfoInput,
  settingsId: string | undefined
): Promise<void> {
  try {
    console.log('🏥 [Service] Updating clinic settings:', { clinicData, settingsId });
    
    // Always get the current record to ensure we're updating the right one
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const updateData = {
      clinic_name: clinicData.clinicName,
      clinic_address: clinicData.clinicAddress,
      clinic_phone: clinicData.clinicPhone,
      updated_at: new Date().toISOString(),
    };
    
    if (currentSettings?.id) {
      // Update existing settings using the most recent record
      const { error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', currentSettings.id);
      
      if (error) {
        console.error('💥 [Service] Error updating clinic settings:', error);
        throw error;
      }
    } else {
      // Create new settings if none exist
      const { error } = await supabase
        .from('site_settings')
        .insert({
          ...updateData,
          primary_color: '#10b981',
          accent_color: '#3b82f6',
          font_family: 'Inter',
          n8n_webhook_url: '',
          medical_record_webhook_url: ''
        });
      
      if (error) {
        console.error('💥 [Service] Error creating clinic settings:', error);
        throw error;
      }
    }
    
    console.log('🎉 [Service] Clinic settings updated successfully');
  } catch (error) {
    console.error('💥 [Service] Error in updateClinicSettings:', error);
    throw error;
  }
}
