import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter access token usando Service Account
async function getAccessToken(serviceAccountJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountJson.client_email,
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: now
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  const privateKeyPem = serviceAccountJson.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const jwt = `${signatureInput}.${signatureB64}`;
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    throw new Error(`Erro ao obter access token: ${tokenData.error_description || tokenData.error}`);
  }
  
  return tokenData.access_token;
}

// Função para criar evento no Google Calendar
async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        colorId: '5' // Amarelo - para agendamentos
      })
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Erro ao criar evento:', data);
    throw new Error(`Erro ao criar evento: ${data.error?.message || 'Erro desconhecido'}`);
  }
  
  console.log('✅ Evento criado com sucesso:', data.id);
  return data.id;
}

// Função para atualizar evento no Google Calendar
async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        colorId: '5'
      })
    }
  );
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Erro ao atualizar evento: ${data.error?.message || 'Erro desconhecido'}`);
  }
  
  console.log('✅ Evento atualizado com sucesso:', eventId);
}

// Função para deletar evento do Google Calendar
async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  if (!response.ok && response.status !== 410) { // 410 = já deletado
    const data = await response.json();
    throw new Error(`Erro ao deletar evento: ${data.error?.message || 'Erro desconhecido'}`);
  }
  
  console.log('✅ Evento deletado com sucesso:', eventId);
}

// Função para buscar eventos do Google Calendar
async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime'
  });
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erro ao listar eventos: ${data.error?.message || 'Erro desconhecido'}`);
  }
  
  return data.items || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, appointment_id, appointment_data } = await req.json();
    
    console.log('📥 Requisição recebida:', { action, appointment_id });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const serviceAccountJsonStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJsonStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado');
    }
    
    const serviceAccountJson = JSON.parse(serviceAccountJsonStr);
    const accessToken = await getAccessToken(serviceAccountJson);
    
    switch (action) {
      case 'create': {
        if (!appointment_data) {
          throw new Error('appointment_data é obrigatório para criar evento');
        }
        
        // Buscar google_calendar_id do atendente
        const { data: attendant, error: attendantError } = await supabase
          .from('attendants')
          .select('google_calendar_id, name')
          .eq('id', appointment_data.attendant_id)
          .single();
        
        if (attendantError || !attendant?.google_calendar_id) {
          console.log('⚠️ Atendente sem Google Calendar configurado');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Atendente sem Google Calendar configurado',
            google_event_id: null
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Formatar data e hora
        const appointmentDate = appointment_data.appointment_date;
        const appointmentTime = appointment_data.appointment_time;
        const duration = appointment_data.service_duration || 30;
        
        const startDateTime = `${appointmentDate}T${appointmentTime}:00-03:00`;
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        const endDateTime = `${appointmentDate}T${endTime}:00-03:00`;
        
        const googleEventId = await createGoogleCalendarEvent(accessToken, attendant.google_calendar_id, {
          summary: `${appointment_data.service_name || 'Consulta'} - ${appointment_data.patient_name || 'Paciente'}`,
          description: `Paciente: ${appointment_data.patient_name || 'Não informado'}\nTelefone: ${appointment_data.patient_phone || 'Não informado'}\nServiço: ${appointment_data.service_name || 'Não informado'}\n\nNotas: ${appointment_data.notes || 'Sem notas'}`,
          startDateTime,
          endDateTime
        });
        
        // Atualizar appointment com google_event_id
        if (appointment_id) {
          await supabase
            .from('appointments')
            .update({ google_event_id: googleEventId })
            .eq('id', appointment_id);
        }
        
        // Log de sincronização
        await supabase.from('google_calendar_sync_log').insert({
          attendant_id: appointment_data.attendant_id,
          sync_type: 'create',
          status: 'success',
          events_synced: 1
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          google_event_id: googleEventId,
          message: 'Evento criado no Google Calendar'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'update': {
        if (!appointment_id) {
          throw new Error('appointment_id é obrigatório para atualizar evento');
        }
        
        // Buscar appointment existente
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .select('*, attendants!appointments_attendant_id_fkey(google_calendar_id)')
          .eq('id', appointment_id)
          .single();
        
        if (appointmentError || !appointment) {
          throw new Error('Agendamento não encontrado');
        }
        
        const calendarId = (appointment as any).attendants?.google_calendar_id;
        if (!calendarId || !appointment.google_event_id) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Sem evento do Google Calendar para atualizar'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const appointmentDate = appointment_data?.appointment_date || appointment.appointment_date;
        const appointmentTime = appointment_data?.appointment_time || appointment.appointment_time;
        const duration = appointment_data?.service_duration || appointment.service_duration || 30;
        
        const startDateTime = `${appointmentDate}T${appointmentTime}:00-03:00`;
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        const endDateTime = `${appointmentDate}T${endTime}:00-03:00`;
        
        await updateGoogleCalendarEvent(accessToken, calendarId, appointment.google_event_id, {
          summary: `${appointment_data?.service_name || appointment.service_name || 'Consulta'} - ${appointment_data?.patient_name || appointment.patient_name || 'Paciente'}`,
          description: `Paciente: ${appointment_data?.patient_name || appointment.patient_name || 'Não informado'}\nTelefone: ${appointment_data?.patient_phone || appointment.patient_phone || 'Não informado'}\nServiço: ${appointment_data?.service_name || appointment.service_name || 'Não informado'}\n\nNotas: ${appointment_data?.notes || appointment.notes || 'Sem notas'}`,
          startDateTime,
          endDateTime
        });
        
        await supabase.from('google_calendar_sync_log').insert({
          attendant_id: appointment.attendant_id,
          sync_type: 'update',
          status: 'success',
          events_synced: 1
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Evento atualizado no Google Calendar'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'delete': {
        if (!appointment_id) {
          throw new Error('appointment_id é obrigatório para deletar evento');
        }
        
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .select('*, attendants!appointments_attendant_id_fkey(google_calendar_id)')
          .eq('id', appointment_id)
          .single();
        
        if (appointmentError || !appointment) {
          throw new Error('Agendamento não encontrado');
        }
        
        const calendarId = (appointment as any).attendants?.google_calendar_id;
        if (!calendarId || !appointment.google_event_id) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Sem evento do Google Calendar para deletar'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        await deleteGoogleCalendarEvent(accessToken, calendarId, appointment.google_event_id);
        
        await supabase
          .from('appointments')
          .update({ google_event_id: null })
          .eq('id', appointment_id);
        
        await supabase.from('google_calendar_sync_log').insert({
          attendant_id: appointment.attendant_id,
          sync_type: 'delete',
          status: 'success',
          events_synced: 1
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Evento deletado do Google Calendar'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

  } catch (error) {
    console.error('❌ Erro na função google-calendar-sync:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
