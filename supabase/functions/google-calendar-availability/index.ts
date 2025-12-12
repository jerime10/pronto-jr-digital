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
  const exp = now + 3600; // Token válido por 1 hora

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccountJson.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.freebusy',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: now
  };

  // Codificar header e payload em base64url
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Importar a chave privada
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
  
  // Assinar
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const jwt = `${signatureInput}.${signatureB64}`;
  
  // Trocar JWT por access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Erro ao obter access token:', tokenData);
    throw new Error(`Erro ao obter access token: ${tokenData.error_description || tokenData.error}`);
  }
  
  return tokenData.access_token;
}

// Função para buscar horários ocupados do Google Calendar
async function getBusySlots(
  accessToken: string, 
  calendarId: string, 
  dateStart: string, 
  dateEnd: string
): Promise<{ start: string; end: string }[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeMin: dateStart,
      timeMax: dateEnd,
      timeZone: 'America/Sao_Paulo',
      items: [{ id: calendarId }]
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Erro ao buscar freebusy:', data);
    throw new Error(`Erro ao buscar disponibilidade: ${data.error?.message || 'Erro desconhecido'}`);
  }
  
  const calendarBusy = data.calendars?.[calendarId]?.busy || [];
  console.log('📅 Horários ocupados encontrados:', calendarBusy.length);
  
  return calendarBusy;
}

// Função para gerar slots disponíveis
function generateAvailableSlots(
  date: string,
  startHour: number,
  endHour: number,
  slotDurationMinutes: number,
  busySlots: { start: string; end: string }[]
): { start_time: string; end_time: string; duration_minutes: number }[] {
  const slots: { start_time: string; end_time: string; duration_minutes: number }[] = [];
  
  // Converter horários ocupados para minutos do dia
  const busyRanges = busySlots.map(busy => {
    const startDate = new Date(busy.start);
    const endDate = new Date(busy.end);
    
    // Verificar se é do mesmo dia
    const busyDateStr = startDate.toISOString().split('T')[0];
    if (busyDateStr !== date) return null;
    
    return {
      startMinutes: startDate.getHours() * 60 + startDate.getMinutes(),
      endMinutes: endDate.getHours() * 60 + endDate.getMinutes()
    };
  }).filter(r => r !== null) as { startMinutes: number; endMinutes: number }[];
  
  console.log('📊 Busy ranges para o dia:', busyRanges);
  
  // Gerar todos os slots possíveis
  for (let minutes = startHour * 60; minutes + slotDurationMinutes <= endHour * 60; minutes += slotDurationMinutes) {
    const slotStartMinutes = minutes;
    const slotEndMinutes = minutes + slotDurationMinutes;
    
    // Verificar se o slot conflita com algum horário ocupado
    const isConflicting = busyRanges.some(busy => 
      (slotStartMinutes < busy.endMinutes && slotEndMinutes > busy.startMinutes)
    );
    
    if (!isConflicting) {
      const startHourSlot = Math.floor(slotStartMinutes / 60);
      const startMinSlot = slotStartMinutes % 60;
      const endHourSlot = Math.floor(slotEndMinutes / 60);
      const endMinSlot = slotEndMinutes % 60;
      
      slots.push({
        start_time: `${startHourSlot.toString().padStart(2, '0')}:${startMinSlot.toString().padStart(2, '0')}`,
        end_time: `${endHourSlot.toString().padStart(2, '0')}:${endMinSlot.toString().padStart(2, '0')}`,
        duration_minutes: slotDurationMinutes
      });
    }
  }
  
  console.log('✅ Slots disponíveis gerados:', slots.length);
  return slots;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attendant_id, date, service_duration, start_hour, end_hour } = await req.json();
    
    console.log('📥 Requisição recebida:', { attendant_id, date, service_duration, start_hour, end_hour });
    
    // Validações
    if (!attendant_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'attendant_id é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!date) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'date é obrigatório (formato: YYYY-MM-DD)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar google_calendar_id do atendente
    const { data: attendant, error: attendantError } = await supabase
      .from('attendants')
      .select('id, name, google_calendar_id')
      .eq('id', attendant_id)
      .single();
    
    if (attendantError || !attendant) {
      console.error('Erro ao buscar atendente:', attendantError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Atendente não encontrado' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!attendant.google_calendar_id) {
      console.log('⚠️ Atendente sem Google Calendar ID configurado');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Atendente não possui Google Calendar configurado',
        available_slots: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('👤 Atendente encontrado:', attendant.name, 'Calendar ID:', attendant.google_calendar_id);
    
    // Carregar Service Account JSON
    const serviceAccountJsonStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJsonStr) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração do Google Calendar não encontrada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const serviceAccountJson = JSON.parse(serviceAccountJsonStr);
    
    // Obter access token
    console.log('🔑 Obtendo access token...');
    const accessToken = await getAccessToken(serviceAccountJson);
    console.log('✅ Access token obtido com sucesso');
    
    // Definir período de busca (dia inteiro)
    const dateStart = `${date}T00:00:00-03:00`;
    const dateEnd = `${date}T23:59:59-03:00`;
    
    // Buscar horários ocupados
    console.log('📅 Buscando horários ocupados...');
    const busySlots = await getBusySlots(accessToken, attendant.google_calendar_id, dateStart, dateEnd);
    
    // Gerar slots disponíveis
    const defaultStartHour = start_hour || 8; // Padrão: 08:00
    const defaultEndHour = end_hour || 18; // Padrão: 18:00
    const slotDuration = service_duration || 30; // Padrão: 30 minutos
    
    const availableSlots = generateAvailableSlots(
      date,
      defaultStartHour,
      defaultEndHour,
      slotDuration,
      busySlots
    );
    
    // Log de sincronização
    await supabase.from('google_calendar_sync_log').insert({
      attendant_id: attendant_id,
      sync_type: 'availability_check',
      status: 'success',
      events_synced: busySlots.length
    });
    
    console.log('🎉 Resposta final:', { 
      success: true, 
      attendant_name: attendant.name,
      date,
      available_slots_count: availableSlots.length 
    });
    
    return new Response(JSON.stringify({
      success: true,
      attendant_id: attendant.id,
      attendant_name: attendant.name,
      date,
      available_slots: availableSlots,
      total_busy_slots: busySlots.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função google-calendar-availability:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
