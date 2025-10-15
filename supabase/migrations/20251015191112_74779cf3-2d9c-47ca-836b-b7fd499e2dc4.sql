-- Habilitar extensões pg_cron e pg_net se ainda não estiverem habilitadas
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Configurar cron job para enviar lembretes automáticos a cada 15 minutos
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT net.http_post(
    url:='https://vtthxoovjswtrwfrdlha.supabase.co/functions/v1/scheduled-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'Async HTTP client for PostgreSQL';