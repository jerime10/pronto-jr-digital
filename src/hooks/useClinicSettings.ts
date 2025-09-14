
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClinicInfoInput } from '@/types/siteSettingsTypes';
import { fetchClinicSettings, updateClinicSettings } from '@/services/clinicSettingsService';

export type ClinicInfo = {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
};

export function useClinicSettings() {
  const queryClient = useQueryClient();

  // Fetch clinic settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['clinic_settings'],
    queryFn: fetchClinicSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Save clinic info
  const saveClinicInfo = useMutation({
    mutationFn: async (clinicData: ClinicInfoInput) => {
      await updateClinicSettings(
        clinicData,
        settings?.id
      );
    },
    onSuccess: () => {
      toast.success('Informações da clínica salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clinic_settings'] });
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
    onError: (error) => {
      console.error('Error saving clinic info:', error);
      toast.error('Erro ao salvar informações da clínica.');
    }
  });
  
  // Map the settings to the ClinicInfo format
  const getClinicInfo = (): ClinicInfo => {
    return {
      clinicName: settings?.clinicName || '',
      clinicAddress: settings?.clinicAddress || '',
      clinicPhone: settings?.clinicPhone || ''
    };
  };

  return {
    settings,
    isLoading,
    error,
    getClinicInfo,
    saveClinicInfo
  };
}
