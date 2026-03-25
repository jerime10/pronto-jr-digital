
import { sendAtendimentoToN8N } from '../services/n8nWebhookService';

export async function testN8NWebhookManual() {
  console.log('🧪 [Test] Iniciando teste manual do webhook n8n...');
  
  const testPayload = {
    nome: 'Paciente de Teste',
    telefone: '(91) 99999-9999',
    id_pdf: 'test-uuid-12345',
    url_pdf: 'https://example.com/test-document.pdf',
    nome_profissional: 'Dr. Profissional de Teste',
    nome_consultorio: 'Clínica de Teste JRS',
    data_inicio: new Date().toISOString(),
    data_fim: new Date().toISOString()
  };
  
  console.log('📦 [Test] Payload de teste:', testPayload);
  
  try {
    const success = await sendAtendimentoToN8N(testPayload);
    
    if (success) {
      console.log('✅ [Test] Teste concluído com sucesso!');
      return { success: true, message: 'Webhook n8n funcionando corretamente' };
    } else {
      console.error('❌ [Test] O envio ao webhook falhou.');
      return { success: false, message: 'Falha no envio ao webhook' };
    }
  } catch (error) {
    console.error('💥 [Test] Erro durante o teste:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
