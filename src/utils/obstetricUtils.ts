/**
 * Utilitários para cálculos obstétricos
 */

/**
 * Calcula a idade gestacional em semanas e dias a partir da DUM
 * @param dum Data da Última Menstruação (formato DD/MM/AAAA)
 * @returns Objeto com semanas, dias e texto formatado
 */
export const calculateGestationalAge = (dum: string) => {
  if (!dum || dum.length !== 10) {
    return null;
  }

  try {
    // Converte DD/MM/AAAA para Date
    const [day, month, year] = dum.split('/').map(Number);
    const dumDate = new Date(year, month - 1, day);
    
    // Verifica se a data é válida
    if (isNaN(dumDate.getTime())) {
      return null;
    }

    // Calcula a diferença em dias
    const today = new Date();
    const diffTime = today.getTime() - dumDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Converte para semanas e dias
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    // Verifica se é uma gestação válida (até 42 semanas)
    if (weeks < 0 || weeks > 42) {
      return null;
    }

    return {
      weeks,
      days,
      totalDays: diffDays,
      formatted: `${weeks}s ${days}d`
    };
  } catch (error) {
    return null;
  }
};

/**
 * Calcula a Data Provável do Parto (DPP) a partir da DUM
 * Regra de Naegele: DUM + 280 dias (40 semanas)
 * @param dum Data da Última Menstruação (formato DD/MM/AAAA)
 * @returns Data provável do parto (formato DD/MM/AAAA)
 */
