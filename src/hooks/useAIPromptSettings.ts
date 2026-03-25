import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateAIPromptSettings } from '@/services/aiSettingsService';

export function useAIPromptSettings() {
  const queryClient = useQueryClient();

  const saveAIPrompts = useMutation({
    mutationFn: async ({
      openrouterApiKey,
      openrouterModel,
      openaiApiKey,
      groqApiKey,
      promptQueixa,
      promptEvolucao,
      promptExames,
      settingsId
    }: {
      openrouterApiKey: string | null;
      openrouterModel?: string | null;
      openaiApiKey?: string | null;
      groqApiKey?: string | null;
      promptQueixa: string | null;
      promptEvolucao: string | null;
      promptExames: string | null;
      settingsId?: string;
    }) => {
      await updateAIPromptSettings(
        openrouterApiKey,
        openrouterModel || null,
        openaiApiKey || null,
        groqApiKey || null,
        promptQueixa,
        promptEvolucao,
        promptExames,
        settingsId
      );
    },
    onSuccess: () => {
      toast.success('Configurações da IA salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações da IA:', error);
      toast.error('Erro ao salvar configurações da IA.');
    }
  });

  return {
    saveAIPrompts
  };
}
