
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createUploadProgressTracker } from '@/lib/utils';
import { applyThemeToDocument } from '@/lib/themeUtils';
import { ThemeSettingsInput } from '@/types/siteSettingsTypes';
import { fetchThemeSettings, updateThemeSettings } from '@/services/themeSettingsService';
import { uploadLogo } from '@/lib/uploadUtils';

export type ThemeSettings = {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
};

export function useThemeSettings() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch theme settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['theme_settings'],
    queryFn: fetchThemeSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Apply theme settings when they change
  useEffect(() => {
    if (settings) {
      try {
        applyThemeToDocument({
          primaryColor: settings.primaryColor,
          accentColor: settings.accentColor,
          fontFamily: settings.fontFamily,
          logoUrl: settings.logoUrl
        });
      } catch (err) {
        console.error('Error applying theme:', err);
      }
    }
  }, [settings]);
  
  // Handle logo upload with progress tracking
  const handleLogoUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    const completeProgress = createUploadProgressTracker(setUploadProgress);
    
    try {
      const logoUrl = await uploadLogo(file);
      completeProgress();
      return logoUrl;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Save theme settings
  const saveThemeSettings = useMutation({
    mutationFn: async (themeData: ThemeSettingsInput) => {
      let logoUrl = settings?.logoUrl;
      
      // Upload new logo if selected
      if (themeData.logoFile) {
        logoUrl = await handleLogoUpload(themeData.logoFile);
      }
      
      await updateThemeSettings(
        themeData,
        settings?.id,
        logoUrl
      );
    },
    onSuccess: () => {
      toast.success('Configurações de aparência salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['theme_settings'] });
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
    onError: (error) => {
      console.error('Error saving theme settings:', error);
      toast.error('Erro ao salvar as configurações de aparência.');
    }
  });

  return {
    settings,
    isLoading,
    error,
    uploadProgress,
    isUploading,
    saveThemeSettings
  };
}
