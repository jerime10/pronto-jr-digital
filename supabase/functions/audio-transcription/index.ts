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

    // Buscar a chave da Groq nas configurações do banco (pegando a mais recente)
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('groq_api_key')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settingsData?.groq_api_key) {
      return new Response(JSON.stringify({ error: 'Chave da Groq não configurada no painel administrativo.' }), { 
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

    // Criar o form-data para enviar para a Groq (compatível com a API da OpenAI)
    const groqFormData = new FormData();
    groqFormData.append('file', audioFile);
    groqFormData.append('model', 'whisper-large-v3'); // Modelo avançado suportado pela Groq
    groqFormData.append('language', 'pt'); // Força português para maior precisão

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
      console.error("Erro na Groq:", errorText);
      return new Response(JSON.stringify({ error: `Erro na transcrição: ${response.statusText}` }), { 
        status: 502, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const result = await response.json();
    console.log("Transcrição concluída com sucesso!");

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});