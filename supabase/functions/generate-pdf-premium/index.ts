import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PREMIUM_TEMPLATE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap');
        :root { --primary: #0f172a; --accent: #10b981; --border: #e2e8f0; --text-main: #1e293b; --text-muted: #64748b; }
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body { font-family: 'Inter', sans-serif; color: var(--text-main); line-height: 1.4; font-size: 10pt; background: #fff; }
        .page { 
            width: 210mm; 
            height: 297mm; 
            padding: 10mm 15mm; 
            margin: 0 auto;
            position: relative; 
            display: flex;
            flex-direction: column;
            page-break-after: always;
            overflow: hidden;
        }
        .main-content { flex: 1; overflow: hidden; }
        header { 
            border-bottom: 2px solid var(--accent); 
            padding-bottom: 2mm; 
            margin-bottom: 3mm; 
        }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo-img { height: 10mm; width: auto; max-width: 40mm; }
        .clinic-info h1 { font-family: 'Playfair Display', serif; font-size: 13pt; color: var(--primary); }
        .doc-title { text-align: center; margin-bottom: 3mm; font-weight: 700; color: var(--primary); border: 1px solid var(--primary); padding: 3px; width: 100%; text-transform: uppercase; letter-spacing: 1px; font-size: 11pt; }
        .section { margin-bottom: 3mm; }
        .section-title { font-size: 7.5pt; font-weight: 700; color: var(--accent); text-transform: uppercase; border-bottom: 1px solid var(--border); margin-bottom: 1mm; padding-bottom: 0.5mm; }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid var(--border); }
        .exam-grid-two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .content-box { padding: 6px; border: 1px solid var(--border); border-radius: 4px; min-height: 4mm; white-space: pre-wrap; font-size: 8.5pt; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.25; }
        .content-box strong { display: block; margin-top: 6px; margin-bottom: 0px; color: var(--primary); line-height: 1.2; }
        .content-box strong:first-child { margin-top: 0; }
        .usg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .usg-card { background: #f0fdf4; border: 1px solid #dcfce7; padding: 6px; border-radius: 4px; }
        .label { font-size: 6.5pt; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 1px; }
        
        footer { 
            margin-top: auto;
            padding-top: 5mm; 
            border-top: 1px solid var(--border); 
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: flex-end;
            gap: 5mm;
        }
        .rt-area, .sig-area { 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            min-width: 60mm; 
        }
        .sig-img { 
            width: auto; 
            object-fit: contain; 
            position: relative;
            z-index: 5;
            filter: contrast(1.2) brightness(1.1);
        }
        .rt-area .sig-img {
            height: 32mm; /* Aumentado um pouquinho mais */
            max-width: 65mm;
            top: 12px; /* Descendo um pouquinho mais */
            margin-bottom: -28px;
        }
        .sig-area .sig-img {
            height: 18mm; /* Diminuído um pouco mais */
            max-width: 50mm; /* Limitado para não ficar muito longo */
            top: 8px;
            margin-bottom: -18px;
        }
        .sig-line { 
            width: 100%; 
            border-top: 1.5px solid var(--primary); 
            margin: 0; 
            position: relative;
            z-index: 1;
        }
        .sig-name { 
            font-size: 8.5pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            color: var(--primary);
        }
        .rt-area .sig-name {
            margin-top: 16px; /* Ajustado para compensar o 'top: 12px' */
        }
        .sig-area .sig-name {
            margin-top: 10px; /* Ajustado para compensar o 'top: 8px' */
        }
        .sig-details { 
            font-size: 7pt; 
            color: var(--text-muted); 
            font-weight: 600;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .sig-role { 
            font-size: 6.5pt; 
            color: var(--accent); 
            font-weight: 800; 
            margin-top: 2px;
            text-transform: uppercase;
        }
        .footer-address { 
            font-size: 7.5pt; 
            color: var(--text-muted); 
            text-align: center; 
            line-height: 1.3; 
            padding-bottom: 2mm; 
        }
        .images-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; margin-top: 2mm; }
        .img-card { border: 1px solid var(--border); padding: 3px; border-radius: 6px; text-align: center; }
        .img-frame { height: 60mm; background: #000; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .exam-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    </style>
</head>
<body>
    <!-- Página 1: Geral -->
    <div class="page">
        <header>
            <div class="header-content">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="{{ assetsData-logomarca-consultorio }}" class="logo-img">
                    <div class="clinic-info"><h1>{{ clinicName }}</h1></div>
                </div>
                <div style="text-align:right; font-size:8pt; color:var(--text-muted);">
                    <p>Início: {{ inicio }}</p>
                    <p>Término: {{ final }}</p>
                </div>
            </div>
        </header>
        
        <div class="main-content">
            <div class="doc-title">Prontuário de Atendimento</div>
            <div class="section">
                <div class="section-title">Identificação</div>
                <div class="data-grid">
                    <div><p class="label">Paciente</p><p><strong>{{ nome-tratado-sem-caracter-especial }}</strong></p></div>
                    <div><p class="label">Documento / SUS</p><p>{{ sus }}</p></div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Queixa Principal</div>
                <div class="content-box">{{ QUEIXA PRINCIPAL }}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Antecedentes</div>
                <div class="content-box">{{ ANTECEDENTES }}</div>
            </div>

            <div class="section">
                <div class="section-title">Alergias</div>
                <div class="content-box" style="color: #ef4444; font-weight: 600;">{{ ALERGIAS }}</div>
            </div>

            <div class="section">
                <div class="section-title">Prescrição / Conduta</div>
                <div class="content-box" style="background: #f8fafc; border-color: var(--accent);">{{ PRESCRIÇÃO }}</div>
            </div>

            <div class="section">
                <div class="section-title">Exames Solicitados</div>
                <div class="content-box" style="border-style: dashed;">{{ EXAMES SOLICITADOS }}</div>
            </div>
        </div>

        <footer>
            <div class="rt-area" style="display:{{ rt-display-style }}">
                <img src="{{ rt-assinatura }}" class="sig-img" style="display:{{ rt-img-display-style }}">
                <div class="sig-line"></div>
                <p class="sig-name">{{ rt-nome }}</p>
                <p class="sig-details">{{ rt-registro }}</p>
                <p class="sig-details">{{ rt-profissao }}</p>
                <p class="sig-role">RT PELA EMISSÃO DO LAUDO</p>
            </div>
            <div class="footer-address">
                {{ formattedAddress }}
            </div>
            <div class="sig-area">
                <img src="{{ assinatura-base64-profissional }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ nome-profissional }}</p>
                <p class="sig-details">{{ orgao-classe }}</p>
                <p class="sig-details">{{ Profissao }}</p>
                <p class="sig-role">EXECUTOR DO EXAME</p>
            </div>
        </footer>
    </div>

    <!-- Página 2: Evolução Clínica -->
    <div class="page">
        <header>
            <div class="header-content">
                <div class="clinic-info"><h1>{{ clinicName }}</h1></div>
                <div style="text-align:right; font-size:8pt; color:var(--text-muted);">
                    <p>Paciente: {{ nome-tratado-sem-caracter-especial }}</p>
                </div>
            </div>
        </header>
        
        <div class="main-content">
            <div class="doc-title">Evolução Clínica</div>
            <div class="section">
                <div class="content-box" style="height: 190mm; font-size: 10pt; line-height: 1.6;">{{ EVOLUÇÃO }}</div>
            </div>
        </div>

        <footer>
            <div class="rt-area" style="display:{{ rt-display-style }}">
                <img src="{{ rt-assinatura }}" class="sig-img" style="display:{{ rt-img-display-style }}">
                <div class="sig-line"></div>
                <p class="sig-name">{{ rt-nome }}</p>
                <p class="sig-details">{{ rt-registro }}</p>
                <p class="sig-details">{{ rt-profissao }}</p>
                <p class="sig-role">RT PELA EMISSÃO DO LAUDO</p>
            </div>
            <div class="footer-address">
                {{ formattedAddress }}
            </div>
            <div class="sig-area">
                <img src="{{ assinatura-base64-profissional }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ nome-profissional }}</p>
                <p class="sig-details">{{ orgao-classe }}</p>
                <p class="sig-details">{{ Profissao }}</p>
                <p class="sig-role">EXECUTOR DO EXAME</p>
            </div>
        </footer>
    </div>

    <!-- Página 3: RESULTADO DE EXAME -->
    <div class="page">
        <header>
            <div class="header-content">
                <div class="clinic-info"><h1>{{ clinicName }}</h1></div>
                <div style="text-align:right; font-size:8pt; color:var(--text-muted);">
                    <p>Paciente: {{ nome-tratado-sem-caracter-especial }}</p>
                </div>
            </div>
        </header>
        
        <div class="main-content">
            <div class="doc-title">{{ TITULO MODELO RESULTADO EXAME }}</div>
            
            <!-- Injeção Dinâmica de Seções de Exame -->
            {{ EXAM_SECTIONS_HTML }}
        </div>

        <footer>
            <div class="rt-area" style="display:{{ rt-display-style }}">
                <img src="{{ rt-assinatura }}" class="sig-img" style="display:{{ rt-img-display-style }}">
                <div class="sig-line"></div>
                <p class="sig-name">{{ rt-nome }}</p>
                <p class="sig-details">{{ rt-registro }}</p>
                <p class="sig-details">{{ rt-profissao }}</p>
                <p class="sig-role">RT PELA EMISSÃO DO LAUDO</p>
            </div>
            <div class="footer-address">
                {{ formattedAddress }}
            </div>
            <div class="sig-area">
                <img src="{{ assinatura-base64-profissional }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ nome-profissional }}</p>
                <p class="sig-details">{{ orgao-classe }}</p>
                <p class="sig-details">{{ Profissao }}</p>
                <p class="sig-role">EXECUTOR DO EXAME</p>
            </div>
        </footer>
    </div>
    
    {{ IMAGES_PAGES }}

</body>
</html>
`;

Deno.serve(async (req) => {
  // 1. Manuseio Robusto de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch((e) => {
      console.error("[PDF] Erro ao ler JSON do body:", e.message);
      return {};
    });
    
    // Busca o ID em múltiplos locais possíveis para garantir redundância
    const medicalRecordId = body.medicalRecordId || body.data?.medicalRecordId;
    const { data, isPreview } = body;
    
    console.log(`[PDF] 🚀 Ver 2.8 - Processando ID: ${medicalRecordId} (Preview: ${isPreview})`);
    console.log(`[PDF] Keys no body: ${Object.keys(body).join(', ')}`);
    if (body.data) console.log(`[PDF] Keys no data: ${Object.keys(body.data).join(', ')}`);

    if (!medicalRecordId) {
      console.error("[PDF] Erro: medicalRecordId ausente. Body recebido:", JSON.stringify(body).substring(0, 200));
      throw new Error(`medicalRecordId é obrigatório. (Verificado em: ${Object.keys(body).join(', ')})`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const browserlessToken = Deno.env.get('BROWSERLESS_API_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração de ambiente Supabase ausente (URL ou Key).");
    }
    
    if (!browserlessToken) {
      throw new Error("Configuração ausente: BROWSERLESS_API_KEY não configurada no Supabase.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Buscar os dados atualizados diretamente do banco para garantir sincronia total
    console.log(`[PDF] 📡 Buscando dados oficiais do banco para ID: ${medicalRecordId}`);
    const { data: dbRecord, error: fetchError } = await supabase
      .from('medical_records')
      .select('attendance_start_at, attendance_end_at, created_at')
      .eq('id', medicalRecordId)
      .maybeSingle();

    if (fetchError) {
      console.warn(`[PDF] ⚠️ Aviso ao buscar record: ${fetchError.message}`);
    }

    // Função de formatação de data padronizada
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'Não informado';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Não informado';
        return d.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
      } catch { return 'Não informado'; }
    };

    // Se encontramos o registro, usamos as datas do banco como fonte da verdade ABSOLUTA
    if (dbRecord) {
      // Atualiza os campos que serão injetados no HTML
      data.inicio = formatDate(dbRecord.attendance_start_at || dbRecord.created_at);
      data.final = formatDate(dbRecord.attendance_end_at);
      
      // Sincroniza também as datas puras para o update final no Storage/DB
      data.attendance_start_at = dbRecord.attendance_start_at;
      data.attendance_end_at = dbRecord.attendance_end_at;
      
      console.log(`[PDF] ✅ Datas sincronizadas do banco: Início=${data.inicio}, Fim=${data.final}`);
    } else {
      console.log(`[PDF] ⚠️ Registro não encontrado no banco. Usando datas enviadas pelo cliente.`);
      // Fallback: usar o que veio no 'data' do payload
      data.inicio = data.inicio || formatDate(new Date().toISOString());
      data.final = data.final || 'Não informado';
    }

    // 3. Formatação do endereço central em múltiplas linhas
    const addr = data.clinicAddress || '';
    let formattedAddress = '';
    
    if (!addr.includes(',') && addr.toUpperCase().includes('BAIRRO')) {
      const parts = addr.split(/bairro/i);
      formattedAddress = `${parts[0].trim()}<br>Bairro ${parts[1].trim()}<br>${data.clinicPhone || ''}`;
    } else {
      const addressLines = addr.split(',').map(s => s.trim());
      if (addressLines.length >= 2) {
        formattedAddress = `${addressLines[0]}<br>${addressLines[1]}<br>${data.clinicPhone || ''}`;
      } else {
        formattedAddress = `${addr}<br>${data.clinicPhone || ''}`;
      }
    }
    
    data.formattedAddress = formattedAddress;
    data['rt-display-style'] = data['rt-nome'] ? 'flex' : 'none';
    data['rt-img-display-style'] = data['rt-assinatura'] ? 'block' : 'none';

    // 4. Processar Imagens no Servidor
    let imagesHtml = '';
    const imgs = [];
    for(let i=1; i<=15; i++) {
      const s = data[`imagem${i}-usg`];
      if(s && s.length > 500) {
        imgs.push({ s, t: data[`descricao-img${i}`] || 'Sem descrição' });
      }
    }

    if(imgs.length > 0) {
      for(let j=0; j<imgs.length; j+=6) {
        imagesHtml += `<div class="page">
          <header>
            <div class="header-content">
              <div class="clinic-info"><h1>${data.clinicName || 'Clínica'}</h1></div>
              <div style="text-align:right; font-size:8pt; color:var(--text-muted);"><p>Imagens - Pág ${Math.floor(j/6)+1}</p></div>
            </div>
          </header>
          <div class="main-content">
            <div class="doc-title">Imagens do Exame</div>
            <div class="images-container">`;
        imgs.slice(j, j+6).forEach(img => {
          imagesHtml += `<div class="img-card"><div class="img-frame"><img src="${img.s}" class="exam-img"></div><p style="font-size:7pt;margin-top:3px;">${img.t}</p></div>`;
        });
        imagesHtml += `</div></div>
          <footer>
            <div class="rt-area" style="display:${data['rt-display-style']}">
                <img src="${data['rt-assinatura'] || ''}" class="sig-img" style="display:${data['rt-img-display-style']}">
                <div class="sig-line"></div>
                <p class="sig-name">${data['rt-nome'] || ''}</p>
                <p class="sig-details">${data['rt-registro'] || ''}</p>
                <p class="sig-details">${data['rt-profissao'] || ''}</p>
                <p class="sig-role">RT PELA EMISSÃO DO LAUDO</p>
            </div>
            <div class="footer-address">${formattedAddress}</div>
            <div class="sig-area">
                <img src="${data['assinatura-base64-profissional'] || ''}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">${data['nome-profissional'] || ''}</p>
                <p class="sig-details">${data['orgao-classe'] || ''}</p>
                <p class="sig-details">${data['Profissao'] || ''}</p>
                <p class="sig-role">EXECUTOR DO EXAME</p>
            </div>
          </footer>
        </div>`;
      }
    }

    // 5. Gerar HTML Dinâmico para as Seções do Exame
    let examSectionsHtml = '';
    const dynamicFields = data.dynamic_fields_json ? JSON.parse(data.dynamic_fields_json) : {};
    const ignoreKeys = ['modelTitle', 'modelId'];
    const modelTitle = (data['TITULO MODELO RESULTADO EXAME'] || '').toUpperCase();
    const hasObstetricFields = !!(dynamicFields.ig || dynamicFields.dpp || dynamicFields.ac || dynamicFields.bpd);
    const isObstetric = modelTitle.includes('OBSTÉTRICA') || modelTitle.includes('OBSTETRICA') || modelTitle.includes('POCUS') || hasObstetricFields;
    
    if (isObstetric) {
      data['TITULO MODELO RESULTADO EXAME'] = 'RESULTADO DE USG POCUS';
      let fetalFieldsHtml = `<div class="section"><div class="section-title">DADOS FETAIS</div><div class="usg-grid">`;
      let hasFetalData = false;
      ['ig', 'dpp', 'peso', 'percentil'].forEach(key => {
        if (dynamicFields[key]) {
          fetalFieldsHtml += `<div class="usg-card"><p class="label">${key.toUpperCase()}</p><p>${dynamicFields[key]}</p></div>`;
          hasFetalData = true;
        }
      });
      fetalFieldsHtml += `</div></div>`;
      if (hasFetalData) examSectionsHtml += fetalFieldsHtml;

      let biometriaHtml = `<div class="section"><div class="section-title">BIOMETRIA FETAL</div><div class="usg-grid">`;
      let hasBiometria = false;
      ['bpd', 'hc', 'ac', 'fl'].forEach(key => {
        if (dynamicFields[key]) {
          biometriaHtml += `<div class="usg-card"><p class="label">${key.toUpperCase()}</p><p>${dynamicFields[key]}</p></div>`;
          hasBiometria = true;
        }
      });
      biometriaHtml += `</div></div>`;
      if (hasBiometria) examSectionsHtml += biometriaHtml;

      let complementaresHtml = `<div class="section"><div class="section-title">DADOS COMPLEMENTARES</div><div class="usg-grid">`;
      let hasComplementares = false;
      const compFields = [{ k: 'bcf', l: 'BCF' }, { k: 'af', l: 'AF' }, { k: 'situacao', l: 'SITUAÇÃO' }, { k: 'apresentacao', l: 'APRESENTAÇÃO' }];
      compFields.forEach(f => {
        if (dynamicFields[f.k]) {
          complementaresHtml += `<div class="usg-card"><p class="label">${f.l}</p><p>${dynamicFields[f.k]}</p></div>`;
          hasComplementares = true;
        }
      });
      complementaresHtml += `</div></div>`;
      if (hasComplementares) examSectionsHtml += complementaresHtml;
      
      const sectionsOrder = [
        { key: 'impressaodiagnostica', label: 'IMPRESSÃO DIAGNÓSTICA', style: 'style="background:#f0fdf4; font-weight:600;"' },
        { key: 'achadosadicionais', label: 'ACHADOS ADICIONAIS', style: '' },
        { key: 'recomendacoes', label: 'RECOMENDAÇÕES', style: '' },
        { key: 'observacoes', label: 'OBSERVAÇÕES', style: '' }
      ];

      sectionsOrder.forEach(sec => {
        if (dynamicFields[sec.key]) {
          examSectionsHtml += `<div class="section"><div class="section-title">${sec.label}</div><div class="content-box" ${sec.style}>${String(dynamicFields[sec.key])}</div></div>`;
        }
      });
    } else {
      data['TITULO MODELO RESULTADO EXAME'] = data['TITULO MODELO RESULTADO EXAME'] || 'RESULTADO DE EXAME';
      
      const stackedKeys = ['impressaodiagnostica', 'recomendacoes', 'observacoes'];
      const ignoreKeys = ['modelTitle', 'modelId', '_ordered_keys', ...stackedKeys];
      
      // Usar a ordem definida pelo frontend, ou fallback para as chaves do objeto
      let keysToProcess: string[] = [];
      if (dynamicFields._ordered_keys && typeof dynamicFields._ordered_keys === 'string') {
        keysToProcess = dynamicFields._ordered_keys.split(',');
        // Garantir que não perdemos chaves preenchidas que não estavam em _ordered_keys
        Object.keys(dynamicFields).forEach(k => {
          if (!keysToProcess.includes(k) && !ignoreKeys.some(ik => k.toLowerCase().includes(ik.toLowerCase()))) {
            keysToProcess.push(k);
          }
        });
      } else {
        keysToProcess = Object.keys(dynamicFields);
        
        // Fallback: Ordenar as chaves com base na ordem preferida (referência Imagem 2 do painel)
        // para garantir que PDFs antigos ou gerados sem _ordered_keys fiquem na ordem correta
        const preferredOrder = [
          'rins',
          'rimdireito',
          'rimesquerdo',
          'medidadosrins',
          'bexiga',
          'prostata',
          'achadosadicionais'
        ];
        
        keysToProcess.sort((a, b) => {
          const lowerA = a.toLowerCase().replace(/[\s_]/g, '');
          const lowerB = b.toLowerCase().replace(/[\s_]/g, '');
          
          const indexA = preferredOrder.indexOf(lowerA);
          const indexB = preferredOrder.indexOf(lowerB);
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
      }
      
      // Coletar todos os outros campos mantendo a ordem do array
      const otherFields: {key: string, val: any}[] = [];
      keysToProcess.forEach(key => {
        const val = dynamicFields[key];
        // Tratar as chaves ignorando case para evitar duplicidade ou perda
        const lowerKey = key.toLowerCase().replace(/[\s_]/g, '');
        const isStacked = stackedKeys.some(sk => lowerKey.includes(sk));
        const isIgnore = ignoreKeys.some(ik => lowerKey.includes(ik.toLowerCase()));
        
        if (!isStacked && !isIgnore && val && String(val).trim()) {
          otherFields.push({key, val});
        }
      });

      // Gerar a grid lado a lado para os demais campos
      if (otherFields.length > 0) {
        let gridHtml = `<div class="exam-grid-two-cols">`;
        
        for (let i = 0; i < otherFields.length; i++) {
          const field = otherFields[i];
          let label = field.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          
          const labelMap: Record<string, string> = { 
            'figado': 'FÍGADO', 'viasbiliares': 'VIAS BILIARES', 'vesiculabiliar': 'VESÍCULA BILIAR', 
            'pancreaseretroperitonio': 'PÂNCREAS E RETROPERITÔNIO', 'baco': 'BAÇO', 
            'rins': 'RINS', 'bexiga': 'BEXIGA', 'apendicececal': 'APÊNDICE CECAL', 
            'cavidadeabdominal': 'CAVIDADE ABDOMINAL', 'aortaabdominal': 'AORTA ABDOMINAL',
            'rimdireito': 'RIM DIREITO', 'rimesquerdo': 'RIM ESQUERDO', 'medidadosrins': 'MEDIDA DOS RINS',
            'prostata': 'PRÓSTATA', 'achadosadicionais': 'ACHADOS ADICIONAIS'
          };
          
          const lowerKey = field.key.toLowerCase().replace(/[\s_]/g, '');
          if (labelMap[lowerKey]) {
            label = labelMap[lowerKey];
          }

          // Centralizar se for o último e for ímpar
          if (i === otherFields.length - 1 && otherFields.length % 2 !== 0) {
             gridHtml += `<div class="section" style="grid-column: 1 / -1; width: calc(50% - 4px); margin: 0 auto;"><div class="section-title">${label.toUpperCase()}</div><div class="content-box">${String(field.val)}</div></div>`;
          } else {
             gridHtml += `<div class="section"><div class="section-title">${label.toUpperCase()}</div><div class="content-box">${String(field.val)}</div></div>`;
          }
        }
        gridHtml += `</div>`;
        examSectionsHtml += gridHtml;
      }

      // Adicionar os 3 campos no final, um sob o outro
      const stackedSections = [
        { searchKey: 'impressaodiagnostica', label: 'IMPRESSÃO DIAGNÓSTICA', style: 'style="background:#f0fdf4; font-weight:600;"' },
        { searchKey: 'recomendacoes', label: 'RECOMENDAÇÕES', style: '' },
        { searchKey: 'observacoes', label: 'OBSERVAÇÕES', style: '' }
      ];

      stackedSections.forEach(sec => {
        const actualKey = Object.keys(dynamicFields).find(k => 
          k.toLowerCase().replace(/[\s_]/g, '').includes(sec.searchKey)
        );
        if (actualKey && dynamicFields[actualKey]) {
          examSectionsHtml += `<div class="section" style="margin-top: 8px;"><div class="section-title">${sec.label}</div><div class="content-box" ${sec.style}>${String(dynamicFields[actualKey])}</div></div>`;
        }
      });
    }

    // 6. Mapeamento final de placeholders
    console.log(`[PDF] 🛠️ Mapeando placeholders...`);
    const finalHtml = PREMIUM_TEMPLATE
      .replace('{{ IMAGES_PAGES }}', imagesHtml)
      .replace('{{ EXAM_SECTIONS_HTML }}', examSectionsHtml)
      .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, key) => {
        const cleanKey = key.replace(/\$json\[['"]|['"]\]/g, '').trim();
        let val = data[cleanKey];
        if (val === undefined || val === null) return match;
        if (typeof val === 'string' && val.length > 2500000) return '[Conteúdo muito grande]';
        if (typeof val === 'string' && val.length > 30) {
          val = val.replace(/\. +/g, '.\n').replace(/\n\n+/g, '\n');
          val = val.replace(/^([A-ZÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ\s\(\)]{4,})\n+/gm, '<strong>$1</strong>');
          val = val.replace(/^([A-ZÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ\s\(\)]{4,})$/gm, '<strong>$1</strong>');
        }
        return String(val);
      });

    // 7. Chamada ao Browserless
    console.log(`[PDF] 🌐 Enviando para Browserless...`);
    const response = await fetch(`https://chrome.browserless.io/pdf?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: finalHtml,
        options: { format: 'A4', printBackground: true, margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } },
        gotoOptions: { waitUntil: 'networkidle0', timeout: 45000 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro Browserless (${response.status}): ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    // 8. Upload para o Storage
    const safePatientName = data['nome-limpo-para-arquivo'] || 'PRONTUARIO';
    const filePath = `prontuarios/${safePatientName}_${medicalRecordId}.pdf`;
    console.log(`[PDF] 📂 Salvando no Storage: ${filePath}`);

    const metadata = {
      attendance_start: data.attendance_start_at || '',
      attendance_end: data.attendance_end_at || '',
      patient_name: data['nome-tratado-sem-caracter-especial'] || ''
    };

    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, pdfBuffer, { 
      contentType: 'application/pdf', 
      upsert: true,
      metadata: metadata
    });

    if (uploadError) {
      throw new Error(`Erro ao subir PDF para o Storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

    // 9. Atualizar Banco de Dados (Apenas se não for preview)
    if (isPreview) {
      console.log(`[PDF] 👁️ Preview gerado com sucesso.`);
      return new Response(JSON.stringify({ success: true, publicUrl }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[PDF] 💾 Atualizando medical_records para ID: ${medicalRecordId}`);
    const { error: dbError } = await supabase
      .from('medical_records')
      .update({ 
        file_url_storage: publicUrl,
        attendance_start_at: data.attendance_start_at || null,
        attendance_end_at: data.attendance_end_at || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', medicalRecordId);

    if (dbError) {
      console.error(`[PDF] ❌ Erro ao atualizar banco: ${dbError.message}`);
    } else {
      console.log(`[PDF] ✅ Banco de dados sincronizado.`);
    }

    return new Response(JSON.stringify({ success: true, publicUrl }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error("💥 ERRO CRÍTICO NA EDGE FUNCTION:", err.message);
    return new Response(JSON.stringify({ 
      error: err.message, 
      success: false,
      details: "Verifique os logs da função no painel do Supabase para mais detalhes."
    }), { 
      status: 200, // Retornamos 200 para que o frontend consiga ler o JSON de erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
