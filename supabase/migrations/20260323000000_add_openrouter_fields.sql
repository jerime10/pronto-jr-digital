-- Adicionar campos de configuração da IA (OpenRouter e Prompts)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT,
ADD COLUMN IF NOT EXISTS prompt_queixa TEXT DEFAULT 'Você é um assistente médico especializado em estruturar a Queixa Principal e História da Moléstia Atual. Organize o texto recebido em um formato profissional, claro e objetivo.',
ADD COLUMN IF NOT EXISTS prompt_evolucao TEXT DEFAULT 'Você é um assistente médico. Organize a evolução clínica do paciente com clareza, destacando estado geral, sinais vitais, e progressão do quadro.',
ADD COLUMN IF NOT EXISTS prompt_exames TEXT DEFAULT 'Você é um assistente médico. Analise e estruture os resultados de exames recebidos, extraindo parâmetros-chave e formatando em um laudo estruturado.';
