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
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
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
    orderBy: 'startTime',
    maxResults: '250'
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

// Função para extrair informações do evento do Google Calendar
function parseGoogleEvent(event: any): { 
  patientName: string; 
  patientPhone: string; 
  serviceName: string;
  notes: string;
} {
  const description = event.description || '';
  const summary = event.summary || '';
  
  // Tentar extrair nome do paciente do título (formato: "Serviço - Paciente")
  const summaryMatch = summary.match(/^(.+?)\s*-\s*(.+)$/);
  const serviceName = summaryMatch ? summaryMatch[1].trim() : summary;
  const patientNameFromSummary = summaryMatch ? summaryMatch[2].trim() : '';
  
  // Tentar extrair informações da descrição
  const patientMatch = description.match(/Paciente:\s*(.+?)(?:\n|$)/i);
  const phoneMatch = description.match(/Telefone:\s*(.+?)(?:\n|$)/i);
  const notesMatch = description.match(/Notas:\s*(.+?)$/i);
  
  return {
    patientName: patientMatch ? patientMatch[1].trim() : patientNameFromSummary,
    patientPhone: phoneMatch ? phoneMatch[1].trim() : '',
    serviceName: serviceName,
    notes: notesMatch ? notesMatch[1].trim() : ''
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { days_ahead = 30 } = await req.json().catch(() => ({}));
    
    console.log('🔄 Iniciando polling do Google Calendar...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const serviceAccountJsonStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJsonStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado');
    }
    
    const serviceAccountJson = JSON.parse(serviceAccountJsonStr);
    const accessToken = await getAccessToken(serviceAccountJson);
    
    // Buscar todos os atendentes com google_calendar_id configurado
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select('id, name, google_calendar_id')
      .not('google_calendar_id', 'is', null)
      .eq('is_active', true);
    
    if (attendantsError) {
      throw new Error(`Erro ao buscar atendentes: ${attendantsError.message}`);
    }
    
    if (!attendants || attendants.length === 0) {
      console.log('⚠️ Nenhum atendente com Google Calendar configurado');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum atendente com Google Calendar configurado',
        synced: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`📋 ${attendants.length} atendentes encontrados com Google Calendar`);
    
    // Definir período de busca
    const now = new Date();
    const timeMin = now.toISOString();
    const futureDate = new Date(now.getTime() + days_ahead * 24 * 60 * 60 * 1000);
    const timeMax = futureDate.toISOString();
    
    let totalEventsSynced = 0;
    let totalEventsCreated = 0;
    
    // Buscar serviço padrão para usar quando não conseguir identificar
    const { data: defaultService } = await supabase
      .from('services')
      .select('id, name, price, duration')
      .eq('available', true)
      .limit(1)
      .single();
    
    for (const attendant of attendants) {
      if (!attendant.google_calendar_id) continue;
      
      console.log(`📅 Sincronizando calendário de: ${attendant.name}`);
      
      try {
        const events = await listGoogleCalendarEvents(
          accessToken,
          attendant.google_calendar_id,
          timeMin,
          timeMax
        );
        
        console.log(`  - ${events.length} eventos encontrados`);
        
        for (const event of events) {
          // Ignorar eventos sem data/hora definida
          if (!event.start?.dateTime) continue;
          
          // Verificar se o evento já existe no banco de dados
          const { data: existingAppointment } = await supabase
            .from('appointments')
            .select('id')
            .eq('google_event_id', event.id)
            .single();
          
          if (existingAppointment) {
            // Evento já existe, pular
            continue;
          }
          
          // Extrair informações do evento
          const eventInfo = parseGoogleEvent(event);
          
          // Extrair data e hora
          const startDateTime = new Date(event.start.dateTime);
          const endDateTime = new Date(event.end?.dateTime || startDateTime);
          const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
          
          const appointmentDate = startDateTime.toISOString().split('T')[0];
          const appointmentTime = startDateTime.toTimeString().substring(0, 5);
          const endTime = endDateTime.toTimeString().substring(0, 5);
          
          // Tentar encontrar o serviço pelo nome
          let serviceId = defaultService?.id;
          let serviceName = eventInfo.serviceName;
          let servicePrice = defaultService?.price || 0;
          let serviceDuration = duration;
          
          if (eventInfo.serviceName) {
            const { data: matchedService } = await supabase
              .from('services')
              .select('id, name, price, duration')
              .ilike('name', `%${eventInfo.serviceName}%`)
              .limit(1)
              .single();
            
            if (matchedService) {
              serviceId = matchedService.id;
              serviceName = matchedService.name;
              servicePrice = matchedService.price;
              serviceDuration = matchedService.duration;
            }
          }
          
          if (!serviceId) {
            console.log(`  ⚠️ Evento ignorado (sem serviço correspondente): ${event.summary}`);
            continue;
          }
          
          // Criar agendamento no banco de dados
          const { error: insertError } = await supabase
            .from('appointments')
            .insert({
              attendant_id: attendant.id,
              attendant_name: attendant.name,
              service_id: serviceId,
              service_name: serviceName,
              service_price: servicePrice,
              service_duration: serviceDuration,
              patient_name: eventInfo.patientName || 'Paciente do Google Calendar',
              patient_phone: eventInfo.patientPhone || '',
              appointment_date: appointmentDate,
              appointment_time: appointmentTime,
              appointment_datetime: `${appointmentDate} ${appointmentTime}`,
              end_time: endTime,
              notes: `[Importado do Google Calendar]\n${eventInfo.notes}`,
              status: 'scheduled',
              google_event_id: event.id
            });
          
          if (insertError) {
            console.error(`  ❌ Erro ao criar agendamento:`, insertError);
          } else {
            totalEventsCreated++;
            console.log(`  ✅ Agendamento criado: ${eventInfo.patientName} - ${appointmentDate} ${appointmentTime}`);
          }
        }
        
        totalEventsSynced += events.length;
        
      } catch (error) {
        console.error(`  ❌ Erro ao sincronizar calendário de ${attendant.name}:`, error);
        
        await supabase.from('google_calendar_sync_log').insert({
          attendant_id: attendant.id,
          sync_type: 'poll',
          status: 'error',
          error_message: error.message
        });
      }
    }
    
    // Log de sincronização geral
    await supabase.from('google_calendar_sync_log').insert({
      sync_type: 'poll',
      status: 'success',
      events_synced: totalEventsCreated
    });
    
    console.log(`🎉 Polling concluído! ${totalEventsSynced} eventos verificados, ${totalEventsCreated} criados`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Polling concluído',
      events_checked: totalEventsSynced,
      events_created: totalEventsCreated,
      attendants_processed: attendants.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função google-calendar-poll:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
