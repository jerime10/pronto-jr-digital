import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppReminderPayload {
  appointment_id: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  attendant_name: string;
  status: string;
  reminder_type: '15s' | '2h' | '30min';
  partner_username?: string;
  created_by_user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 WhatsApp Reminder function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payload from request
    const payload: WhatsAppReminderPayload = await req.json();
    console.log('📦 Payload received:', JSON.stringify(payload, null, 2));

    // Validate payload
    if (!payload.appointment_id || !payload.patient_phone) {
      throw new Error('Missing required fields: appointment_id or patient_phone');
    }

    // Get webhook URL from settings
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('whatsapp_reminder_webhook_url')
      .limit(1)
      .single();

    if (settingsError || !settings?.whatsapp_reminder_webhook_url) {
      console.error('❌ Webhook URL not configured:', settingsError);
      throw new Error('WhatsApp webhook URL not configured in site settings');
    }

    const webhookUrl = settings.whatsapp_reminder_webhook_url;
    console.log('📍 Webhook URL:', webhookUrl);

    // Buscar dados do usuário que criou o agendamento (parceiro ou admin)
    let creatorName = null;
    let creatorPhone = null;
    let creatorType = 'Sistema';
    
    if (payload.partner_username) {
      // Se partner_username é 'ADM', buscar por user_type = 'admin'
      // Caso contrário, buscar por username normal
      let query = supabase
        .from('usuarios')
        .select('full_name, phone, user_type, partner_code')
        .eq('is_active', true);
      
      if (payload.partner_username === 'ADM') {
        query = query.eq('user_type', 'admin');
      } else {
        query = query.eq('username', payload.partner_username);
      }
      
      const { data: userData, error: userError } = await query.maybeSingle();
      
      if (!userError && userData) {
        creatorName = userData.full_name;
        creatorPhone = userData.phone;
        creatorType = userData.user_type === 'admin' ? 'Administrador' : 'Parceiro';
        console.log('👤 Dados do criador encontrados:', { 
          nome: creatorName, 
          telefone: creatorPhone,
          tipo: creatorType,
          partner_code: userData.partner_code
        });
      } else {
        console.log('⚠️ Criador não encontrado para username:', payload.partner_username);
      }
    }

    // Prepare message based on reminder type
    let message = '';
    switch (payload.reminder_type) {
      case '15s':
        message = `✅ Agendamento Confirmado!\n\n` +
          `Olá ${payload.patient_name}! 👋\n\n` +
          `Seu agendamento foi confirmado com sucesso:\n\n` +
          `📅 Data: ${payload.appointment_date}\n` +
          `🕐 Horário: ${payload.appointment_time}\n` +
          `💼 Serviço: ${payload.service_name}\n` +
          `👨‍⚕️ Profissional: ${payload.attendant_name}\n\n` +
          `Você receberá lembretes antes da consulta. Até breve! 😊`;
        break;
      case '2h':
        message = `⏰ Lembrete de Consulta\n\n` +
          `Olá ${payload.patient_name}! 👋\n\n` +
          `Sua consulta está próxima (em 2 horas):\n\n` +
          `📅 Data: ${payload.appointment_date}\n` +
          `🕐 Horário: ${payload.appointment_time}\n` +
          `💼 Serviço: ${payload.service_name}\n` +
          `👨‍⚕️ Profissional: ${payload.attendant_name}\n\n` +
          `Não esqueça! Até logo! 😊`;
        break;
      case '30min':
        message = `🚨 Lembrete Final - 30 minutos!\n\n` +
          `Olá ${payload.patient_name}! 👋\n\n` +
          `Sua consulta está chegando (em 30 minutos):\n\n` +
          `📅 Data: ${payload.appointment_date}\n` +
          `🕐 Horário: ${payload.appointment_time}\n` +
          `💼 Serviço: ${payload.service_name}\n` +
          `👨‍⚕️ Profissional: ${payload.attendant_name}\n\n` +
          `Estamos te esperando! 😊`;
        break;
    }

    // Send to external webhook
    const webhookPayload = {
      phone: payload.patient_phone,
      message: message,
      appointment_id: payload.appointment_id,
      reminder_type: payload.reminder_type,
      patient_name: payload.patient_name,
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      service_name: payload.service_name,
      attendant_name: payload.attendant_name,
      status: payload.status,
      creator_name: creatorName,
      creator_phone: creatorPhone,
      creator_type: creatorType,
      partner_username: payload.partner_username,
      partner_code: payload.partner_username // Manter compatibilidade com n8n
    };

    console.log('📤 Sending to webhook:', webhookUrl);
    console.log('📦 Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('❌ Webhook error:', webhookResponse.status, errorText);
      throw new Error(`Webhook failed: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook response:', JSON.stringify(webhookResult, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp reminder sent successfully',
        reminder_type: payload.reminder_type,
        appointment_id: payload.appointment_id,
        webhook_response: webhookResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in whatsapp-reminder function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
