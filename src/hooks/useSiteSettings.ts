
import { useSiteSettingsStore } from './useSiteSettingsStore';

// Re-export the SiteSettings type
export type { SiteSettings } from '@/types/siteSettingsTypes';

// This hook provides a unified API for all settings
export function useSiteSettings() {
  // Simply use and return the store
  return useSiteSettingsStore();
}
