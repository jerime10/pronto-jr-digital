-- Adicionar campo para seleção de modelo do OpenRouter
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS openrouter_model TEXT DEFAULT 'openai/gpt-4o-mini';
