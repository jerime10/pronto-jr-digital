import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface GoogleCalendarAvailabilityRequest {
  attendant_id: string;
  date: string; // YYYY-MM-DD
  service_duration?: number; // in minutes
  start_hour?: number;
  end_hour?: number;
}

export interface GoogleCalendarSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface GoogleCalendarSyncRequest {
  action: 'create' | 'update' | 'delete';
  calendarId: string;
  appointmentId: string;
  eventData?: {
    summary: string;
    description?: string;
    start: string;
    end: string;
  };
  googleEventId?: string;
}

export interface GoogleCalendarPollRequest {
  attendant_id: string;
  days_ahead?: number;
}

export interface GoogleCalendarBusySlot {
  start: string;
  end: string;
}

export interface GoogleCalendarAvailabilityResponse {
  available_slots: GoogleCalendarSlot[];
  busy_slots: GoogleCalendarBusySlot[];
  service_account_email?: string;
}

/**
 * Busca horários disponíveis do Google Calendar
 */
export async function fetchGoogleCalendarAvailability(
  request: GoogleCalendarAvailabilityRequest
): Promise<GoogleCalendarAvailabilityResponse> {
  try {
    console.log('[GoogleCalendar] Fetching availability for:', request);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleCalendar] Availability error:', errorText);
      throw new Error(`Erro ao buscar disponibilidade: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GoogleCalendar] Availability result:', data);
    return {
      available_slots: data.available_slots || [],
      busy_slots: data.busy_slots || [],
      service_account_email: data.service_account_email
    };
  } catch (error) {
    console.error('[GoogleCalendar] fetchAvailability error:', error);
    throw error;
  }
}

/**
 * Sincroniza um evento com o Google Calendar (criar/atualizar/deletar)
 */
export async function syncGoogleCalendarEvent(
  request: GoogleCalendarSyncRequest
): Promise<{ success: boolean; googleEventId?: string }> {
  try {
    console.log('[GoogleCalendar] Syncing event:', request);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleCalendar] Sync error:', errorText);
      throw new Error(`Erro ao sincronizar evento: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GoogleCalendar] Sync result:', data);
    return data;
  } catch (error) {
    console.error('[GoogleCalendar] syncEvent error:', error);
    throw error;
  }
}

/**
 * Executa polling para sincronizar eventos do Google Calendar
 */
export async function pollGoogleCalendarEvents(
  request: GoogleCalendarPollRequest
): Promise<{ success: boolean; eventsProcessed: number }> {
  try {
    console.log('[GoogleCalendar] Polling events for:', request);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleCalendar] Poll error:', errorText);
      throw new Error(`Erro ao sincronizar calendário: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GoogleCalendar] Poll result:', data);
    return data;
  } catch (error) {
    console.error('[GoogleCalendar] pollEvents error:', error);
    throw error;
  }
}

/**
 * Testa a conexão com o Google Calendar de um atendente
 */
export async function testGoogleCalendarConnection(
  attendantId: string
): Promise<{ success: boolean; error?: string; serviceAccountEmail?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await fetchGoogleCalendarAvailability({
      attendant_id: attendantId,
      date: today,
    });
    return { success: true, serviceAccountEmail: result.service_account_email };
  } catch (error) {
    console.error('[GoogleCalendar] Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Sincroniza todos os eventos de um atendente (polling manual)
 */
export async function syncAttendantCalendar(
  attendantId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await pollGoogleCalendarEvents({
      attendant_id: attendantId,
      days_ahead: 30,
    });
    
    return {
      success: result.success,
      message: `${result.eventsProcessed} eventos sincronizados`,
    };
  } catch (error) {
    console.error('[GoogleCalendar] Sync attendant error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
