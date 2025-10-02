-- Criar tabela para templates de campos individuais
CREATE TABLE IF NOT EXISTS public.individual_field_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL,
  field_label text NOT NULL,
  field_content text NOT NULL,
  model_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar índice para busca otimizada por field_key e model_name
CREATE INDEX IF NOT EXISTS idx_individual_field_templates_key_model 
ON public.individual_field_templates(field_key, model_name);

-- Criar índice para busca full-text no conteúdo
CREATE INDEX IF NOT EXISTS idx_individual_field_templates_content 
ON public.individual_field_templates USING gin(to_tsvector('portuguese', field_content));

-- Habilitar RLS
ALTER TABLE public.individual_field_templates ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para usuários autenticados
CREATE POLICY "Allow authenticated access to individual_field_templates"
ON public.individual_field_templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_individual_field_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_individual_field_templates_updated_at_trigger
BEFORE UPDATE ON public.individual_field_templates
FOR EACH ROW
EXECUTE FUNCTION update_individual_field_templates_updated_at();