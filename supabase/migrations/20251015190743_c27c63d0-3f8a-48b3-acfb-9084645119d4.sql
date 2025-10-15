-- Criar tabela de log de lembretes enviados
CREATE TABLE IF NOT EXISTS public.appointment_reminders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '90min', '30min', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_log_appointment_id 
ON public.appointment_reminders_log(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_log_sent_at 
ON public.appointment_reminders_log(sent_at);

-- Habilitar RLS
ALTER TABLE public.appointment_reminders_log ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total (sistema interno)
CREATE POLICY "Allow all access to appointment_reminders_log"
ON public.appointment_reminders_log
FOR ALL
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.appointment_reminders_log IS 'Registra os lembretes automáticos enviados para evitar duplicatas';
COMMENT ON COLUMN public.appointment_reminders_log.reminder_type IS 'Tipo do lembrete: 24h (1x ao dia antes), 90min (a cada 30min), 30min (final), cancelled (cancelamento)';
COMMENT ON COLUMN public.appointment_reminders_log.status IS 'Status do envio: sent ou failed';