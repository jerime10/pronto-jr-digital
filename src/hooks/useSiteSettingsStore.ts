
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useThemeSettings } from './useThemeSettings';
import { useClinicSettings } from './useClinicSettings';
import { useWebhookSettings } from './useWebhookSettings';
import { useMedicalRecordWebhookSettings } from './useMedicalRecordWebhookSettings';
import { SiteSettings } from '@/types/siteSettingsTypes';
import { fetchSiteSettings } from '@/services/siteSettingsService';

// Re-export SiteSettings type
export type { SiteSettings } from '@/types/siteSettingsTypes';

export function useSiteSettingsStore() {
  // Use all specialized hooks
  const themeSettings = useThemeSettings();
  const clinicSettings = useClinicSettings();
  const webhookSettings = useWebhookSettings();
  const medicalRecordWebhookSettings = useMedicalRecordWebhookSettings();

  // Get a unified settings object for backward compatibility
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['site_settings'],
    queryFn: fetchSiteSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Unified settings (for backward compatibility)
    settings,
    isLoading: 
      isLoading || 
      themeSettings.isLoading || 
      clinicSettings.isLoading || 
      webhookSettings.isLoading ||
      medicalRecordWebhookSettings.isLoading,
    error: error || themeSettings.error || clinicSettings.error || webhookSettings.error || medicalRecordWebhookSettings.error,
    
    // Theme settings
    uploadProgress: themeSettings.uploadProgress,
    isUploading: themeSettings.isUploading,
    saveThemeSettings: themeSettings.saveThemeSettings,
    
    // Clinic settings
    saveClinicInfo: clinicSettings.saveClinicInfo,
    
    // Webhook settings
    saveWebhookUrl: webhookSettings.saveWebhookUrl,
    
    // Medical record webhook settings
    saveMedicalRecordWebhookUrl: medicalRecordWebhookSettings.saveMedicalRecordWebhookUrl
  };
}
