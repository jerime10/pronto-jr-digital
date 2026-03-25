-- Adicionar campo para chave da Groq (usada pelo Whisper ultrarrápido)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS groq_api_key TEXT;