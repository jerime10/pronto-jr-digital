-- Adicionar coluna google_calendar_id na tabela attendants
ALTER TABLE attendants 
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT DEFAULT NULL;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_attendants_google_calendar_id ON attendants(google_calendar_id);

-- Adicionar coluna google_event_id na tabela appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_event_id TEXT DEFAULT NULL;

-- Índice para busca rápida por google_event_id
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON appointments(google_event_id);

-- Criar tabela de log de sincronização
CREATE TABLE IF NOT EXISTS google_calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'poll', 'create', 'update', 'delete'
  status TEXT NOT NULL, -- 'success', 'error'
  events_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy para google_calendar_sync_log
ALTER TABLE google_calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to google_calendar_sync_log" 
ON google_calendar_sync_log FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON COLUMN attendants.google_calendar_id IS 'ID do calendário do Google Calendar (formato: xxx@group.calendar.google.com ou email)';
COMMENT ON COLUMN appointments.google_event_id IS 'ID do evento criado no Google Calendar';
COMMENT ON TABLE google_calendar_sync_log IS 'Log de sincronização com Google Calendar';