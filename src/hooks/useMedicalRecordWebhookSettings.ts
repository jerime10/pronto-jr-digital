
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchMedicalRecordWebhookSettings, updateMedicalRecordWebhookSettings } from '@/services/medicalRecordWebhookService';

export function useMedicalRecordWebhookSettings() {
  const queryClient = useQueryClient();

  // Fetch webhook settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['medical_record_webhook_settings'],
    queryFn: fetchMedicalRecordWebhookSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save webhook settings with simplified error handling
  const saveMedicalRecordWebhookUrl = useMutation({
    mutationFn: async (medicalRecordWebhookUrl: string) => {
      console.log('🚀 [Hook] Iniciando salvamento direto do webhook URL:', medicalRecordWebhookUrl);
      await updateMedicalRecordWebhookSettings(medicalRecordWebhookUrl, settings?.id);
    },
    onSuccess: () => {
      console.log('🎉 [Hook] Webhook URL salvo com sucesso!');
      toast.success('URL do webhook para prontuários salva com sucesso!');
      
      // Invalidate both queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['medical_record_webhook_settings'] });
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
    onError: (error: any) => {
      console.error('💥 [Hook] Erro ao salvar webhook URL:', error);
      
      // Show user-friendly error message based on error type
      let errorMessage = 'Erro ao salvar URL do webhook para prontuários.';
      
      if (error?.message?.includes('permissão') || error?.message?.includes('autenticação')) {
        errorMessage = 'Erro de autenticação. Faça login novamente e tente novamente.';
      } else if (error?.message?.includes('validação')) {
        errorMessage = 'URL do webhook inválida. Verifique o formato e tente novamente.';
      } else if (error?.message?.includes('rede') || error?.message?.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
    retry: (failureCount, error: any) => {
      // Only retry for network errors, not permission errors
      const shouldRetry = failureCount < 1 && 
                         !error?.message?.includes('permissão') && 
                         !error?.message?.includes('validação') &&
                         !error?.message?.includes('autenticação');
      
      if (shouldRetry) {
        console.log(`🔄 [Hook] Tentativa ${failureCount + 1}/1 de retry...`);
      }
      
      return shouldRetry;
    }
  });

  return {
    medicalRecordWebhookUrl: settings?.medicalRecordWebhookUrl || '',
    settingsId: settings?.id,
    isLoading,
    error,
    saveMedicalRecordWebhookUrl
  };
}
