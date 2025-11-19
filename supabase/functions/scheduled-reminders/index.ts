import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Scheduled Reminders function invoked');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ajustar para o timezone de Brasília (GMT-3)
    const now = new Date();
    const nowBrasilia = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const todayBrasilia = nowBrasilia.toISOString().split('T')[0];

    console.log('⏰ Timestamps:', {
      nowUTC: now.toISOString(),
      nowBrasilia: nowBrasilia.toISOString(),
      todayBrasilia: todayBrasilia
    });

    // Buscar webhook URL do n8n para lembretes recorrentes
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('whatsapp_recurring_reminder_webhook_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) {
      console.error('❌ Error fetching webhook settings:', settingsError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching webhook settings',
          details: settingsError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const webhookUrl = settings?.whatsapp_recurring_reminder_webhook_url;

    if (!webhookUrl) {
      console.error('❌ No webhook URL configured for recurring reminders');
      return new Response(
        JSON.stringify({ 
          error: 'Webhook URL not configured',
          message: 'Please configure whatsapp_recurring_reminder_webhook_url in site_settings'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`🔗 Using webhook URL: ${webhookUrl}\n`);

    // Buscar todos os agendamentos de hoje e futuros com status 'scheduled'
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'scheduled')
      .gte('appointment_date', todayBrasilia)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      throw error;
    }

    console.log(`📋 Found ${appointments?.length || 0} scheduled appointments`);

    let sent24h = 0;
    let sent90min = 0;
    let sent30min = 0;
    let skipped = 0;

    for (const appointment of appointments || []) {
      // appointment_date e appointment_time estão em horário de Brasília (GMT-3)
      // Precisamos converter para UTC para comparar com now (que está em UTC)
      
      // Extrair componentes da data e hora
      const [year, month, day] = appointment.appointment_date.split('-').map(Number);
      const [hours, minutes, seconds] = appointment.appointment_time.split(':').map(Number);
      
      // Criar Date object no timezone local (servidor está em UTC)
      // Como os dados estão em Brasília (GMT-3), precisamos converter para UTC
      // Brasília 08:30 = UTC 11:30 (adiciona 3 horas)
      const appointmentBrasilia = new Date(year, month - 1, day, hours, minutes, seconds || 0);
      const appointmentUTC = new Date(appointmentBrasilia.getTime() + (3 * 60 * 60 * 1000));
      
      const timeDiff = appointmentUTC.getTime() - now.getTime();
      const hoursUntil = timeDiff / (60 * 60 * 1000);
      const minutesUntil = timeDiff / (60 * 1000);

      console.log(`\n📅 Appointment ${appointment.id}:`, {
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        appointmentBrasilia: appointmentBrasilia.toISOString(),
        appointmentUTC: appointmentUTC.toISOString(),
        nowUTC: now.toISOString(),
        hoursUntil: hoursUntil.toFixed(2),
        minutesUntil: minutesUntil.toFixed(2)
      });

      let reminderType: '24h' | '90min' | '30min' | null = null;
      let shouldSend = false;

      // REGRA 1: 24 horas antes - enviar 1x ao dia
      if (hoursUntil >= 23 && hoursUntil <= 25) {
        reminderType = '24h';
        
        // Verificar se já enviou nas últimas 23 horas
        const { data: logs, error: logError } = await supabase
          .from('appointment_reminders_log')
          .select('*')
          .eq('appointment_id', appointment.id)
          .eq('reminder_type', '24h')
          .gte('sent_at', new Date(now.getTime() - (23 * 60 * 60 * 1000)).toISOString())
          .limit(1);

        if (logError) {
          console.error('❌ Error checking logs:', logError);
          continue;
        }

        if (!logs || logs.length === 0) {
          shouldSend = true;
          console.log('✅ 24h reminder - should send (not sent in last 23h)');
        } else {
          console.log('⏭️ 24h reminder - skip (already sent recently)');
        }
      }

      // REGRA 2: 90 minutos antes - enviar a cada 30 minutos
      else if (minutesUntil >= 30 && minutesUntil <= 90) {
        reminderType = '90min';
        
        // Verificar se já enviou nos últimos 29 minutos
        const { data: logs, error: logError } = await supabase
          .from('appointment_reminders_log')
          .select('*')
          .eq('appointment_id', appointment.id)
          .eq('reminder_type', '90min')
          .gte('sent_at', new Date(now.getTime() - (29 * 60 * 1000)).toISOString())
          .limit(1);

        if (logError) {
          console.error('❌ Error checking logs:', logError);
          continue;
        }

        if (!logs || logs.length === 0) {
          shouldSend = true;
          console.log('✅ 90min reminder - should send (not sent in last 29min)');
        } else {
          console.log('⏭️ 90min reminder - skip (already sent recently)');
        }
      }

      // REGRA 3: 30 minutos antes - enviar 1x
      else if (minutesUntil >= 28 && minutesUntil <= 32) {
        reminderType = '30min';
        
        // Verificar se já enviou esse tipo
        const { data: logs, error: logError } = await supabase
          .from('appointment_reminders_log')
          .select('*')
          .eq('appointment_id', appointment.id)
          .eq('reminder_type', '30min')
          .limit(1);

        if (logError) {
          console.error('❌ Error checking logs:', logError);
          continue;
        }

        if (!logs || logs.length === 0) {
          shouldSend = true;
          console.log('✅ 30min reminder - should send (never sent)');
        } else {
          console.log('⏭️ 30min reminder - skip (already sent)');
        }
      }

      if (!shouldSend || !reminderType) {
        skipped++;
        continue;
      }

      // Enviar lembrete diretamente para o webhook n8n
      console.log(`📤 Sending ${reminderType} reminder for appointment ${appointment.id}...`);
      
      try {
        const payload = {
          appointment_id: appointment.id,
          patient_name: appointment.patient_name,
          patient_phone: appointment.patient_phone,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          service_name: appointment.service_name,
          attendant_name: appointment.attendant_name,
          service_price: appointment.service_price,
          service_duration: appointment.service_duration,
          reminder_type: reminderType,
          partner_username: appointment.partner_username,
          partner_code: appointment.partner_code,
          status: appointment.status,
          notes: appointment.notes,
          dum: appointment.dum,
          gestational_age: appointment.gestational_age,
          estimated_due_date: appointment.estimated_due_date
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error(`❌ Webhook error: ${webhookResponse.status} - ${errorText}`);
          
          // Log erro
          await supabase
            .from('appointment_reminders_log')
            .insert({
              appointment_id: appointment.id,
              reminder_type: reminderType,
              status: 'failed',
              error_message: `Webhook error: ${webhookResponse.status}`,
              sent_at: now.toISOString()
            });
          
          continue;
        }

        // Log sucesso
        await supabase
          .from('appointment_reminders_log')
          .insert({
            appointment_id: appointment.id,
            reminder_type: reminderType,
            status: 'sent'
          });

        console.log(`✅ Reminder sent: ${reminderType} for appointment ${appointment.id}\n`);

        if (reminderType === '24h') sent24h++;
        else if (reminderType === '90min') sent90min++;
        else if (reminderType === '30min') sent30min++;

      } catch (error) {
        console.error(`❌ Error sending webhook request:`, error);
        
        // Log erro
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await supabase
          .from('appointment_reminders_log')
          .insert({
            appointment_id: appointment.id,
            reminder_type: reminderType,
            status: 'failed',
            error_message: errorMessage
          });
      }
    }

    const summary = {
      success: true,
      total_appointments: appointments?.length || 0,
      reminders_sent: {
        '24h': sent24h,
        '90min': sent90min,
        '30min': sent30min
      },
      skipped,
      timestamp: now.toISOString()
    };

    console.log('📊 Summary:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in scheduled-reminders function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.toString() : String(error)
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});