import { supabase } from '@/integrations/supabase/client';
import { fetchSiteSettings } from '@/services/siteSettingsService';
import { fetchMedicalRecordWebhookSettings } from '@/services/medicalRecordWebhookService';
import { fetchClinicSettings } from '@/services/clinicSettingsService';
import { fetchThemeSettings } from '@/services/themeSettingsService';
import { fetchWebhookSettings } from '@/services/webhookSettingsService';

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'error';
  components: {
    siteSettings: ComponentStatus;
    authentication: ComponentStatus;
    medicalRecordWebhook: ComponentStatus;
    clinicSettings: ComponentStatus;
    themeSettings: ComponentStatus;
    webhookSettings: ComponentStatus;
    database: ComponentStatus;
  };
  errors: string[];
  warnings: string[];
}

interface ComponentStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: string;
}

export async function performSystemHealthCheck(): Promise<SystemHealthStatus> {
  console.log('🔍 [Health Check] Iniciando verificação completa do sistema...');
  
  const healthStatus: SystemHealthStatus = {
    overall: 'healthy',
    components: {
      siteSettings: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      authentication: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      medicalRecordWebhook: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      clinicSettings: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      themeSettings: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      webhookSettings: { status: 'healthy', message: '', lastChecked: new Date().toISOString() },
      database: { status: 'healthy', message: '', lastChecked: new Date().toISOString() }
    },
    errors: [],
    warnings: []
  };

  // 1. Test Database Connection
  try {
    console.log('🔍 [Health Check] Testando conexão com o banco...');
    const { data, error } = await supabase.from('site_settings').select('id').limit(1);
    
    if (error) {
      healthStatus.components.database.status = 'error';
      healthStatus.components.database.message = `Erro de conexão: ${error.message}`;
      healthStatus.errors.push(`Database: ${error.message}`);
    } else {
      healthStatus.components.database.status = 'healthy';
      healthStatus.components.database.message = 'Conexão estabelecida com sucesso';
      console.log('✅ [Health Check] Conexão com banco OK');
    }
  } catch (error: any) {
    healthStatus.components.database.status = 'error';
    healthStatus.components.database.message = `Falha crítica: ${error.message}`;
    healthStatus.errors.push(`Database Critical: ${error.message}`);
  }

  // 2. Test Site Settings Service
  try {
    console.log('🔍 [Health Check] Testando fetchSiteSettings...');
    const siteSettings = await fetchSiteSettings();
    
    healthStatus.components.siteSettings.status = 'healthy';
    healthStatus.components.siteSettings.message = 'Configurações carregadas com sucesso';
    console.log('✅ [Health Check] Site settings OK');
  } catch (error: any) {
    healthStatus.components.siteSettings.status = 'error';
    healthStatus.components.siteSettings.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Site Settings: ${error.message}`);
  }

  // 3. Test Medical Record Webhook Service
  try {
    console.log('🔍 [Health Check] Testando fetchMedicalRecordWebhookSettings...');
    const webhookSettings = await fetchMedicalRecordWebhookSettings();
    
    healthStatus.components.medicalRecordWebhook.status = 'healthy';
    healthStatus.components.medicalRecordWebhook.message = 'Webhook settings funcionando';
    console.log('✅ [Health Check] Medical record webhook OK');
  } catch (error: any) {
    healthStatus.components.medicalRecordWebhook.status = 'error';
    healthStatus.components.medicalRecordWebhook.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Medical Record Webhook: ${error.message}`);
  }

  // 4. Test Clinic Settings Service
  try {
    console.log('🔍 [Health Check] Testando fetchClinicSettings...');
    const clinicSettings = await fetchClinicSettings();
    
    healthStatus.components.clinicSettings.status = 'healthy';
    healthStatus.components.clinicSettings.message = 'Configurações da clínica funcionando';
    console.log('✅ [Health Check] Clinic settings OK');
  } catch (error: any) {
    healthStatus.components.clinicSettings.status = 'error';
    healthStatus.components.clinicSettings.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Clinic Settings: ${error.message}`);
  }

  // 5. Test Theme Settings Service
  try {
    console.log('🔍 [Health Check] Testando fetchThemeSettings...');
    const themeSettings = await fetchThemeSettings();
    
    healthStatus.components.themeSettings.status = 'healthy';
    healthStatus.components.themeSettings.message = 'Configurações de tema funcionando';
    console.log('✅ [Health Check] Theme settings OK');
  } catch (error: any) {
    healthStatus.components.themeSettings.status = 'error';
    healthStatus.components.themeSettings.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Theme Settings: ${error.message}`);
  }

  // 6. Test Webhook Settings Service
  try {
    console.log('🔍 [Health Check] Testando fetchWebhookSettings...');
    const webhookSettings = await fetchWebhookSettings();
    
    healthStatus.components.webhookSettings.status = 'healthy';
    healthStatus.components.webhookSettings.message = 'Configurações de webhook funcionando';
    console.log('✅ [Health Check] Webhook settings OK');
  } catch (error: any) {
    healthStatus.components.webhookSettings.status = 'error';
    healthStatus.components.webhookSettings.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Webhook Settings: ${error.message}`);
  }

  // 7. Test Authentication System
  try {
    console.log('🔍 [Health Check] Testando sistema de autenticação...');
    const storedUser = localStorage.getItem('simple_auth_user');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      healthStatus.components.authentication.status = 'healthy';
      healthStatus.components.authentication.message = `Usuário ${userData.username} autenticado`;
      console.log('✅ [Health Check] Authentication OK');
    } else {
      healthStatus.components.authentication.status = 'warning';
      healthStatus.components.authentication.message = 'Nenhum usuário logado';
      healthStatus.warnings.push('Authentication: Nenhum usuário logado');
    }
  } catch (error: any) {
    healthStatus.components.authentication.status = 'error';
    healthStatus.components.authentication.message = `Erro: ${error.message}`;
    healthStatus.errors.push(`Authentication: ${error.message}`);
  }

  // Calculate overall status
  const hasErrors = healthStatus.errors.length > 0;
  const hasWarnings = healthStatus.warnings.length > 0;
  
  if (hasErrors) {
    healthStatus.overall = 'error';
  } else if (hasWarnings) {
    healthStatus.overall = 'warning';
  } else {
    healthStatus.overall = 'healthy';
  }

  console.log(`🏁 [Health Check] Verificação concluída - Status: ${healthStatus.overall.toUpperCase()}`);
  console.log(`📊 [Health Check] Erros: ${healthStatus.errors.length}, Avisos: ${healthStatus.warnings.length}`);
  
  return healthStatus;
}

export function logSystemHealthReport(healthStatus: SystemHealthStatus) {
  console.log('\n🏥 === RELATÓRIO DE SAÚDE DO SISTEMA ===');
  console.log(`📊 Status Geral: ${healthStatus.overall.toUpperCase()}`);
  
  console.log('\n🧩 Componentes:');
  Object.entries(healthStatus.components).forEach(([name, component]) => {
    const icon = component.status === 'healthy' ? '✅' : component.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${component.message}`);
  });
  
  if (healthStatus.errors.length > 0) {
    console.log('\n❌ Erros Encontrados:');
    healthStatus.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  if (healthStatus.warnings.length > 0) {
    console.log('\n⚠️ Avisos:');
    healthStatus.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
  
  console.log('\n=======================================\n');
}