import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

async function testScheduledReminders() {
  console.log('🧪 Testando Sistema de Lembretes Automáticos\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // 1. Buscar agendamentos do dia 16/10
  console.log('📋 Buscando agendamentos para 2025-10-16...');
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', 'scheduled')
    .eq('appointment_date', '2025-10-16')
    .order('appointment_time', { ascending: true });
  
  if (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return;
  }
  
  console.log(`✅ Encontrados ${appointments?.length || 0} agendamentos\n`);
  
  if (!appointments || appointments.length === 0) {
    console.log('⚠️ Nenhum agendamento encontrado para testar');
    return;
  }
  
  // 2. Para cada agendamento, calcular os horários dos lembretes
  for (const appt of appointments) {
    console.log('━'.repeat(80));
    console.log(`\n📅 Agendamento ID: ${appt.id}`);
    console.log(`   Paciente: ${appt.patient_name}`);
    console.log(`   Data: ${appt.appointment_date}`);
    console.log(`   Hora: ${appt.appointment_time}`);
    console.log(`   Status: ${appt.status}\n`);
    
    // O horário está em Brasília (GMT-3)
    // appointment_date: "2025-10-16"
    // appointment_time: "08:30:00"
    
    // Criar data em Brasília e converter para UTC
    const [year, month, day] = appt.appointment_date.split('-').map(Number);
    const [hours, minutes, seconds] = appt.appointment_time.split(':').map(Number);
    
    // Criar data no timezone de Brasília (UTC-3)
    // Brasília 08:30 = UTC 11:30 (adiciona 3 horas)
    const appointmentBrasilia = new Date(year, month - 1, day, hours, minutes, seconds);
    const appointmentUTC = new Date(appointmentBrasilia.getTime() + (3 * 60 * 60 * 1000));
    
    console.log('⏰ Horários:');
    console.log(`   Agendamento (Brasília): ${appointmentBrasilia.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   Agendamento (UTC): ${appointmentUTC.toISOString()}`);
    
    // Horário atual
    const nowUTC = new Date();
    const nowBrasilia = new Date(nowUTC.getTime() - (3 * 60 * 60 * 1000));
    
    console.log(`   Agora (Brasília): ${nowBrasilia.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`   Agora (UTC): ${nowUTC.toISOString()}\n`);
    
    // Calcular diferença
    const diffMs = appointmentUTC.getTime() - nowUTC.getTime();
    const diffHours = diffMs / (60 * 60 * 1000);
    const diffMinutes = diffMs / (60 * 1000);
    
    console.log('📊 Tempo até o agendamento:');
    console.log(`   ${diffHours.toFixed(2)} horas`);
    console.log(`   ${diffMinutes.toFixed(2)} minutos\n`);
    
    // Determinar qual lembrete deveria ser enviado
    console.log('🔔 Lembretes que deveriam ser enviados:');
    
    if (diffHours >= 23 && diffHours <= 25) {
      console.log('   ✅ Lembrete de 24 horas (entre 23h e 25h antes)');
    } else if (diffMinutes >= 30 && diffMinutes <= 90) {
      console.log('   ✅ Lembrete de 90 minutos (entre 30min e 90min antes)');
    } else if (diffMinutes >= 28 && diffMinutes <= 32) {
      console.log('   ✅ Lembrete de 30 minutos (entre 28min e 32min antes)');
    } else {
      console.log('   ⏭️ Nenhum lembrete deve ser enviado agora');
      
      // Calcular quando os lembretes devem ser enviados
      const lembrete24h = new Date(appointmentUTC.getTime() - (24 * 60 * 60 * 1000));
      const lembrete90min = new Date(appointmentUTC.getTime() - (90 * 60 * 1000));
      const lembrete30min = new Date(appointmentUTC.getTime() - (30 * 60 * 1000));
      
      console.log('\n📅 Horários dos lembretes:');
      console.log(`   24h antes: ${lembrete24h.toISOString()} (${new Date(lembrete24h.getTime() - 3 * 60 * 60 * 1000).toLocaleString('pt-BR')})`);
      console.log(`   90min antes: ${lembrete90min.toISOString()} (${new Date(lembrete90min.getTime() - 3 * 60 * 60 * 1000).toLocaleString('pt-BR')})`);
      console.log(`   30min antes: ${lembrete30min.toISOString()} (${new Date(lembrete30min.getTime() - 3 * 60 * 60 * 1000).toLocaleString('pt-BR')})`);
    }
    
    // Verificar logs de lembretes já enviados
    console.log('\n📝 Verificando lembretes já enviados...');
    const { data: logs } = await supabase
      .from('appointment_reminders_log')
      .select('*')
      .eq('appointment_id', appt.id)
      .order('sent_at', { ascending: false });
    
    if (logs && logs.length > 0) {
      console.log(`   Foram enviados ${logs.length} lembretes:`);
      logs.forEach(log => {
        console.log(`   - ${log.reminder_type}: ${log.status} em ${log.sent_at}`);
      });
    } else {
      console.log('   ⚠️ Nenhum lembrete foi enviado ainda');
    }
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n✅ Teste concluído\n');
}

testScheduledReminders().catch(console.error);
