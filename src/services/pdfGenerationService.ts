
import { supabase } from '@/integrations/supabase/client';

export interface GeneratePdfParams {
  medicalRecordId: string;
  data: Record<string, any>;
  isPreview?: boolean;
}

/**
 * Chama a Edge Function para gerar o PDF a partir do HTML Premium
 */
export async function generatePremiumPdf(params: GeneratePdfParams) {
  try {
    const payload = {
      medicalRecordId: params.medicalRecordId,
      data: {
        ...params.data,
        medicalRecordId: params.medicalRecordId // Backup do ID dentro do data
      },
      isPreview: params.isPreview
    };

    console.log('📄 [PDF Service] Payload final:', JSON.stringify(payload).substring(0, 500) + '...');
    
    const { data, error } = await supabase.functions.invoke('generate-pdf-premium', {
      body: payload
    });
    
    if (error) {
      console.error('❌ [PDF Service] Erro na Edge Function:', error);
      
      // Detalhar o erro de conexão
      if (error.message?.includes('Failed to send a request')) {
        throw new Error('Não foi possível conectar à Edge Function. Verifique sua conexão ou se a função está ativa no Supabase.');
      }
      
      const msg = error.message || 'Erro de conexão com a Edge Function';
      throw new Error(`Erro ao gerar PDF: ${msg}`);
    }

    // Tratar o caso onde a função retorna 200 mas com success: false (JSON de erro)
    if (data && data.success === false) {
      console.error('❌ [PDF Service] Erro lógico retornado pela função:', data.error);
      throw new Error(data.error || 'Erro interno na geração do PDF');
    }

    console.log('✅ [PDF Service] Resposta da Edge Function:', data);
    return data as { success: true; publicUrl: string };
    
  } catch (error: any) {
    console.error('💥 [PDF Service] Erro crítico ao gerar PDF:', error);
    throw error;
  }
}