export const calculateDPP = (dum: string): string | null => {
  if (!dum || dum.length !== 10) {
    return null;
  }

  try {
    // Converte DD/MM/AAAA para Date
    const [day, month, year] = dum.split('/').map(Number);
    const dumDate = new Date(year, month - 1, day);
    
    // Verifica se a data é válida
    if (isNaN(dumDate.getTime())) {
      return null;
    }

    // Adiciona 280 dias (40 semanas)
    const dppDate = new Date(dumDate);
    dppDate.setDate(dppDate.getDate() + 280);

    // Formata para DD/MM/AAAA
    const dppDay = dppDate.getDate().toString().padStart(2, '0');
    const dppMonth = (dppDate.getMonth() + 1).toString().padStart(2, '0');
    const dppYear = dppDate.getFullYear();

    return `${dppDay}/${dppMonth}/${dppYear}`;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica se um serviço é obstétrico
 * @param serviceName Nome do serviço
 * @returns true se é um serviço obstétrico
 */
export const isObstetricService = (serviceName: string): boolean => {
  console.log('🔍 [DEBUG] isObstetricService chamada com:', serviceName);
  
  if (!serviceName || typeof serviceName !== 'string') {
    return false;
  }
  
  const serviceNameUpper = serviceName.toUpperCase();
  
  // Lista de termos que indicam serviços obstétricos
  const obstetricTerms = [
    'OBSTETRICIA',
    'OBSTETRÍCIA', 
    'OBSTÉTRICA',
    'OBSTETRICA', // sem acento
    'PRÉ-NATAL',
    'PRE-NATAL', // sem acento
    'PRE NATAL',
    'PRENATAL',
    'GESTANTE',
    'GRAVIDEZ',
    'USG POCUS OBSTÉTRICA',
    'USG POCUS OBSTETRICA',
    'ULTRASSOM OBSTÉTRICO',
    'ULTRASSOM OBSTETRICO'
  ];
  
  const result = obstetricTerms.some(term => serviceNameUpper.includes(term));
  
  console.log('🔍 [DEBUG] Resultado da validação:', result);
  console.log('🔍 [DEBUG] Termos verificados:', obstetricTerms);
  
  return result;
};

/**
 * Valida se a data está no formato DD/MM/AAAA e é uma data válida
 */
export const isValidDateFormat = (dateString: string): boolean => {
  if (!dateString || dateString.length !== 10) return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.getDate() === parseInt(day) &&
         date.getMonth() === parseInt(month) - 1 &&
         date.getFullYear() === parseInt(year);
};

/**
 * Converte data do formato DD/MM/AAAA para YYYY-MM-DD (formato do banco)
 */
export const convertDateToDBFormat = (dateString: string): string | null => {
  if (!isValidDateFormat(dateString)) return null;
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Formata input de data enquanto o usuário digita
 * @param value Valor atual do input
 * @returns Valor formatado com máscaras
 */
export const formatDateInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara DD/MM/AAAA
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

/**
 * Calcula a DUM (Data da Última Menstruação) a partir da IG (Idade Gestacional)
 * @param ig Idade gestacional no formato "XXs Xd" (ex: "20s 3d") ou apenas semanas (ex: "20")
 * @param referenceDate Data de referência para o cálculo (padrão: hoje)
 * @returns DUM no formato DD/MM/AAAA
 */
export const calculateDUMFromIG = (ig: string, referenceDate?: Date): string | null => {
  if (!ig || typeof ig !== 'string') {
    return null;
  }

  try {
    const refDate = referenceDate || new Date();
    let totalDays = 0;

    // Limpar e normalizar a string
    const cleanIG = ig.trim().toLowerCase();

    // Padrão 1: "XXs Xd" (ex: "20s 3d")
    const weeksDaysMatch = cleanIG.match(/(\d+)s?\s*(\d+)?d?/);
    if (weeksDaysMatch) {
      const weeks = parseInt(weeksDaysMatch[1]) || 0;
      const days = parseInt(weeksDaysMatch[2]) || 0;
      totalDays = (weeks * 7) + days;
    }
    // Padrão 2: apenas número (ex: "20" = 20 semanas)
    else if (/^\d+$/.test(cleanIG)) {
      const weeks = parseInt(cleanIG);
      totalDays = weeks * 7;
    }
    // Padrão 3: "XX semanas" ou "XX sem"
    else if (cleanIG.includes('sem')) {
      const weeksMatch = cleanIG.match(/(\d+)/);
      if (weeksMatch) {
        const weeks = parseInt(weeksMatch[1]);
        totalDays = weeks * 7;
      }
    }
    else {
      return null;
    }

    // Validar se a IG é razoável (0-42 semanas)
    const weeks = totalDays / 7;
    if (weeks < 0 || weeks > 42) {
      return null;
    }

    // Calcular DUM subtraindo os dias da data de referência
    const dumDate = new Date(refDate);
    dumDate.setDate(dumDate.getDate() - totalDays);

    // Formatar para DD/MM/AAAA
    const day = dumDate.getDate().toString().padStart(2, '0');
    const month = (dumDate.getMonth() + 1).toString().padStart(2, '0');
    const year = dumDate.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao calcular DUM a partir da IG:', error);
    return null;
  }
};

/**
 * Converte uma data em linguagem natural (ex: "11 de maio de 2026") para DD/MM/AAAA
 */
export const parseNaturalDate = (text: string): string => {
  if (!text) return "";
  
  // Normalizar: remover pontos extras, vírgulas e espaços excessivos
  let cleanText = text.toLowerCase().trim()
    .replace(/\.{2,}/g, '') // Remove reticências (...)
    .replace(/[.,]$/g, '')  // Remove ponto ou vírgula final
    .replace(/,/g, ' ')      // Substitui vírgulas por espaços
    .replace(/\./g, '/');    // Substitui pontos por barras (ex: 8.05.2026 -> 8/05/2026)
  
  // Se após a troca de pontos por barras já estiver no formato correto, retorna
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cleanText)) {
    const parts = cleanText.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) y = "20" + y;
    return `${d}/${m}/${y}`;
  }

  const months: Record<string, string> = {
    janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04", maio: "05", junho: "06",
    julho: "07", agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12"
  };

  // Padrão: 11 de maio de 2026 ou 11 maio 26 ou 8 5 2026 (com espaços)
  const match = cleanText.match(/(\d{1,2})\s+(?:de\s+|\/\s*)?([a-zçã]+|\d{1,2})\s+(?:de\s+|\/\s*)?(\d{2,4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthPart = match[2];
    let year = match[3];
    if (year.length === 2) year = "20" + year;
    
    // Tentar converter nome do mês
    let month = months[monthPart];
    
    // Se não for nome, verificar se é número
    if (!month && /^\d{1,2}$/.test(monthPart)) {
      month = monthPart.padStart(2, '0');
    }
    
    if (month) {
      return `${day}/${month}/${year}`;
    }
  }

  // Padrão: apenas números contínuos (ex: 11052026 ou 110526)
  const numbers = cleanText.replace(/\D/g, '');
  if (numbers.length === 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  } else if (numbers.length === 6) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/20${numbers.slice(4, 6)}`;
  }

  return text;
};