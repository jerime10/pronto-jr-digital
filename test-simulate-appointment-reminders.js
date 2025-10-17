import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

async function testAppointmentReminders() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== TESTE COMPLETO: LEMBRETES RECORRENTES ===\n');

  // 1. Verificar configuração do webhook
  console.log('1️⃣ Verificando configuração do webhook...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('whatsapp_recurring_reminder_webhook_url, whatsapp_webhook_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (settingsError) {
    console.error('❌ Erro ao buscar configurações:', settingsError);
    return;
  }

  console.log('\n📋 Configurações encontradas:');
  console.log(`   - URL Webhook Aviso Agendamento: ${settings?.whatsapp_webhook_url || 'NÃO CONFIGURADO'}`);
  console.log(`   - URL Webhook Lembretes Recorrentes: ${settings?.whatsapp_recurring_reminder_webhook_url || 'NÃO CONFIGURADO'}`);

  const webhookUrl = settings?.whatsapp_recurring_reminder_webhook_url;

  if (!webhookUrl) {
    console.error('\n❌ PROBLEMA: URL do webhook de lembretes recorrentes não está configurada!');
    console.log('\n📝 Para configurar:');
    console.log('   1. Acesse: https://vtthxoovjswtrwfrdlha.supabase.co (seu painel Lovable)');
    console.log('   2. Vá em Configurações > Links Públicos e Webhooks');
    console.log('   3. Preencha "URL do Webhook WhatsApp Lembretes Recorrentes"');
    console.log('   4. Salve as configurações');
    return;
  }

  console.log('\n✅ Webhook URL configurada corretamente!\n');

  // 2. Buscar atendente e serviço para criar agendamentos de teste
  console.log('2️⃣ Buscando dados para criar agendamentos de teste...');
  
  const { data: attendants } = await supabase
    .from('attendants')
    .select('id, name')
    .eq('is_active', true)
    .limit(1)
    .single();

  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration')
    .eq('available', true)
    .limit(1)
    .single();

  if (!attendants || !services) {
    console.error('❌ Não há atendentes ou serviços cadastrados');
    return;
  }

  console.log(`✅ Atendente: ${attendants.name}`);
  console.log(`✅ Serviço: ${services.name}`);

  // 3. Criar agendamentos de teste para diferentes janelas de tempo
  console.log('\n3️⃣ Criando agendamentos de teste...');
  
  const now = new Date();
  const testAppointments = [];

  // Criar 3 agendamentos:
  // 1. Daqui a 24 horas (para teste de lembrete 24h)
  // 2. Daqui a 60 minutos (para teste de lembrete 90min)
  // 3. Daqui a 30 minutos (para teste de lembrete 30min)

  const scenarios = [
    { offset: 24 * 60 * 60 * 1000, name: '24h' },
    { offset: 60 * 60 * 1000, name: '60min (janela 90min)' },
    { offset: 30 * 60 * 1000, name: '30min' }
  ];

  for (const scenario of scenarios) {
    const appointmentTime = new Date(now.getTime() + scenario.offset);
    
    // Ajustar para horário de Brasília (GMT-3)
    const brasilia = new Date(appointmentTime.getTime() - (3 * 60 * 60 * 1000));
    const appointmentDate = brasilia.toISOString().split('T')[0];
    const appointmentTimeStr = brasilia.toTimeString().split(' ')[0].substring(0, 5);

    console.log(`\n   📅 Criando agendamento para teste ${scenario.name}:`);
    console.log(`      Data: ${appointmentDate} ${appointmentTimeStr}`);

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_name: `Teste Lembrete ${scenario.name}`,
        patient_phone: '5591985958042',
        attendant_id: attendants.id,
        attendant_name: attendants.name,
        service_id: services.id,
        service_name: services.name,
        service_price: services.price,
        service_duration: services.duration,
        appointment_date: appointmentDate,
        appointment_time: appointmentTimeStr,
        appointment_datetime: `${appointmentDate} ${appointmentTimeStr}`,
        status: 'scheduled',
        notes: `Teste automático - ${scenario.name}`
      })
      .select()
      .single();

    if (appointmentError) {
      console.error(`      ❌ Erro ao criar agendamento:`, appointmentError);
    } else {
      console.log(`      ✅ Agendamento criado: ${appointment.id}`);
      testAppointments.push({ ...appointment, scenario: scenario.name });
    }
  }

  // 4. Simular envio de lembretes
  console.log('\n4️⃣ Simulando envio de lembretes...\n');

  for (const appointment of testAppointments) {
    console.log(`📤 Simulando lembrete para: ${appointment.patient_name}`);
    console.log(`   Cenário: ${appointment.scenario}`);
    console.log(`   ID: ${appointment.id}`);

    // Determinar tipo de lembrete baseado no cenário
    let reminderType;
    if (appointment.scenario === '24h') reminderType = '24h';
    else if (appointment.scenario.includes('90min')) reminderType = '90min';
    else reminderType = '30min';

    // Preparar payload
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

    console.log(`   Payload:`, JSON.stringify(payload, null, 2));

    try {
      // Tentar enviar para o webhook
      console.log(`   🌐 Enviando para: ${webhookUrl}`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`   ✅ Webhook respondeu com sucesso (${response.status})`);
        const responseText = await response.text();
        console.log(`   📥 Resposta: ${responseText}`);

        // Registrar no log
        await supabase
          .from('appointment_reminders_log')
          .insert({
            appointment_id: appointment.id,
            reminder_type: reminderType,
            status: 'sent'
          });

        console.log(`   ✅ Log registrado com sucesso`);
      } else {
        const errorText = await response.text();
        console.error(`   ❌ Webhook retornou erro: ${response.status}`);
        console.error(`   📥 Resposta: ${errorText}`);

        // Registrar erro no log
        await supabase
          .from('appointment_reminders_log')
          .insert({
            appointment_id: appointment.id,
            reminder_type: reminderType,
            status: 'failed',
            error_message: `HTTP ${response.status}: ${errorText}`
          });
      }
    } catch (error) {
      console.error(`   ❌ Erro ao enviar webhook:`, error.message);

      // Registrar erro no log
      await supabase
        .from('appointment_reminders_log')
        .insert({
          appointment_id: appointment.id,
          reminder_type: reminderType,
          status: 'failed',
          error_message: error.message
        });
    }

    console.log('');
  }

  // 5. Verificar logs criados
  console.log('5️⃣ Verificando logs criados...\n');

  for (const appointment of testAppointments) {
    const { data: logs } = await supabase
      .from('appointment_reminders_log')
      .select('*')
      .eq('appointment_id', appointment.id)
      .order('sent_at', { ascending: false });

    console.log(`📝 Logs para ${appointment.patient_name}:`);
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        console.log(`   - ${log.reminder_type}: ${log.status} em ${log.sent_at}`);
        if (log.error_message) {
          console.log(`     Erro: ${log.error_message}`);
        }
      });
    } else {
      console.log(`   Nenhum log encontrado`);
    }
    console.log('');
  }

  // 6. Resumo
  console.log('=== RESUMO DO TESTE ===');
  console.log(`✅ Agendamentos criados: ${testAppointments.length}`);
  console.log(`✅ Webhook URL: ${webhookUrl}`);
  console.log(`\n📋 IDs dos agendamentos criados para limpeza:`);
  testAppointments.forEach(apt => {
    console.log(`   - ${apt.id} (${apt.scenario})`);
  });

  console.log('\n💡 Próximos passos:');
  console.log('   1. Verifique se os lembretes chegaram no n8n');
  console.log('   2. Verifique os logs na tabela appointment_reminders_log');
  console.log('   3. Se quiser, delete os agendamentos de teste criados');
  console.log('\n=== FIM DO TESTE ===');
}

testAppointmentReminders().catch(console.error);
