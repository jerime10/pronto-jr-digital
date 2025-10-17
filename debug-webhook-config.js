import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

async function debugWebhookConfig() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== DIAGNÓSTICO: CONFIGURAÇÃO DO WEBHOOK ===\n');

  // 1. Buscar TODAS as configurações
  console.log('1️⃣ Buscando TODAS as configurações da tabela site_settings...\n');
  const { data: allSettings, error: allError } = await supabase
    .from('site_settings')
    .select('*')
    .order('updated_at', { ascending: false });

  if (allError) {
    console.error('❌ Erro ao buscar configurações:', allError);
    return;
  }

  console.log(`📊 Total de registros encontrados: ${allSettings?.length || 0}\n`);

  if (allSettings && allSettings.length > 0) {
    allSettings.forEach((setting, index) => {
      console.log(`\n📋 Registro ${index + 1}:`);
      console.log(`   ID: ${setting.id}`);
      console.log(`   Updated at: ${setting.updated_at}`);
      console.log(`   whatsapp_webhook_url: ${setting.whatsapp_webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   whatsapp_reminder_webhook_url: ${setting.whatsapp_reminder_webhook_url || 'NÃO CONFIGURADO'}`);
      console.log(`   whatsapp_recurring_reminder_webhook_url: ${setting.whatsapp_recurring_reminder_webhook_url || 'NÃO CONFIGURADO'}`);
    });
  }

  // 2. Tentar buscar com a mesma query da edge function
  console.log('\n\n2️⃣ Testando query exata da edge function...\n');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('whatsapp_recurring_reminder_webhook_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (settingsError) {
    console.error('❌ Erro na query:', settingsError);
  } else {
    console.log('✅ Query executada com sucesso');
    console.log('📦 Resultado:', settings);
    console.log(`🔗 Webhook URL: ${settings?.whatsapp_recurring_reminder_webhook_url || 'NULL/UNDEFINED'}`);
  }

  // 3. Verificar campos disponíveis
  console.log('\n\n3️⃣ Verificando estrutura da tabela...\n');
  const { data: structure, error: structureError } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single();

  if (!structureError && structure) {
    console.log('📋 Campos disponíveis na tabela:');
    Object.keys(structure).forEach(key => {
      console.log(`   - ${key}: ${typeof structure[key]} = ${structure[key]}`);
    });
  }

  console.log('\n\n=== FIM DO DIAGNÓSTICO ===');
}

debugWebhookConfig().catch(console.error);
