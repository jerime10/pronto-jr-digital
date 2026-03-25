
import { supabase } from '@/integrations/supabase/client';
import { fetchSiteSettings } from './siteSettingsService';

/**
 * Interface para os dados do atendimento a serem enviados ao n8n
 */
export interface N8NAtendimentoPayload {
  nome: string;
  telefone: string;
  id_pdf: string;
  url_pdf: string;
  nome_profissional: string;
  nome_consultorio: string;
  data_inicio: string;
  data_fim: string | null;
}

/**
 * Envia os dados do atendimento para o webhook do n8n configurado
 */
export async function sendAtendimentoToN8N(payload: N8NAtendimentoPayload): Promise<boolean> {
  try {
    console.log('🚀 [n8n Webhook] Iniciando envio de dados:', payload);

    // 1. Buscar configurações para obter a URL do webhook
    const settings = await fetchSiteSettings();
    const webhookUrl = settings.medicalRecordWebhookUrl;

    if (!webhookUrl) {
      console.warn('⚠️ [n8n Webhook] URL do webhook não configurada. Abortando envio.');
      return false;
    }

    // 2. Preparar FormData conforme solicitado
    const formData = new FormData();
    formData.append('NOME', payload.nome);
    formData.append('TELEFONE', payload.telefone);
    formData.append('ID DO PDF', payload.id_pdf);
    formData.append('ENVIAR O PDF', payload.url_pdf);
    formData.append('NOME DO PROFISSIONAL', payload.nome_profissional);
    formData.append('NOME DO CONSULTORIO', payload.nome_consultorio);
    formData.append('data de inicio', payload.data_inicio);
    formData.append('data de fim', payload.data_fim || 'Não finalizado');

    // Adicionar campos extras que podem ser úteis para o n8n
    formData.append('action', 'atendimento_finalizado');
    formData.append('timestamp', new Date().toISOString());

    // 3. Enviar para o webhook
    const isProdUrl = webhookUrl.includes('n8n.mentoriajrs.com');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: isProdUrl ? 'no-cors' : 'cors',
      body: formData,
    });

    // Em modo no-cors, o status será 0, mas se não houve erro de rede, consideramos sucesso
    if (isProdUrl && response.status === 0) {
      console.log('✅ [n8n Webhook] Enviado com sucesso (modo no-cors)');
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [n8n Webhook] Erro ao enviar: ${response.status} ${errorText}`);
      return false;
    }

    console.log('✅ [n8n Webhook] Dados enviados com sucesso!');
    return true;

  } catch (error) {
    console.error('💥 [n8n Webhook] Erro crítico no envio:', error);
    return false;
  }
}
