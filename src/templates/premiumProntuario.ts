
export const PREMIUM_PRONTUARIO_TEMPLATE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prontuário Profissional - {{ $json['nome-tratado-sem-caracter-especial'] }}</title>
    <style>
        /* ========================================
           FONTES E VARIÁVEIS
           ======================================== */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        :root {
            --primary: #0f172a;        /* Slate 900 */
            --secondary: #334155;      /* Slate 700 */
            --accent: #10b981;         /* Emerald 500 */
            --accent-soft: #ecfdf5;    /* Emerald 50 */
            --border: #e2e8f0;         /* Slate 200 */
            --bg-card: #f8fafc;        /* Slate 50 */
            --text-main: #1e293b;      /* Slate 800 */
            --text-muted: #64748b;     /* Slate 500 */
            --white: #ffffff;
        }

        /* ========================================
           CONFIGURAÇÕES DE PÁGINA (A4)
           ======================================== */
        @page {
            size: A4;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-main);
            background-color: #f1f5f9;
            line-height: 1.5;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 10mm auto;
            background: var(--white);
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            page-break-after: always;
            overflow: hidden;
        }

        /* Marca d'água discreta */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 120pt;
            color: rgba(16, 185, 129, 0.03);
            font-weight: 800;
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ========================================
           CABEÇALHO
           ======================================== */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid var(--accent);
            padding-bottom: 8mm;
            margin-bottom: 8mm;
            position: relative;
            z-index: 10;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo-img {
            height: 22mm;
            width: auto;
            object-fit: contain;
        }

        .clinic-info h1 {
            font-family: 'Playfair Display', serif;
            font-size: 20pt;
            color: var(--primary);
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }

        .clinic-info p {
            font-size: 9pt;
            color: var(--accent);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .header-right {
            text-align: right;
            font-size: 8pt;
            color: var(--text-muted);
            line-height: 1.4;
        }

        /* ========================================
           COMPONENTES DE CONTEÚDO
           ======================================== */
        .doc-title-container {
            text-align: center;
            margin-bottom: 8mm;
        }

        .doc-title {
            display: inline-block;
            padding: 6px 30px;
            background: var(--primary);
            color: var(--white);
            border-radius: 50px;
            font-size: 12pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .section {
            margin-bottom: 6mm;
            position: relative;
            z-index: 1;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 3mm;
        }

        .section-header .line {
            height: 2px;
            flex-grow: 1;
            background: var(--border);
        }

        .section-header h3 {
            font-size: 10pt;
            font-weight: 700;
            color: var(--secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
        }

        /* Cards de Dados */
        .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            background: var(--bg-card);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid var(--border);
        }

        .data-item {
            display: flex;
            flex-direction: column;
        }

        .label {
            font-size: 7.5pt;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .value {
            font-size: 10pt;
            font-weight: 500;
            color: var(--primary);
        }

        /* Boxes de Texto */
        .content-box {
            padding: 12px 15px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 10pt;
            min-height: 20mm;
            white-space: pre-wrap;
            text-align: justify;
        }

        /* ========================================
           PÁGINA 3: LAUDO USG (DESIGN PREMIUM)
           ======================================== */
        .usg-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 5mm;
        }

        .usg-card {
            background: var(--accent-soft);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 8px 12px;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
        }

        .usg-label {
            font-size: 7pt;
            color: var(--accent);
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 1px;
        }

        .usg-value {
            font-size: 9.5pt;
            font-weight: 600;
            color: var(--primary);
        }

        .biometria-section {
            background: #fdf2f8; /* Soft pink for biometry */
            border: 1px solid #fbcfe8;
            padding: 15px;
            border-radius: 10px;
            margin-top: 5mm;
        }

        .biometria-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        /* ========================================
           RODAPÉ E ASSINATURA
           ======================================== */
        footer {
            margin-top: auto;
            padding-top: 5mm;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            position: relative;
            z-index: 10;
        }

        .clinic-contact {
            font-size: 7.5pt;
            color: var(--text-muted);
            text-align: center;
            flex: 1;
            padding: 0 5mm;
            margin-bottom: 5px;
        }

        .signature-area {
            text-align: center;
            width: 65mm;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sig-img {
            width: auto;
            object-fit: contain;
            position: relative;
            filter: contrast(1.2) brightness(1.1);
            z-index: 5;
        }

        .rt-area .sig-img {
            height: 32mm;
            max-width: 65mm;
            top: 12px;
            margin-bottom: -28px;
        }

        .sig-area .sig-img {
            height: 18mm;
            max-width: 50mm;
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
            color: var(--primary);
            text-transform: uppercase;
        }

        .rt-area .sig-name {
            margin-top: 16px;
        }

        .sig-area .sig-name {
            margin-top: 10px;
        }

        .sig-role {
            font-size: 7pt;
            color: var(--text-muted);
            font-weight: 600;
            line-height: 1.1;
            text-transform: uppercase;
        }

        .page-number {
            position: absolute;
            bottom: 5mm;
            right: 5mm;
            font-size: 7pt;
            color: var(--text-muted);
            font-style: italic;
        }

        /* ========================================
           IMAGENS
           ======================================== */
        .images-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15mm;
            margin-top: 5mm;
            flex-grow: 1;
        }

        .img-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 10px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: fit-content;
        }

        .img-frame {
            width: 100%;
            height: 75mm;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .exam-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .img-caption {
            font-size: 9pt;
            font-weight: 600;
            color: var(--secondary);
            padding: 5px;
            border-top: 1px solid var(--border);
        }

        /* ========================================
           PRINT ADJUSTMENTS
           ======================================== */
        @media print {
            body { background: var(--white); }
            .page { margin: 0; box-shadow: none; width: 100%; height: 297mm; }
            .watermark { display: block; }
        }
    </style>
</head>
<body>

    <!-- Template de Cabeçalho Reutilizável para JS -->
    <template id="header-template">
        <header>
            <div class="header-left">
                 <img src="{{ $json['assetsData-logomarca-consultorio'] }}" class="logo-img">
                 <div class="clinic-info">
                     <h1>{{ $json.clinicName || 'CONSULTÓRIO JRS' }}</h1>
                 </div>
             </div>
            <div class="header-right">
                <p><strong>Paciente:</strong> {{ $json['nome-tratado-sem-caracter-especial'] }}</p>
            </div>
        </header>
    </template>

    <!-- Template de Rodapé Reutilizável para JS -->
    <template id="footer-template">
        <footer>
            <div class="signature-area">
                <img src="{{ $json['rt-assinatura'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['rt-nome'] }}</p>
                <p class="sig-role">{{ $json['rt-profissao'] }}</p>
                <p class="sig-role">{{ $json['rt-registro'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">RT PELA EMISSÃO DO LAUDO</p>
            </div>

            <div class="clinic-contact">
                <p>{{ $json.clinicAddress }}</p>
                <p>{{ $json.clinicPhone }}</p>
            </div>

            <div class="signature-area">
                <img src="{{ $json['assinatura-base64-profissional'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['nome-profissional'] }}</p>
                <p class="sig-role">{{ $json.Profissao }}</p>
                <p class="sig-role">{{ $json['orgao-classe'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">EXECUTOR DO EXAME</p>
            </div>
        </footer>
    </template>

    <!-- PÁGINA 1: DADOS E ANTECEDENTES -->
    <div class="page">
        <div class="watermark">JRS MEDICAL</div>
        
        <header>
            <div class="header-left">
                <img src="{{ $json['assetsData-logomarca-consultorio'] }}" class="logo-img" alt="Logo">
                <div class="clinic-info">
                    <h1>{{ $json.clinicName || 'CONSULTÓRIO JRS' }}</h1>
                    <p>Especialidades em Saúde & Enfermagem</p>
                </div>
            </div>
            <div class="header-right">
                <p><strong>Emissão:</strong> {{ $json['inicio-atendimento'] }}</p>
                <p><strong>Protocolo:</strong> #{{ $json.id }}</p>
            </div>
        </header>

        <div class="doc-title-container">
            <span class="doc-title">Prontuário de Atendimento</span>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Identificação da Paciente</h3>
                <div class="line"></div>
            </div>
            <div class="data-grid">
                <div class="data-item"><span class="label">Nome Completo</span><span class="value">{{ $json['nome-tratado-sem-caracter-especial'] }}</span></div>
                <div class="data-item"><span class="label">Documento / SUS</span><span class="value">{{ $json.sus }}</span></div>
                <div class="data-item"><span class="label">Telefone</span><span class="value">{{ $json.telefone }}</span></div>
                <div class="data-item"><span class="label">Data de Nascimento</span><span class="value">{{ $json.data_nascimento }}</span></div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Queixa Principal</h3>
                <div class="line"></div>
            </div>
            <div class="content-box">{{ $json['QUEIXA PRINCIPAL'] }}</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Antecedentes Pessoais / Familiares</h3>
                <div class="line"></div>
            </div>
            <div class="content-box">{{ $json.ANTECEDENTES }}</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Alergias Conhecidas</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="color: #b91c1c; font-weight: 500;">{{ $json.ALERGIAS }}</div>
        </div>

        <footer>
            <div class="signature-area">
                <img src="{{ $json['rt-assinatura'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['rt-nome'] }}</p>
                <p class="sig-role">{{ $json['rt-profissao'] }}</p>
                <p class="sig-role">{{ $json['rt-registro'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">RT PELA EMISSÃO DO LAUDO</p>
            </div>

            <div class="clinic-contact">
                <p>{{ $json.clinicAddress }}</p>
                <p>{{ $json.clinicPhone }}</p>
            </div>

            <div class="signature-area">
                <img src="{{ $json['assinatura-base64-profissional'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['nome-profissional'] }}</p>
                <p class="sig-role">{{ $json.Profissao }}</p>
                <p class="sig-role">{{ $json['orgao-classe'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">EXECUTOR DO EXAME</p>
            </div>
        </footer>
        <div class="page-number">Página 1 de 3</div>
    </div>

    <!-- PÁGINA 2: EVOLUÇÃO E PRESCRIÇÃO -->
    <div class="page">
        <header>
            <div class="header-left">
                <img src="{{ $json['assetsData-logomarca-consultorio'] }}" class="logo-img">
                <div class="clinic-info">
                    <h1>{{ $json.clinicName || 'CONSULTÓRIO JRS' }}</h1>
                </div>
            </div>
            <div class="header-right">
                <p><strong>Paciente:</strong> {{ $json['nome-tratado-sem-caracter-especial'] }}</p>
            </div>
        </header>

        <div class="section">
            <div class="section-header">
                <h3>Evolução Clínica e Exame Físico</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="min-height: 80mm;">{{ $json['EVOLUÇÃO'] }}</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Prescrição e Conduta</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="min-height: 50mm; background: #fdfcf0;">{{ $json['PRESCRIÇÃO'] }}</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Exames Solicitados</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="min-height: 30mm;">{{ $json['EXAMES SOLICITADOS'] }}</div>
        </div>

        <footer>
            <div class="signature-area">
                <img src="{{ $json['rt-assinatura'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['rt-nome'] }}</p>
                <p class="sig-role">{{ $json['rt-profissao'] }}</p>
                <p class="sig-role">{{ $json['rt-registro'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">RT PELA EMISSÃO DO LAUDO</p>
            </div>

            <div class="clinic-contact">
                <p>{{ $json.clinicAddress }}</p>
                <p>{{ $json.clinicPhone }}</p>
            </div>

            <div class="signature-area">
                <img src="{{ $json['assinatura-base64-profissional'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['nome-profissional'] }}</p>
                <p class="sig-role">{{ $json.Profissao }}</p>
                <p class="sig-role">{{ $json['orgao-classe'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">EXECUTOR DO EXAME</p>
            </div>
        </footer>
        <div class="page-number">Página 2 de 3</div>
    </div>

    <!-- PÁGINA 3: LAUDO USG -->
    <div class="page">
        <header>
            <div class="header-left">
                <img src="{{ $json['assetsData-logomarca-consultorio'] }}" class="logo-img">
                <div class="clinic-info">
                    <h1>{{ $json.clinicName || 'CONSULTÓRIO JRS' }}</h1>
                </div>
            </div>
            <div class="header-right">
                <p><strong>Exame:</strong> {{ $json['TITULO MODELO RESULTADO EXAME'] }}</p>
            </div>
        </header>

        <div class="doc-title-container">
            <span class="doc-title">Laudo de Ultrassonografia</span>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Dados Gestacionais</h3>
                <div class="line"></div>
            </div>
            <div class="usg-grid">
                <div class="usg-card"><span class="usg-label">Gravidez</span><span class="usg-value">{{ $json.GRAVIDEZ }}</span></div>
                <div class="usg-card"><span class="usg-label">Feto</span><span class="usg-value">{{ $json.FETO }}</span></div>
                <div class="usg-card"><span class="usg-label">Apresentação</span><span class="usg-value">{{ $json.APRESENTAÇÃO }}</span></div>
                <div class="usg-card"><span class="usg-label">Situação</span><span class="usg-value">{{ $json.SITUAÇÃO }}</span></div>
                <div class="usg-card"><span class="usg-label">IG Atual</span><span class="usg-value">{{ $json.IG }}</span></div>
                <div class="usg-card"><span class="usg-label">DPP</span><span class="usg-value">{{ $json.DPP }}</span></div>
                <div class="usg-card"><span class="usg-label">Placenta</span><span class="usg-value">{{ $json.PLACENTA }}</span></div>
                <div class="usg-card"><span class="usg-label">Líquido Amniótico (AF)</span><span class="usg-value">{{ $json['AF MAIO BOLSÃO DE LIQUIDO'] }}</span></div>
                <div class="usg-card"><span class="usg-label">Cordão Umbilical</span><span class="usg-value">{{ $json['CORDÃO UMBILICAL'] }}</span></div>
            </div>
        </div>

        <div class="biometria-section">
            <div class="section-header">
                <h3 style="color: #9d174d;">Biometria Fetal</h3>
                <div class="line" style="background: #fbcfe8;"></div>
            </div>
            <div class="biometria-grid">
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">BPD</span><span class="usg-value">{{ $json.BPD }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">HC</span><span class="usg-value">{{ $json.HC }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">AC</span><span class="usg-value">{{ $json.AC }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">FL</span><span class="usg-value">{{ $json.FL }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">Peso Fetal</span><span class="usg-value">{{ $json.PESO }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">Percentil</span><span class="usg-value">{{ $json.PERCENTIL }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">BCF</span><span class="usg-value">{{ $json.BCF }}</span></div>
                <div class="usg-card" style="background: white;"><span class="usg-label" style="color: #db2777;">Sexo</span><span class="usg-value">{{ $json.SEXO }}</span></div>
            </div>
        </div>

        <div class="section" style="margin-top: 5mm;">
            <div class="section-header">
                <h3>Impressão Diagnóstica</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="font-weight: 600; border-left: 5px solid var(--accent);">{{ $json['IMPRESSÃO DIAGNÓSTICA'] }}</div>
        </div>

        <div class="section">
            <div class="section-header">
                <h3>Notas e Observações</h3>
                <div class="line"></div>
            </div>
            <div class="content-box" style="font-size: 8.5pt; color: var(--text-muted);">
{{ $json['ACHADOS ADICIONAIS'] }}
<br><br>
<strong>Recomendações:</strong> {{ $json['RECOMENDAÇÕES'] }}
<br><br>
<small>{{ $json['OBSERVAÇÕES'] }}</small>
            </div>
        </div>

        <footer>
            <div class="signature-area">
                <img src="{{ $json['rt-assinatura'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['rt-nome'] }}</p>
                <p class="sig-role">{{ $json['rt-profissao'] }}</p>
                <p class="sig-role">{{ $json['rt-registro'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">RT PELA EMISSÃO DO LAUDO</p>
            </div>

            <div class="clinic-contact">
                <p>{{ $json.clinicAddress }}</p>
                <p>{{ $json.clinicPhone }}</p>
            </div>

            <div class="signature-area">
                <img src="{{ $json['assinatura-base64-profissional'] }}" class="sig-img">
                <div class="sig-line"></div>
                <p class="sig-name">{{ $json['nome-profissional'] }}</p>
                <p class="sig-role">{{ $json.Profissao }}</p>
                <p class="sig-role">{{ $json['orgao-classe'] }}</p>
                <p class="sig-role" style="color: var(--accent); margin-top: 2px;">EXECUTOR DO EXAME</p>
            </div>
        </footer>
        <div class="page-number">Página 3 de 3</div>
    </div>

    <!-- CONTAINER PARA PÁGINAS DE IMAGENS DINÂMICAS -->
    <div id="dynamic-image-pages"></div>

    <script>
        const imageData = [
            { src: '{{ $json["imagem1-usg"] }}', desc: '{{ $json["descricao-img1"] }}' },
            { src: '{{ $json["imagem2-usg"] }}', desc: '{{ $json["descricao-img2"] }}' },
            { src: '{{ $json["imagem3-usg"] }}', desc: '{{ $json["descricao-img3"] }}' },
            { src: '{{ $json["imagem4-usg"] }}', desc: '{{ $json["descricao-img4"] }}' },
            { src: '{{ $json["imagem5-usg"] }}', desc: '{{ $json["descricao-img5"] }}' },
            { src: '{{ $json["imagem6-usg"] }}', desc: '{{ $json["descricao-img6"] }}' },
            { src: '{{ $json["imagem7-usg"] }}', desc: '{{ $json["descricao-img7"] }}' },
            { src: '{{ $json["imagem8-usg"] }}', desc: '{{ $json["descricao-img8"] }}' },
            { src: '{{ $json["imagem9-usg"] }}', desc: '{{ $json["descricao-img9"] }}' },
            { src: '{{ $json["imagem10-usg"] }}', desc: '{{ $json["descricao-img10"] }}' },
            { src: '{{ $json["imagem11-usg"] }}', desc: '{{ $json["descricao-img11"] }}' },
            { src: '{{ $json["imagem12-usg"] }}', desc: '{{ $json["descricao-img12"] }}' },
            { src: '{{ $json["imagem13-usg"] }}', desc: '{{ $json["descricao-img13"] }}' },
            { src: '{{ $json["imagem14-usg"] }}', desc: '{{ $json["descricao-img14"] }}' },
            { src: '{{ $json["imagem15-usg"] }}', desc: '{{ $json["descricao-img15"] }}' }
        ];

        function isValid(src) {
            return src && src.length > 50 && !src.includes('{{');
        }

        const validImages = imageData.filter(img => isValid(img.src));
        const container = document.getElementById('dynamic-image-pages');

        if (validImages.length > 0) {
            // Atualiza o total de páginas nas páginas anteriores
            const totalPages = 3 + Math.ceil(validImages.length / 2);
            document.querySelectorAll('.page-number').forEach((el, idx) => {
                el.innerText = \`Página \${idx + 1} de \${totalPages}\`;
            });

            for (let i = 0; i < validImages.length; i += 2) {
                const pageNum = 4 + Math.floor(i / 2);
                const page = document.createElement('div');
                page.className = 'page';
                
                // Header
                const header = document.getElementById('header-template').content.cloneNode(true);
                page.appendChild(header);

                // Content
                const content = document.createElement('div');
                content.className = 'images-container';
                
                const batch = validImages.slice(i, i + 2);
                batch.forEach(img => {
                    const card = document.createElement('div');
                    card.className = 'img-card';
                    card.innerHTML = \`
                        <div class="img-frame"><img src="\${img.src}" class="exam-img"></div>
                        <div class="img-caption">\${img.desc || 'Registro de Exame'}</div>
                    \`;
                    content.appendChild(card);
                });
                page.appendChild(content);

                // Footer
                const footer = document.getElementById('footer-template').content.cloneNode(true);
                page.appendChild(footer);

                // Page Number
                const pNum = document.createElement('div');
                pNum.className = 'page-number';
                pNum.innerText = \`Página \${pageNum} de \${totalPages}\`;
                page.appendChild(pNum);

                container.appendChild(page);
            }
        }
        
        // Sinaliza para o Browserless que a renderização dinâmica terminou
        const done = document.createElement('div');
        done.id = 'render-complete';
        document.body.appendChild(done);
    </script>
</body>
</html>
`;
