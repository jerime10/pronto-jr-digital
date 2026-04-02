import { upsertSiteSettings } from './siteSettingsSingleton';

export async function updateAIPromptSettings(
  openrouterApiKey: string | null,
  openrouterModel: string | null,
  openaiApiKey: string | null,
  groqApiKey: string | null,
  promptQueixa: string | null,
  promptEvolucao: string | null,
  promptExames: string | null,
  settingsId?: string
): Promise<void> {
  // Use unified upsert utility to ensure singleton row and prevent key reset
  await upsertSiteSettings({
    openrouter_api_key: openrouterApiKey,
    openrouter_model: openrouterModel || 'openai/gpt-4o-mini',
    openai_api_key: openaiApiKey,
    groq_api_key: groqApiKey,
    prompt_queixa: promptQueixa,
    prompt_evolucao: promptEvolucao,
    prompt_exames: promptExames,
  });
}
