import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Robust fetching: try to find any record with a groq_api_key if the latest one doesn't have it
    // This handles the case where a new row was inadvertently created without the key
    console.log("Buscando chave da Groq...");
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('groq_api_key')
      .not('groq_api_key', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsError || !settingsData?.groq_api_key) {
      console.error("Erro ao buscar chave Groq:", settingsError);
      return new Response(JSON.stringify({ 
        error: 'Chave da Groq não configurada ou inválida no painel administrativo.',
        details: settingsError?.message
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('file');

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo de áudio enviado.' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Criar o form-data para enviar para a Groq
    const groqFormData = new FormData();
    groqFormData.append('file', audioFile);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'pt');

    // Implement retry logic with exponential backoff for the Groq API call
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 500;
          console.log(`Tentativa ${attempt + 1}/${maxRetries + 1} após ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log("Enviando áudio para Groq API (Whisper)...");
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settingsData.groq_api_key}`,
          },
          body: groqFormData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na Groq (Status ${response.status}):`, errorText);
          
          // Don't retry on client errors (4xx) except for rate limits (429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return new Response(JSON.stringify({ 
              error: `Erro na API da Groq: ${response.statusText}`,
              details: errorText
            }), { 
              status: response.status, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }
          
          throw new Error(`Groq API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Transcrição concluída com sucesso!");

        return new Response(JSON.stringify({ text: result.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        lastError = err;
        console.warn(`Falha na tentativa ${attempt + 1}:`, err.message);
      }
    }

    // If we reached here, all retries failed
    return new Response(JSON.stringify({ 
      error: 'Falha persistente na transcrição após múltiplas tentativas.',
      details: lastError?.message
    }), { 
      status: 502, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});