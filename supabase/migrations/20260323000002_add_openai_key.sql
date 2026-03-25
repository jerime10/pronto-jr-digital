-- Adicionar campo para chave da OpenAI (usada pelo Whisper)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;