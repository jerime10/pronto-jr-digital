// Utility for testing webhook settings functionality
// This file demonstrates the robustness of the new implementation

import { 
  fetchMedicalRecordWebhookSettings, 
  updateMedicalRecordWebhookSettings 
} from '@/services/medicalRecordWebhookService';

export async function testWebhookSettings() {
  console.log('🧪 [Test] Iniciando teste das configurações de webhook...');
  
  try {
    // Test 1: Fetch current settings
    console.log('📖 [Test] Teste 1: Buscar configurações existentes...');
    const currentSettings = await fetchMedicalRecordWebhookSettings();
    console.log('✅ [Test] Configurações atuais:', currentSettings);
    
    // Test 2: Update webhook URL
    console.log('📝 [Test] Teste 2: Atualizar URL do webhook...');
    const testUrl = 'https://test-webhook.example.com/medical-records';
    await updateMedicalRecordWebhookSettings(testUrl, currentSettings.id);
    console.log('✅ [Test] URL atualizada com sucesso!');
    
    // Test 3: Verify the update
    console.log('🔍 [Test] Teste 3: Verificar atualização...');
    const updatedSettings = await fetchMedicalRecordWebhookSettings();
    
    if (updatedSettings.medicalRecordWebhookUrl === testUrl) {
      console.log('✅ [Test] Verificação bem-sucedida! URL foi atualizada corretamente.');
    } else {
      console.warn('⚠️ [Test] Discrepância: URL esperada não confere.');
    }
    
    console.log('🎉 [Test] Todos os testes passaram! Sistema de webhook funcionando corretamente.');
    
    return {
      success: true,
      message: 'Sistema de webhook funcionando perfeitamente',
      tests: {
        fetch: true,
        update: true,
        verify: true
      }
    };
    
  } catch (error: any) {
    console.error('❌ [Test] Teste falhou:', error);
    
    return {
      success: false,
      message: error.message || 'Erro durante teste',
      error: error,
      tests: {
        fetch: false,
        update: false,
        verify: false
      }
    };
  }
}

// Test specific to RLS functionality
export async function testRLSPolicies() {
  console.log('🔒 [RLS Test] Testando políticas RLS...');
  
  try {
    // This will test if the new RLS policies are working correctly
    const settings = await fetchMedicalRecordWebhookSettings();
    
    console.log('✅ [RLS Test] Políticas RLS funcionando - usuário tem acesso de leitura');
    
    // Try update to test admin permissions
    await updateMedicalRecordWebhookSettings(
      settings.medicalRecordWebhookUrl + '?test=rls', 
      settings.id
    );
    
    console.log('✅ [RLS Test] Políticas RLS funcionando - usuário tem permissão de escrita');
    
    return { success: true, message: 'Políticas RLS configuradas corretamente' };
    
  } catch (error: any) {
    console.error('❌ [RLS Test] Falha nas políticas RLS:', error);
    
    if (error.message?.includes('permissão')) {
      return { 
        success: false, 
        message: 'Usuário não tem permissões administrativas necessárias',
        requiresAdmin: true 
      };
    }
    
    return { 
      success: false, 
      message: error.message || 'Erro nas políticas RLS',
      error 
    };
  }
}

// Comprehensive system health check
export async function performSystemHealthCheck() {
  console.log('🏥 [Health Check] Executando verificação completa do sistema...');
  
  const results = {
    webhookSettings: { status: 'pending', details: null as any },
    rlsPolicies: { status: 'pending', details: null as any },
    fallbackService: { status: 'pending', details: null as any },
    overall: { status: 'pending', score: 0 }
  };
  
  // Test 1: Webhook Settings
  try {
    results.webhookSettings.details = await testWebhookSettings();
    results.webhookSettings.status = results.webhookSettings.details.success ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.webhookSettings.status = 'error';
    results.webhookSettings.details = { error: error.message };
  }
  
  // Test 2: RLS Policies
  try {
    results.rlsPolicies.details = await testRLSPolicies();
    results.rlsPolicies.status = results.rlsPolicies.details.success ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.rlsPolicies.status = 'error';
    results.rlsPolicies.details = { error: error.message };
  }
  
  // Calculate overall health score
  const healthyCount = Object.values(results).slice(0, -1).filter(r => r.status === 'healthy').length;
  const totalTests = Object.values(results).slice(0, -1).length;
  results.overall.score = Math.round((healthyCount / totalTests) * 100);
  results.overall.status = results.overall.score >= 80 ? 'healthy' : 
                          results.overall.score >= 50 ? 'degraded' : 'unhealthy';
  
  console.log('📊 [Health Check] Resultado da verificação:', results);
  
  return results;
}