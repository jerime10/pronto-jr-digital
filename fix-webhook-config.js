import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

async function fixWebhookConfig() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Corrigindo configuração do webhook...\n');

  // ID do registro mais recente (sem o webhook)
  const newestRecordId = '8d2de802-6089-41be-a6ad-671198968939';
  
  // URL correta do webhook recorrente
  const correctWebhookUrl = 'https://n8n.mentoriajrs.com/webhook/lembrete-recorrente';

  console.log(`📝 Atualizando registro ${newestRecordId}...`);
  console.log(`🔗 Definindo webhook: ${correctWebhookUrl}\n`);

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      whatsapp_recurring_reminder_webhook_url: correctWebhookUrl
    })
    .eq('id', newestRecordId)
    .select();

  if (error) {
    console.error('❌ Erro ao atualizar:', error);
    return;
  }

  console.log('✅ Configuração atualizada com sucesso!');
  console.log('📦 Registro atualizado:', data);
  
  console.log('\n✅ Pronto! Agora a Edge Function vai encontrar o webhook configurado.');
  console.log('🔄 Execute novamente o teste de lembretes para verificar.');
}

fixWebhookConfig().catch(console.error);
