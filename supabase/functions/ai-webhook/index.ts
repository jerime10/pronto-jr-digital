
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
    
    // Extract parameters from the request
    // Support both naming conventions (content from frontend, text expected by n8n)
    const text = requestBody.text || requestBody.content;
    const type = requestBody.type;
    
    if (!text || !type) {
      console.error("Parâmetros obrigatórios ausentes:", { text, type });
      return new Response(
        JSON.stringify({ 
          error: 'Text/content e type são obrigatórios',
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
      // Log the data we're about to send
      const n8nPayload = {
        text,
        type,
        timestamp: new Date().toISOString()
      };
      
      console.log("Enviando payload para n8n:", n8nPayload);
      
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
        return new Response(
          JSON.stringify({ 
            error: `N8N respondeu com status ${n8nResponse.status}`,
            details: responseText,
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
      
      // If we found some form of processed content, return it
      if (processedContent !== null) {
        return new Response(
          JSON.stringify({
            success: true,
            processed_content: processedContent
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
