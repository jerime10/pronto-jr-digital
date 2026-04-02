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
    console.log("AI Webhook recebeu requisição (OpenRouter Nativo)");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração incompleta do servidor Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestBody = await req.json();
    console.log("Corpo da requisição:", requestBody);
    
    const text = requestBody.text || requestBody.content;
    let type = requestBody.type; // 'main_complaint', 'evolution', 'exam_result', 'voice_command'
    const fieldKey = requestBody.fieldKey; 
    const availableFields = requestBody.availableFields; // Lista de {key, label} para comando de voz
    const selectedModelId = requestBody.selectedModelId;
    const selectedFieldsKeys = requestBody.selectedFieldsKeys; // Keys dos campos selecionados pelo checkbox

    console.log(`Tipo: ${type}, ModelID: ${selectedModelId}, FieldKey: ${fieldKey}`);
    console.log(`SelectedFieldsKeys: ${JSON.stringify(selectedFieldsKeys)}`);

    // Se tiver selectedModelId, inferir que é um resultado de exame se o tipo não estiver definido
    if (selectedModelId && !type) {
      type = 'exam_result';
      console.log("Tipo inferido como exam_result devido ao selectedModelId");
    }
    
    const dynamicFields = Object.keys(requestBody).filter(key => 
      !['text', 'content', 'type', 'selectedModelId', 'selectedModelTitle', 'resultadoFinal', 'timestamp', 'fieldKey', 'availableFields', 'selectedFieldsKeys'].includes(key)
    );
    
    const hasDynamicFields = (dynamicFields.length > 0 && 
      dynamicFields.some(key => requestBody[key] && requestBody[key].toString().trim())) || type === 'voice_command';

    console.log(`HasDynamicFields: ${hasDynamicFields}, DynamicFields: ${JSON.stringify(dynamicFields)}`);

    if (!hasDynamicFields && !text) {
      return new Response(JSON.stringify({ error: 'Conteúdo ou campos dinâmicos são obrigatórios', success: false }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Buscar configurações da IA (com lógica robusta para evitar reset de chaves)
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('openrouter_api_key, openrouter_model, prompt_queixa, prompt_evolucao, prompt_exames')
      .not('openrouter_api_key', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (settingsError || !settingsData?.openrouter_api_key) {
      console.error("Erro ao buscar configurações:", settingsError);
      return new Response(JSON.stringify({ 
        error: 'Chave do OpenRouter não configurada. Verifique o painel administrativo.', 
        success: false,
        details: settingsError?.message
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const apiKey = settingsData.openrouter_api_key;
    const model = settingsData.openrouter_model || 'openai/gpt-4o-mini';
    
    // Determinar o prompt base
    let systemPrompt = "";
    
    // Buscar prompt específico se for exame e tiver modelo selecionado
    let specificExamPrompt = null;
    if (selectedModelId && (type === 'exam_result' || type === 'voice_command')) {
      console.log(`Buscando prompt específico para o modelo: ${selectedModelId}`);
      const { data: modelData, error: modelError } = await supabase
        .from('modelo-result-exames')
        .select('ai_prompt')
        .eq('id', selectedModelId)
        .maybeSingle(); // Usar maybeSingle para evitar erros se não encontrar
      
      if (modelError) {
        console.error("Erro ao buscar prompt do modelo:", modelError);
      } else if (modelData?.ai_prompt) {
        specificExamPrompt = modelData.ai_prompt;
        console.log(`Prompt específico ENCONTRADO para o modelo ${selectedModelId}: ${specificExamPrompt.substring(0, 50)}...`);
      } else {
        console.log(`Modelo ${selectedModelId} não possui prompt específico (ai_prompt está vazio).`);
      }
    }

    if (type === 'main_complaint') systemPrompt = settingsData.prompt_queixa || 'Você é um assistente médico. Melhore a queixa principal.';
    else if (type === 'evolution') systemPrompt = settingsData.prompt_evolucao || 'Você é um assistente médico. Melhore a evolução clínica.';
    else if (type === 'exam_result') {
      systemPrompt = specificExamPrompt || settingsData.prompt_exames || 'Você é um assistente médico. Estruture o laudo de exames.';
      console.log(`System Prompt definido para exam_result. Usando prompt ${specificExamPrompt ? 'DO MODELO' : 'GLOBAL'}.`);
    }
    else if (type === 'voice_command') {
      // Instruções técnicas de mapeamento (sempre necessárias para comando de voz)
      const mappingInstructions = `
Sua tarefa é identificar no texto quais partes pertencem a quais campos do laudo.

CAMPOS DISPONÍVEIS (ID: NOME):
${availableFields ? availableFields.map((f: any) => `${f.key}: ${f.label}`).join('\n') : 'Nenhum campo disponível'}

REGRAS CRÍTICAS:
1. Se o usuário disser o nome do campo (ex: "Gravidez", "Feto", "Placenta"), atribua o texto subsequente a esse campo.
2. Se o texto for genérico (ex: "tópica e única"), deduza que pertence ao campo "gravidez" pelo contexto médico.
3. DATA (DPP): Se ouvir uma data, converta OBRIGATORIAMENTE para o formato DD/MM/AAAA. Exemplo: "vinte de março de dois mil e vinte e seis" vira "20/03/2026".
4. IG (IDADE GESTACIONAL): Converta OBRIGATORIAMENTE para o formato XSXD (S maiúsculo, D maiúsculo). Exemplo: "33 semanas e 0 dias" vira "33S0D". "32 semanas e 4 dias" vira "32S4D".
5. PESO: Converta OBRIGATORIAMENTE para um número inteiro seguido da letra "g" no final. JAMAIS use vírgula ou ponto. Exemplo: "mil e quinhentos gramas" vira "1500g". "duzentos gramas" vira "200g".
6. Retorne APENAS um JSON onde as chaves são os IDs dos campos e os valores são os textos extraídos e formatados clinicamente.
7. NÃO invente campos. Se uma informação não se encaixar em nenhum campo, ignore-a.
8. Se o campo "observacoes" (ID: observacoes) for mencionado, transcreva a narração. Se não for mencionado, NÃO retorne nada para ele (o sistema cuidará do texto fixo).
9. Mantenha a terminologia médica correta.`;

      if (specificExamPrompt) {
        // Mesclar prompt do modelo com instruções técnicas
        systemPrompt = `${specificExamPrompt}\n\nINSTRUÇÕES TÉCNICAS PARA MAPEAMENTO DE CAMPOS (JSON):\n${mappingInstructions}`;
        console.log("System Prompt definido para voice_command mesclando Prompt do Modelo + Instruções Técnicas.");
      } else {
        // Usar prompt padrão de obstetrícia se não houver prompt específico
        systemPrompt = `Você é um assistente médico especializado em extrair informações de transcrições de áudio para laudos de exames de Ultrassonografia Obstétrica.\n${mappingInstructions}`;
        console.log("System Prompt definido para voice_command usando Prompt Padrão (Obstetrícia).");
      }
    }
    else {
      systemPrompt = 'Você é um assistente médico especializado.';
      console.log(`Tipo desconhecido (${type}). Usando prompt genérico.`);
    }

    let userMessage = "";
    let expectedOutput = "texto";

    if (type === 'voice_command') {
      expectedOutput = "json";
      userMessage = `TRANSCRIÇÃO DO ÁUDIO:\n"${text}"\n\nExtraia as informações para os campos acima e retorne o JSON.`;
    } else if (hasDynamicFields) {
      expectedOutput = "json";
      systemPrompt += `\n\nATENÇÃO: Você DEVE retornar APENAS um objeto JSON válido. NENHUM texto adicional antes ou depois. As chaves do JSON devem corresponder exatamente aos campos enviados.`;
      
      const fieldsData = dynamicFields.map(key => `"${key}": "${requestBody[key]}"`).join('\n');
      userMessage = `Aqui estão os campos a serem processados e melhorados clinicamente:\n${fieldsData}\n\nRetorne um JSON com os mesmos nomes de campos (chaves), mas com os valores melhorados e formatados clinicamente.`;
      
      // Se houver campos selecionados via checkbox, orientar a IA a usá-los para a conclusão
      if (selectedFieldsKeys && Array.isArray(selectedFieldsKeys) && selectedFieldsKeys.length > 0) {
        const selectedLabels = selectedFieldsKeys.join(', ');
        userMessage += `\n\nIMPORTANTE: Para a formulação dos campos de conclusão (como "impressaodiagnostica", "achadosadicionais", "recomendacoes"), considere PRIORITARIAMENTE os seguintes campos que foram marcados pelo usuário: ${selectedLabels}.`;
      }

      if (fieldKey) {
        userMessage += `\n\nFOCO ESPECIAL NO CAMPO: "${fieldKey}".`;
      }
      if (requestBody.selectedModelTitle) {
        userMessage += `\nContexto do modelo de exame: ${requestBody.selectedModelTitle}`;
      }
    } else {
      expectedOutput = "texto";
      userMessage = `Aqui está o conteúdo bruto que precisa ser melhorado clinicamente:\n\n${text}`;
    }

    console.log(`Enviando para OpenRouter (Modelo: ${model})...`);
    const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://prontuario.jr", // Required by OpenRouter
        "X-Title": "Pronto Jr Digital" // Required by OpenRouter
      },
      body: JSON.stringify({
        model: model, // Usando o modelo dinâmico configurado
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: expectedOutput === "json" ? { type: "json_object" } : undefined
      })
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error("Erro OpenRouter:", errText);
      
      let errorMsg = `Erro na IA (${orResponse.status}): ${orResponse.statusText}`;
      
      // Tratamento específico de erros comuns do OpenRouter
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        }
        
        // Tratamento de limites de crédito/uso
        if (orResponse.status === 402 && errorMsg.toLowerCase().includes('insufficient')) {
          errorMsg = "Saldo insuficiente na conta OpenRouter. Verifique seus créditos.";
        } else if (orResponse.status === 429) {
          errorMsg = "Limite de requisições excedido. Tente novamente em alguns instantes.";
        } else if (orResponse.status === 404 || errorMsg.toLowerCase().includes('model not found')) {
          errorMsg = `O modelo '${model}' não foi encontrado ou está indisponível. Tente selecionar outro modelo nas configurações.`;
        }
      } catch (e) {
        // Fallback para o texto puro se não for JSON
      }

      return new Response(JSON.stringify({ error: errorMsg, success: false }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orData = await orResponse.json();
    const contentResponse = orData.choices?.[0]?.message?.content || "";
    
    console.log("Resposta do OpenRouter:", contentResponse);

    if (hasDynamicFields) {
      try {
        // Tenta parsear como JSON
        const parsedJson = JSON.parse(contentResponse);
        return new Response(JSON.stringify({
          success: true,
          processed_content: fieldKey ? parsedJson[fieldKey] : null,
          individual_fields: parsedJson,
          fieldKey: fieldKey,
          debug_prompt: systemPrompt // Retornar o prompt para fins de teste
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        console.error("A IA não retornou um JSON válido:", e);
        // Fallback: se falhou o parse mas tem fieldKey, retorna o texto bruto para o campo
        if (fieldKey) {
           return new Response(JSON.stringify({
            success: true,
            processed_content: contentResponse,
            individual_fields: { [fieldKey]: contentResponse },
            fieldKey: fieldKey,
            debug_prompt: systemPrompt // Retornar o prompt para fins de teste
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: 'A IA não retornou um JSON válido.', success: false, debug_prompt: systemPrompt }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      return new Response(JSON.stringify({
        success: true,
        processed_content: contentResponse,
        debug_prompt: systemPrompt // Retornar o prompt para fins de teste
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
  } catch (error) {
    console.error("Erro na função AI webhook:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido', success: false }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
