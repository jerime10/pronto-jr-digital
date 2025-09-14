
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchWebhookSettings, updateWebhookSettings } from '@/services/webhookSettingsService';

export function useWebhookSettings() {
  const queryClient = useQueryClient();

  // Fetch webhook settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['webhook_settings'],
    queryFn: fetchWebhookSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save webhook settings
  const saveWebhookUrl = useMutation({
    mutationFn: async (webhookUrl: string) => {
      await updateWebhookSettings(webhookUrl, settings?.id);
    },
    onSuccess: () => {
      toast.success('URL do webhook salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['webhook_settings'] });
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
    onError: (error) => {
      console.error('Error saving webhook URL:', error);
      toast.error('Erro ao salvar URL do webhook.');
    }
  });

  return {
    webhookUrl: settings?.webhookUrl || '',
    settingsId: settings?.id,
    isLoading,
    error,
    saveWebhookUrl
  };
}
