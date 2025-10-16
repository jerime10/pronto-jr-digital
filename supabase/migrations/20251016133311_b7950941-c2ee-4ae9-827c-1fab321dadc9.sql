-- Adicionar coluna para webhook de lembretes recorrentes do WhatsApp
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS whatsapp_recurring_reminder_webhook_url TEXT;