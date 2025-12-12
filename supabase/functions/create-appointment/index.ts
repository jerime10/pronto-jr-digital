import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  eventData: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<string | null> {
  try {
    console.log('📅 [GCal] Criando evento no Google Calendar:', { calendarId, eventData });
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'America/Sao_Paulo'
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ [GCal] Erro ao criar evento:', data);
      return null;
    }
    
    console.log('✅ [GCal] Evento criado com sucesso, ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ [GCal] Erro ao criar evento:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      }
    )

    const appointmentData = await req.json()
    
    console.log('📅 [Edge Function] Creating appointment:', appointmentData)

    // Usar função SQL otimizada com timeout aumentado
    const { data: appointmentId, error } = await supabaseClient
      .rpc('insert_appointment', {
        p_patient_name: appointmentData.patient_name,
        p_patient_phone: appointmentData.patient_phone,
        p_patient_id: appointmentData.patient_id || null,
        p_attendant_id: appointmentData.attendant_id,
        p_attendant_name: appointmentData.attendant_name,
        p_service_id: appointmentData.service_id,
        p_service_name: appointmentData.service_name,
        p_service_price: appointmentData.service_price,
        p_service_duration: appointmentData.service_duration,
        p_appointment_date: appointmentData.appointment_date,
        p_appointment_time: appointmentData.appointment_time,
        p_appointment_datetime: appointmentData.appointment_datetime,
        p_end_time: appointmentData.end_time || null,
        p_notes: appointmentData.notes || '',
        p_status: appointmentData.status || 'scheduled',
        p_dum: appointmentData.dum || null,
        p_gestational_age: appointmentData.gestational_age || null,
        p_estimated_due_date: appointmentData.estimated_due_date || null,
        p_partner_username: appointmentData.partner_username || null,
        p_partner_code: appointmentData.partner_code || null,
        p_created_by_user_id: appointmentData.created_by_user_id || null
      })

    if (error) {
      console.error('❌ [Edge Function] Error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('✅ [Edge Function] Appointment created successfully with ID:', appointmentId)
    
    // Sincronizar com Google Calendar (se o atendente tiver calendar configurado)
    try {
      const { data: attendant } = await supabaseClient
        .from('attendants')
        .select('id, name, google_calendar_id')
        .eq('id', appointmentData.attendant_id)
        .single();
      
      if (attendant?.google_calendar_id) {
        console.log('📅 [GCal] Atendente tem Google Calendar configurado:', attendant.google_calendar_id);
        
        const serviceAccountJsonStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
        if (serviceAccountJsonStr) {
          const serviceAccountJson = JSON.parse(serviceAccountJsonStr);
          const accessToken = await getAccessToken(serviceAccountJson);
          
          // Calcular horário de término
          const duration = appointmentData.service_duration || 30;
          const [hours, minutes] = (appointmentData.appointment_time || '09:00').split(':').map(Number);
          const endMinutes = hours * 60 + minutes + duration;
          const endHour = Math.floor(endMinutes / 60);
          const endMin = endMinutes % 60;
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
          
          const startDateTime = `${appointmentData.appointment_date}T${appointmentData.appointment_time || '09:00'}:00`;
          const endDateTime = `${appointmentData.appointment_date}T${endTime}:00`;
          
          const googleEventId = await createGoogleCalendarEvent(accessToken, attendant.google_calendar_id, {
            summary: `${appointmentData.service_name} - ${appointmentData.patient_name}`,
            description: `Paciente: ${appointmentData.patient_name}\nTelefone: ${appointmentData.patient_phone || 'Não informado'}\nServiço: ${appointmentData.service_name}\n\n${appointmentData.notes || ''}`,
            startDateTime,
            endDateTime
          });
          
          if (googleEventId) {
            // Atualizar o appointment com o google_event_id
            await supabaseClient
              .from('appointments')
              .update({ google_event_id: googleEventId })
              .eq('id', appointmentId);
            
            console.log('✅ [GCal] Appointment atualizado com google_event_id:', googleEventId);
            
            // Log de sincronização
            await supabaseClient.from('google_calendar_sync_log').insert({
              attendant_id: appointmentData.attendant_id,
              sync_type: 'event_created',
              status: 'success',
              events_synced: 1
            });
          }
        }
      }
    } catch (gcalError) {
      console.error('⚠️ [GCal] Erro ao sincronizar com Google Calendar (não crítico):', gcalError);
      // Não falhar o agendamento por causa do Google Calendar
    }
    
    // Enviar lembrete WhatsApp de forma assíncrona (background task)
    const sendReminderTask = async () => {
      try {
        // Aguardar 15 segundos antes de enviar
        await new Promise(resolve => setTimeout(resolve, 15000))
        
        console.log('📤 [Background] Sending WhatsApp reminder for appointment:', appointmentId)
        
        // Chamar edge function whatsapp-reminder
        const reminderResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-reminder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              appointment_id: appointmentId,
              patient_name: appointmentData.patient_name,
              patient_phone: appointmentData.patient_phone,
              appointment_date: appointmentData.appointment_date,
              appointment_time: appointmentData.appointment_time,
              service_name: appointmentData.service_name,
              attendant_name: appointmentData.attendant_name,
              status: appointmentData.status || 'scheduled',
              reminder_type: '15s',
              partner_username: appointmentData.partner_username || null
            })
          }
        )
        
        if (reminderResponse.ok) {
          console.log('✅ [Background] WhatsApp reminder sent successfully')
        } else {
          const errorText = await reminderResponse.text()
          console.error('❌ [Background] Failed to send WhatsApp reminder:', errorText)
        }
      } catch (error) {
        console.error('❌ [Background] Error sending WhatsApp reminder:', error)
      }
    }
    
    // Executar tarefa em background sem bloquear resposta
    sendReminderTask()
    
    return new Response(
      JSON.stringify({ success: true, data: { id: appointmentId, message: 'Agendamento criado com sucesso' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ [Edge Function] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})