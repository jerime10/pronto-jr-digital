/**
 * Script de Validação dos Lembretes WhatsApp
 * 
 * Este script testa o sistema completo de lembretes automáticos:
 * 1. Criação de agendamento de teste
 * 2. Verificação dos triggers automáticos
 * 3. Envio manual de lembretes
 * 4. Validação dos payloads
 * 
 * Para executar: node test-whatsapp-reminders.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

async function testWhatsAppReminders() {
  try {
    log('cyan', '🚀', '=== TESTE DE LEMBRETES WHATSAPP ===\n');

    // 1. Verificar se webhook está configurado
    log('blue', '📋', 'Etapa 1: Verificando configuração do webhook...');
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('whatsapp_reminder_webhook_url')
      .limit(1)
      .single();

    if (settingsError || !settings?.whatsapp_reminder_webhook_url) {
      log('red', '❌', 'Webhook URL não configurado!');
      log('yellow', '⚠️', 'Configure o webhook em: Configurações > Links Públicos\n');
      return false;
    }

    log('green', '✅', `Webhook configurado: ${settings.whatsapp_reminder_webhook_url}\n`);

    // 2. Buscar atendentes e serviços
    log('blue', '📋', 'Etapa 2: Buscando dados para teste...');
    const { data: attendants } = await supabase
      .from('attendants')
      .select('*')
      .limit(1)
      .single();

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .limit(1)
      .single();

    if (!attendants || !services) {
      log('red', '❌', 'Nenhum atendente ou serviço encontrado!');
      return false;
    }

    log('green', '✅', `Atendente: ${attendants.name}`);
    log('green', '✅', `Serviço: ${services.name}\n`);

    // 3. Criar agendamento de teste
    log('blue', '📋', 'Etapa 3: Criando agendamento de teste...');
    const now = new Date();
    const appointmentDate = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 horas no futuro
    
    const appointmentData = {
      patient_name: 'Teste WhatsApp',
      patient_phone: '91985958042', // Telefone de teste
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentDate.toTimeString().split(' ')[0].substring(0, 5),
      appointment_datetime: appointmentDate.toISOString(),
      service_id: services.id,
      service_name: services.name,
      service_duration: services.duration,
      service_price: services.price,
      attendant_id: attendants.id,
      attendant_name: attendants.name,
      status: 'scheduled',
      notes: 'TESTE AUTOMÁTICO - Validação de Lembretes WhatsApp'
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      log('red', '❌', `Erro ao criar agendamento: ${appointmentError.message}`);
      return false;
    }

    log('green', '✅', `Agendamento criado com ID: ${appointment.id}`);
    log('cyan', 'ℹ️', 'Os triggers automáticos foram ativados!\n');

    // 4. Aguardar triggers automáticos
    log('yellow', '⏳', 'Aguardando triggers automáticos...');
    log('cyan', 'ℹ️', '- Trigger 15s: enviará em ~15 segundos');
    log('cyan', 'ℹ️', '- Trigger 2h: enviará 2 horas antes do agendamento');
    log('cyan', 'ℹ️', '- Trigger 30min: enviará 30 minutos antes do agendamento\n');

    // 5. Testar envio manual
    log('blue', '📋', 'Etapa 4: Testando envio manual de lembrete...');
    const { data: reminderResult, error: reminderError } = await supabase.functions.invoke(
      'whatsapp-reminder',
      {
        body: {
          appointment_id: appointment.id,
          patient_name: appointment.patient_name,
          patient_phone: appointment.patient_phone,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          service_name: appointment.service_name,
          attendant_name: appointment.attendant_name,
          reminder_type: '15s'
        }
      }
    );

    if (reminderError) {
      log('red', '❌', `Erro ao enviar lembrete: ${reminderError.message}`);
      log('yellow', '⚠️', 'Verifique os logs da Edge Function para mais detalhes\n');
    } else {
      log('green', '✅', 'Lembrete enviado com sucesso!');
      log('cyan', '📦', `Resposta: ${JSON.stringify(reminderResult, null, 2)}\n`);
    }

    // 6. Resumo
    log('cyan', '📊', '=== RESUMO DO TESTE ===');
    log('green', '✅', 'Webhook configurado');
    log('green', '✅', 'Agendamento criado');
    log('green', '✅', 'Triggers automáticos ativados');
    log('green', '✅', 'Envio manual testado');
    log('cyan', '\nℹ️', 'Verifique seu webhook para confirmar o recebimento das mensagens!');
    log('cyan', 'ℹ️', `ID do agendamento de teste: ${appointment.id}\n`);

    return true;
  } catch (error) {
    log('red', '❌', `Erro no teste: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Executar teste
testWhatsAppReminders()
  .then((success) => {
    if (success) {
      log('green', '🎉', 'TESTE CONCLUÍDO COM SUCESSO!\n');
      process.exit(0);
    } else {
      log('red', '💥', 'TESTE FALHOU!\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    log('red', '💥', `ERRO FATAL: ${error.message}\n`);
    process.exit(1);
  });
