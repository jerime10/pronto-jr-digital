import { supabase } from '@/integrations/supabase/client';

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
  const updates: any = {
    openrouter_api_key: openrouterApiKey,
    openrouter_model: openrouterModel || 'openai/gpt-4o-mini',
    openai_api_key: openaiApiKey,
    groq_api_key: groqApiKey,
    prompt_queixa: promptQueixa,
    prompt_evolucao: promptEvolucao,
    prompt_exames: promptExames,
    updated_at: new Date().toISOString(),
  };

  if (settingsId) {
    const { error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', settingsId);
    
    if (error) throw error;
  } else {
    // If no ID is provided, check if a record exists first
    const { data: existingRecords } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1);
      
    if (existingRecords && existingRecords.length > 0) {
      // Update the first record found
      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', existingRecords[0].id);
        
      if (error) throw error;
    } else {
      // Create a new record
      const { error } = await supabase
        .from('site_settings')
        .insert([updates]);
        
      if (error) throw error;
    }
  }
}
