
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log("AI Webhook recebeu requisição");
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas");
      return new Response(
        JSON.stringify({ 
          error: 'Configuração incompleta do servidor',
          success: false
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get request data
    const requestBody = await req.json();
    console.log("Corpo da requisição:", requestBody);
    
    // Extract text/content for compatibility
    const text = requestBody.text || requestBody.content;
    const type = requestBody.type;
    const fieldKey = requestBody.fieldKey; // Identificar se é processamento de campo individual
    
    // Check if we have dynamic fields (campos de exame)
    const dynamicFields = Object.keys(requestBody).filter(key => 
      !['text', 'content', 'type', 'selectedModelTitle', 'resultadoFinal', 'timestamp', 'fieldKey'].includes(key)
    );
    const hasDynamicFields = dynamicFields.length > 0 && 
      dynamicFields.some(key => requestBody[key] && requestBody[key].toString().trim());
    
    console.log("=== DEBUG PROCESSAMENTO (ENVIO SELETIVO) ===");
    console.log("fieldKey:", fieldKey);
    console.log("hasDynamicFields:", hasDynamicFields);
    console.log("dynamicFields recebidos:", dynamicFields);
    console.log("Quantidade de campos:", dynamicFields.length);
    
    // Identificar o tipo de envio
    if (fieldKey) {
      const fieldsWithFullContext = ['impressaodiagnostica', 'achadosadicionais', 'recomendacoes'];
      if (fieldsWithFullContext.includes(fieldKey)) {
        console.log("🎯 ENVIO COMPLETO: Campo especial (precisa de contexto completo)");
      } else if (fieldKey === 'percentil') {
        console.log("🎯 ENVIO PERCENTIL: Deve conter PERCENTIL + PESO + IG");
      } else {
        console.log("🎯 ENVIO SELETIVO: Apenas o campo", fieldKey);
      }
    }
    
    // Validar: precisamos de campos dinâmicos OU text/content
    if (!hasDynamicFields && !text) {
      console.error("Conteúdo ou campos dinâmicos obrigatórios ausentes:", { 
        text: !!text,
        hasDynamicFields,
        dynamicFields: dynamicFields.map(key => ({ [key]: requestBody[key] }))
      });
      return new Response(
        JSON.stringify({ 
          error: 'Conteúdo (text/content) ou campos dinâmicos são obrigatórios',
          success: false
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Get N8N webhook URL from site_settings
    // Instead of maybeSingle(), get the most recent record by updated_at
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('n8n_webhook_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    console.log("Resultado da consulta de configurações:", settingsData);
    
    if (settingsError) {
      console.error("Erro ao buscar URL do webhook n8n:", settingsError);
      return new Response(
        JSON.stringify({ 
          error: `Erro no banco de dados: ${settingsError.message}`,
          details: settingsError,
          success: false
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    let n8nWebhookUrl = settingsData?.n8n_webhook_url;
    
    if (!n8nWebhookUrl) {
      console.error("URL do webhook n8n não configurada");
      return new Response(
        JSON.stringify({ 
          error: 'URL do webhook N8N não configurada',
          success: false
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // IMPORTANTE: NÃO converter URLs "webhook-test" para "webhook"
    // Usar a URL exatamente como está configurada no banco de dados
    console.log(`Usando webhook URL como configurado: ${n8nWebhookUrl}`);
    
    // Forward the request to N8N webhook
    try {
      let n8nPayload: Record<string, any> = {};
      
      // ===== ETAPA 3: LOGS DETALHADOS DO PAYLOAD =====
      console.log('🚀 [AI-WEBHOOK] ===== PREPARANDO PAYLOAD PARA N8N =====');
      console.log('🚀 [AI-WEBHOOK] selectedModelTitle:', requestBody.selectedModelTitle);
      console.log('🚀 [AI-WEBHOOK] hasDynamicFields:', hasDynamicFields);
      
      if (hasDynamicFields) {
        // Se há campos dinâmicos, enviar apenas eles (comportamento novo)
        console.log("🚀 [AI-WEBHOOK] Enviando apenas campos dinâmicos para N8N");
        
        // Adicionar todos os campos dinâmicos
        Object.keys(requestBody).forEach(key => {
          if (!['text', 'content', 'type', 'selectedModelTitle', 'resultadoFinal', 'timestamp'].includes(key)) {
            n8nPayload[key] = requestBody[key];
          }
        });
        
        // IMPORTANTE: Incluir selectedModelTitle no payload para N8N
        if (requestBody.selectedModelTitle) {
          n8nPayload.selectedModelTitle = requestBody.selectedModelTitle;
          console.log("🚀 [AI-WEBHOOK] selectedModelTitle incluído no payload:", requestBody.selectedModelTitle);
        } else {
          console.warn("⚠️ [AI-WEBHOOK] selectedModelTitle não encontrado no requestBody");
        }
        
        n8nPayload.timestamp = new Date().toISOString();
      } else {
        // Se não há campos dinâmicos, enviar text/type (compatibilidade com botões individuais)
        console.log("🚀 [AI-WEBHOOK] Enviando text/type para N8N (requisição individual)");
        n8nPayload = {
          text,
          type,
          timestamp: new Date().toISOString()
        };
        
        // Incluir selectedModelTitle se disponível
        if (requestBody.selectedModelTitle) {
          n8nPayload.selectedModelTitle = requestBody.selectedModelTitle;
        }
      }
      
      // Log detalhado de TODOS os campos dinâmicos
      console.log('🚀 [AI-WEBHOOK] ===== CAMPOS DINÂMICOS NO PAYLOAD =====');
      let dynamicFieldsCount = 0;
      Object.keys(n8nPayload).forEach(key => {
        if (!['timestamp', 'selectedModelTitle', 'text', 'type'].includes(key)) {
          dynamicFieldsCount++;
          const value = n8nPayload[key];
          const preview = typeof value === 'string' 
            ? (value.length > 100 ? value.substring(0, 100) + '...' : value)
            : value;
          console.log(`  🔸 ${key}:`, preview);
        }
      });
      
      console.log('🚀 [AI-WEBHOOK] ===== RESUMO DO PAYLOAD =====');
      console.log('🚀 [AI-WEBHOOK] Total de campos no payload:', Object.keys(n8nPayload).length);
      console.log('🚀 [AI-WEBHOOK] Total de campos dinâmicos:', dynamicFieldsCount);
      console.log('🚀 [AI-WEBHOOK] URL de destino:', n8nWebhookUrl);
      console.log('🚀 [AI-WEBHOOK] ===== FIM DOS LOGS =====\n');
      
      // Try with fetch to n8n webhook directly
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://sistema.saude.app',
        },
        body: JSON.stringify(n8nPayload),
      });
      
      console.log("Status da resposta do N8N:", n8nResponse.status);
      let responseText = '';
      
      try {
        // Try to read response as text first to ensure we can log it even if it's not JSON
        responseText = await n8nResponse.text();
        console.log("Resposta completa do N8N:", responseText);
      } catch (readError) {
        console.error("Erro ao ler resposta do N8N como texto:", readError);
      }
      
      if (!n8nResponse.ok) {
        console.error(`N8N respondeu com status ${n8nResponse.status}: ${responseText}`);
        console.error(`URL utilizada: ${n8nWebhookUrl}`);
        console.error(`Payload enviado:`, n8nPayload);
        return new Response(
          JSON.stringify({ 
            error: `N8N respondeu com status ${n8nResponse.status}`,
            details: responseText,
            webhookUrl: n8nWebhookUrl,
            sentPayload: n8nPayload,
            success: false
          }),
          { 
            status: 502, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // Try to parse JSON response, if it fails, use the text response
      let n8nData;
      try {
        n8nData = JSON.parse(responseText);
        console.log("Dados da resposta do N8N:", n8nData);
      } catch (parseError) {
        console.log("Resposta do N8N não é JSON válido, usando como resposta de texto");
        // If raw text, treat it as the processed content
        return new Response(
          JSON.stringify({
            success: true,
            processed_content: responseText
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // MODIFIED: Check multiple possible response formats from n8n
      // Look for processed_content, text, or output fields in the response
      let processedContent = null;
      let individualFields: Record<string, string> = {};
      
      if (n8nData.processed_content) {
        processedContent = n8nData.processed_content;
      } else if (n8nData.text) {
        processedContent = n8nData.text;
      } else if (n8nData.output) {
        processedContent = n8nData.output;
      } else if (Array.isArray(n8nData) && n8nData.length > 0) {
        // Check if it's an array response
        if (n8nData[0].output) {
          processedContent = n8nData[0].output;
        } else if (n8nData[0].processed_content) {
          processedContent = n8nData[0].processed_content;
        } else if (n8nData[0].text) {
          processedContent = n8nData[0].text;
        }
      }
      
      // Check if n8nData contains individual fields (any field that matches our dynamic fields)
      const sentDynamicFields = Object.keys(requestBody).filter(key => 
        !['text', 'content', 'type', 'selectedModelTitle', 'timestamp'].includes(key)
      );
      
      // Extract individual fields from n8nData if they exist
      sentDynamicFields.forEach(fieldKey => {
        if (n8nData[fieldKey] && typeof n8nData[fieldKey] === 'string') {
          individualFields[fieldKey] = n8nData[fieldKey];
        }
      });
      
      // Also check for common field variations
      const fieldMappings = {
        // Campos obstétricos completos
        'gravidez': ['gravidez', 'GRAVIDEZ', 'pregnancy', 'gestacao', 'gestação'],
        'feto': ['feto', 'FETO', 'fetus', 'fetal'],
        'apresentacao': ['apresentacao', 'apresentação', 'APRESENTACAO', 'APRESENTAÇÃO', 'presentation'],
        'situacao': ['situacao', 'situação', 'SITUACAO', 'SITUAÇÃO', 'situation'],
        'bcf': ['bcf', 'BCF', 'batimentos_cardiacos', 'heart_rate'],
        'ig': ['ig', 'IG', 'idade_gestacional', 'gestational_age'],
        'dum': ['dum', 'DUM', 'data_ultima_menstruacao'],
        'dpp': ['dpp', 'DPP', 'data_provavel_parto'],
        'bpd': ['bpd', 'BPD', 'diametro_biparietal'],
        'dof': ['dof', 'DOF', 'diametro_occipito_frontal'],
        'cc': ['cc', 'CC', 'circunferencia_cefalica'],
        'ca': ['ca', 'CA', 'circunferencia_abdominal'],
        'cf': ['cf', 'CF', 'comprimento_femur'],
        'peso_fetal': ['peso_fetal', 'PESO_FETAL', 'peso', 'weight', 'estimated_weight'],
        'placenta': ['placenta', 'PLACENTA'],
        'cordaoumbilical': ['cordaoumbilical', 'CORDAOUMBILICAL', 'cordao_umbilical', 'umbilical_cord'],
        'liquidoamniotico': ['liquidoamniotico', 'LIQUIDOAMNIOTICO', 'liquido_amniotico', 'amniotic_fluid'],
        'colo': ['colo', 'COLO', 'cervix'],
        'anexos': ['anexos', 'ANEXOS', 'adnexa'],
        
        // Campos de ultrassom abdominal
        'figado': ['figado', 'fígado', 'liver', 'FIGADO', 'FÍGADO'],
        'viasbiliares': ['viasbiliares', 'vias_biliares', 'bile_ducts', 'VIASBILIARES', 'VIAS_BILIARES'],
        'vesiculabiliar': ['vesiculabiliar', 'vesicula_biliar', 'gallbladder', 'VESICULABILIAR', 'VESICULA_BILIAR'],
        'pancreaseretroperitonio': ['pancreaseretroperitonio', 'pancreas_retroperitonio', 'pancreas', 'PANCREASERETROPERITONIO'],
        'baco': ['baco', 'baço', 'spleen', 'BACO', 'BAÇO'],
        'rins': ['rins', 'kidneys', 'RINS'],
        'aortaabdominal': ['aortaabdominal', 'aorta_abdominal', 'aorta', 'AORTAABDOMINAL'],
        'bexiga': ['bexiga', 'bladder', 'BEXIGA'],
        'apendicececal': ['apendicececal', 'apendice_cecal', 'appendix', 'APENDICECECAL'],
        'cavidadeabdominal': ['cavidadeabdominal', 'cavidade_abdominal', 'abdominal_cavity', 'CAVIDADEABDOMINAL'],
        
        // Campos de conclusão (que já funcionam)
        'impressaodiagnostica': ['impressaodiagnostica', 'impressao_diagnostica', 'diagnostic_impression', 'IMPRESSAODIAGNOSTICA'],
        'achadosadicionais': ['achadosadicionais', 'achados_adicionais', 'additional_findings', 'ACHADOSADICIONAIS'],
        'recomendacoes': ['recomendacoes', 'recomendações', 'recommendations', 'RECOMENDACOES'],
        'observacoes': ['observacoes', 'observações', 'observations', 'OBSERVACOES']
      };
      
      Object.entries(fieldMappings).forEach(([standardKey, variations]) => {
        if (!individualFields[standardKey]) {
          for (const variation of variations) {
            if (n8nData[variation] && typeof n8nData[variation] === 'string') {
              individualFields[standardKey] = n8nData[variation];
              break;
            }
          }
        }
      });
      
      // Se não encontrou campos individuais diretamente, tentar extrair do processed_content
      if (Object.keys(individualFields).length === 0 && processedContent) {
        console.log("Tentando extrair campos do processed_content...");
        
        // Padrões para extrair campos do texto (incluindo todos os campos obstétricos)
        const extractionPatterns = {
          // Campos obstétricos
          'gravidez': /GRAVIDEZ[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'feto': /FETO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'apresentacao': /APRESENTAÇÃO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'situacao': /SITUAÇÃO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'bcf': /BCF[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'ig': /IG[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'dum': /DUM[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'dpp': /DPP[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'bpd': /BPD[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'dof': /DOF[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'cc': /CC[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'ca': /CA[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'cf': /CF[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'peso_fetal': /PESO FETAL[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'placenta': /PLACENTA[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'cordaoumbilical': /CORDÃO UMBILICAL[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'liquidoamniotico': /LÍQUIDO AMNIÓTICO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'colo': /COLO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'anexos': /ANEXOS[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          
          // Campos de ultrassom abdominal
          'figado': /FÍGADO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'viasbiliares': /VIAS BILIARES[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'vesiculabiliar': /VESÍCULA BILIAR[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'pancreaseretroperitonio': /PÂNCREAS E RETROPERITÔNIO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'baco': /BAÇO[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'rins': /RINS[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'aortaabdominal': /AORTA ABDOMINAL[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'bexiga': /BEXIGA[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'apendicececal': /APÊNDICE CECAL[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'cavidadeabdominal': /CAVIDADE ABDOMINAL[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          
          // Campos de conclusão (que já funcionam)
          'impressaodiagnostica': /IMPRESSÃO DIAGNÓSTICA[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'achadosadicionais': /ACHADOS ADICIONAIS[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'recomendacoes': /RECOMENDAÇÕES[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i,
          'observacoes': /OBSERVAÇÕES[:\s]*([^]*?)(?=\n[A-Z]|\n\n|$)/i
        };
        
        Object.entries(extractionPatterns).forEach(([fieldKey, pattern]) => {
          const match = processedContent.match(pattern);
          if (match && match[1] && match[1].trim()) {
            individualFields[fieldKey] = match[1].trim();
            console.log(`Campo ${fieldKey} extraído do texto:`, match[1].trim().substring(0, 50) + '...');
          }
        });
      }
      
      console.log("=== DEBUG CAMPOS INDIVIDUAIS ===");
      console.log("Campos dinâmicos enviados:", sentDynamicFields);
      console.log("Dados brutos do N8N:", n8nData);
      console.log("Tipo dos dados do N8N:", typeof n8nData);
      console.log("É array?", Array.isArray(n8nData));
      console.log("Todas as chaves do N8N:", Object.keys(n8nData));
      
      // Debug mais detalhado de cada campo
      Object.entries(n8nData).forEach(([key, value]) => {
        console.log(`N8N Campo "${key}":`, typeof value, value);
      });
      
      // Log final dos campos individuais extraídos
      console.log("=== CAMPOS INDIVIDUAIS FINAIS ===");
      console.log(`Total de campos individuais: ${Object.keys(individualFields).length}`);
      Object.entries(individualFields).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.substring(0, 50)}...`);
      });
      
      console.log("Campos individuais extraídos:", individualFields);
      console.log("Quantidade de campos extraídos:", Object.keys(individualFields).length);
      
      // Se foi processamento de campo individual, retornar apenas esse campo
      if (fieldKey && individualFields[fieldKey]) {
        console.log(`=== PROCESSAMENTO INDIVIDUAL: Campo ${fieldKey} ===`);
        console.log(`Valor processado: ${individualFields[fieldKey].substring(0, 100)}...`);
        
        return new Response(
          JSON.stringify({
            success: true,
            fieldKey: fieldKey,
            individual_fields: {
              [fieldKey]: individualFields[fieldKey]
            },
            processed_content: individualFields[fieldKey]
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // Debug adicional: verificar se N8N retornou algum campo esperado
      const expectedFields = [
        // Campos obstétricos
        'gravidez', 'feto', 'apresentacao', 'situacao', 'bcf', 'ig', 'dum', 'dpp',
        'bpd', 'dof', 'cc', 'ca', 'cf', 'peso_fetal', 'placenta', 'cordaoumbilical',
        'liquidoamniotico', 'colo', 'anexos',
        // Campos de ultrassom abdominal
        'figado', 'viasbiliares', 'vesiculabiliar', 'pancreaseretroperitonio', 'baco',
        'rins', 'aortaabdominal', 'bexiga', 'apendicececal', 'cavidadeabdominal',
        // Campos de conclusão
        'impressaodiagnostica', 'achadosadicionais', 'recomendacoes', 'observacoes'
      ];
      
      console.log("=== DEBUG CAMPOS ESPERADOS ===");
      expectedFields.forEach(field => {
        if (n8nData[field]) {
          console.log(`✅ Campo ${field} encontrado no N8N:`, n8nData[field]);
        } else {
          console.log(`❌ Campo ${field} NÃO encontrado no N8N`);
        }
      });
      
      // Verificar se há campos que começam com os nomes esperados
      Object.keys(n8nData).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('figado') || lowerKey.includes('fígado') || lowerKey.includes('liver')) {
          console.log(`Possível campo fígado encontrado: "${key}":`, n8nData[key]);
        }
      });
      
      console.log("=== FIM DEBUG ===");
      
      // If we found some form of processed content, return it along with individual fields
      if (processedContent !== null) {
        return new Response(
          JSON.stringify({
            success: true,
            processed_content: processedContent,
            individual_fields: Object.keys(individualFields).length > 0 ? individualFields : null
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // If there's no processed content in any expected format, log this issue
      console.log("Formato de resposta do n8n não reconhecido:", n8nData);
      return new Response(
        JSON.stringify({
          success: true,
          processed_content: "O resultado do processamento não foi encontrado na resposta. Verifique a configuração do n8n."
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      console.error("Erro ao encaminhar para o n8n:", error);
      return new Response(
        JSON.stringify({ 
          error: `Falha ao processar com N8N: ${error.message}`,
          success: false
        }),
        { 
          status: 502, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error("Erro na função AI webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
