import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

async function testRecurringReminders() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== TESTE DE DIAGNÓSTICO: LEMBRETES RECORRENTES ===\n');

  // 1. Verificar se a URL do webhook está configurada
  console.log('1️⃣ Verificando configuração do webhook...');
  const { data: allSettings, error: allError } = await supabase
    .from('site_settings')
    .select('*');

  if (allError) {
    console.error('❌ Erro ao buscar todas as configurações:', allError);
  } else {
    console.log(`✅ Total de registros em site_settings: ${allSettings?.length || 0}`);
    allSettings?.forEach((setting, index) => {
      console.log(`\n   Registro ${index + 1}:`);
      console.log(`   - ID: ${setting.id}`);
      console.log(`   - whatsapp_recurring_reminder_webhook_url: ${setting.whatsapp_recurring_reminder_webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   - whatsapp_webhook_url (aviso agendamento): ${setting.whatsapp_webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   - updated_at: ${setting.updated_at}`);
    });
  }

  // 2. Buscar da mesma forma que a edge function busca
  console.log('\n2️⃣ Buscando da mesma forma que a edge function...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('whatsapp_recurring_reminder_webhook_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (settingsError) {
    console.error('❌ Erro ao buscar webhook settings:', settingsError);
  } else {
    console.log('✅ Configuração encontrada:');
    console.log(`   - whatsapp_recurring_reminder_webhook_url: ${settings?.whatsapp_recurring_reminder_webhook_url || 'NÃO CONFIGURADO'}`);
  }

  const webhookUrl = settings?.whatsapp_recurring_reminder_webhook_url;

  if (!webhookUrl) {
    console.error('\n❌ PROBLEMA IDENTIFICADO: URL do webhook não está configurada!');
    console.log('\n📋 SOLUÇÃO:');
    console.log('   1. Acesse as configurações do admin');
    console.log('   2. Vá para a seção "Links Públicos e Webhooks"');
    console.log('   3. Preencha o campo "URL do Webhook WhatsApp Lembretes Recorrentes"');
    console.log('   4. Salve as configurações');
    return;
  }

  console.log(`\n✅ Webhook URL configurada: ${webhookUrl}`);

  // 3. Buscar agendamentos de teste
  console.log('\n3️⃣ Buscando agendamentos...');
  
  const now = new Date();
  const nowBrasilia = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  const todayBrasilia = nowBrasilia.toISOString().split('T')[0];

  console.log(`   - Data atual (UTC): ${now.toISOString()}`);
  console.log(`   - Data atual (Brasília): ${nowBrasilia.toISOString()}`);
  console.log(`   - Data de busca: ${todayBrasilia}`);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', 'scheduled')
    .gte('appointment_date', todayBrasilia)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return;
  }

  console.log(`\n✅ Encontrados ${appointments?.length || 0} agendamentos`);

  if (!appointments || appointments.length === 0) {
    console.log('\n⚠️ Nenhum agendamento encontrado para testar');
    return;
  }

  // 4. Simular verificação de lembretes
  console.log('\n4️⃣ Simulando verificação de lembretes...\n');

  for (const appointment of appointments) {
    const [year, month, day] = appointment.appointment_date.split('-').map(Number);
    const [hours, minutes, seconds] = appointment.appointment_time.split(':').map(Number);
    
    const appointmentBrasilia = new Date(year, month - 1, day, hours, minutes, seconds || 0);
    const appointmentUTC = new Date(appointmentBrasilia.getTime() + (3 * 60 * 60 * 1000));
    
    const timeDiff = appointmentUTC.getTime() - now.getTime();
    const hoursUntil = timeDiff / (60 * 60 * 1000);
    const minutesUntil = timeDiff / (60 * 1000);

    console.log(`📅 Agendamento ${appointment.id}:`);
    console.log(`   - Paciente: ${appointment.patient_name}`);
    console.log(`   - Data: ${appointment.appointment_date} ${appointment.appointment_time}`);
    console.log(`   - Horas até: ${hoursUntil.toFixed(2)}h`);
    console.log(`   - Minutos até: ${minutesUntil.toFixed(2)}min`);

    let reminderType = null;

    if (hoursUntil >= 23 && hoursUntil <= 25) {
      reminderType = '24h';
      console.log(`   ✅ DEVERIA ENVIAR: Lembrete 24h`);
    } else if (minutesUntil >= 30 && minutesUntil <= 90) {
      reminderType = '90min';
      console.log(`   ✅ DEVERIA ENVIAR: Lembrete 90min`);
    } else if (minutesUntil >= 28 && minutesUntil <= 32) {
      reminderType = '30min';
      console.log(`   ✅ DEVERIA ENVIAR: Lembrete 30min`);
    } else {
      console.log(`   ⏭️ Fora da janela de lembretes`);
    }

    if (reminderType) {
      // Verificar log
      const { data: logs } = await supabase
        .from('appointment_reminders_log')
        .select('*')
        .eq('appointment_id', appointment.id)
        .eq('reminder_type', reminderType)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        console.log(`   📝 Último envio: ${logs[0].sent_at} (${logs[0].status})`);
      } else {
        console.log(`   📝 Nunca foi enviado`);
      }
    }

    console.log('');
  }

  console.log('\n=== FIM DO TESTE ===');
}

testRecurringReminders().catch(console.error);
