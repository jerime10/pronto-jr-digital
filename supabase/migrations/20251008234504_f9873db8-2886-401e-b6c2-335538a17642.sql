-- Adicionar colunas faltantes na tabela site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS public_registration_url text,
ADD COLUMN IF NOT EXISTS whatsapp_reminder_webhook_url text;

-- Definir valores padrão
UPDATE public.site_settings 
SET whatsapp_reminder_webhook_url = 'https://n8n.mentoriajrs.com/webhook-test/lembrete-agendamento'
WHERE whatsapp_reminder_webhook_url IS NULL;

-- Dropar a função antiga e recriar com todos os campos
DROP FUNCTION IF EXISTS public.validate_simple_user(text, text);

CREATE OR REPLACE FUNCTION public.validate_simple_user(input_username text, input_password text)
RETURNS TABLE(
  id uuid,
  username character varying,
  is_active boolean,
  user_type character varying,
  permissions jsonb,
  full_name character varying,
  email character varying,
  phone character varying,
  partner_code character varying,
  commission_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.is_active,
    u.user_type,
    u.permissions,
    u.full_name,
    u.email,
    u.phone,
    u.partner_code,
    u.commission_percentage
  FROM public.usuarios u
  WHERE u.username = input_username 
    AND u.password = input_password
    AND u.is_active = true;
END;
$function$;