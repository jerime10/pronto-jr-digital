/**
 * Utilitários para cálculos fetais usando a fórmula de Hadlock
 */

// Tabela de referência de peso fetal por idade gestacional (semanas)
// Valores baseados em curvas de crescimento fetal de Hadlock (percentis 10, 50 e 90)
// Ajustados para refletir valores clínicos mais precisos
const FETAL_WEIGHT_REFERENCE: Record<number, { p10: number; p50: number; p90: number }> = {
  20: { p10: 250, p50: 300, p90: 370 },
  21: { p10: 290, p50: 360, p90: 440 },
  22: { p10: 340, p50: 430, p90: 520 },
  23: { p10: 395, p50: 500, p90: 615 },
  24: { p10: 455, p50: 580, p90: 710 },
  25: { p10: 520, p50: 660, p90: 815 },
  26: { p10: 590, p50: 750, p90: 925 },
  27: { p10: 670, p50: 850, p90: 1050 },
  28: { p10: 755, p50: 960, p90: 1185 },
  29: { p10: 850, p50: 1080, p90: 1330 },
  30: { p10: 950, p50: 1210, p90: 1490 },
  31: { p10: 1060, p50: 1350, p90: 1660 },
  32: { p10: 1180, p50: 1500, p90: 1845 },
  33: { p10: 1310, p50: 1660, p90: 2045 },
  34: { p10: 1450, p50: 1840, p90: 2260 },
  35: { p10: 1600, p50: 2030, p90: 2495 },
  36: { p10: 1760, p50: 2235, p90: 2745 },
  37: { p10: 1930, p50: 2450, p90: 3010 },
  38: { p10: 2110, p50: 2675, p90: 3285 },
  39: { p10: 2300, p50: 2915, p90: 3580 },
  40: { p10: 2500, p50: 3165, p90: 3885 },
  41: { p10: 2710, p50: 3430, p90: 4205 },
  42: { p10: 2930, p50: 3705, p90: 4540 }
};

/**
 * Extrai valor numérico de uma string, removendo unidades e convertendo se necessário
 * @param input - String contendo o valor (ex: "85mm", "8.5cm", "85")
 * @returns Valor numérico em mm ou null se inválido
 */
export function extractNumericValue(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  
  // Remover espaços
  const cleaned = input.trim().toLowerCase();
  
  // Tentar extrair número com regex
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  if (!match) return null;
  
  // Converter vírgula para ponto
  const numStr = match[1].replace(',', '.');
  let value = parseFloat(numStr);
  
  if (isNaN(value)) return null;
  
  // Converter cm para mm se necessário
  if (cleaned.includes('cm')) {
    value = value * 10;
  }
  
  return value;
}

/**
 * Parseia string de idade gestacional e retorna em semanas
 * @param ig - String de IG (ex: "32s 4d", "32 semanas 4 dias", "32+4")
 * @returns Número de semanas ou null se inválido
 */
export function parseGestationalAge(ig: string): number | null {
  if (!ig || typeof ig !== 'string') return null;
  
  const cleaned = ig.trim().toLowerCase();
  
  // Padrão 1: "32s 4d" ou "32S4D"
  let match = cleaned.match(/(\d+)\s*s\s*(\d+)\s*d/i);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    return weeks + (days / 7);
  }
  
  // Padrão 2: "32 semanas 4 dias"
  match = cleaned.match(/(\d+)\s*semanas?\s*(\d+)\s*dias?/i);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    return weeks + (days / 7);
  }
  
  // Padrão 3: "32+4" ou "32 + 4"
  match = cleaned.match(/(\d+)\s*\+\s*(\d+)/);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    return weeks + (days / 7);
  }
  
  // Padrão 4: apenas semanas "32"
  match = cleaned.match(/^(\d+)$/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Calcula o peso fetal usando a fórmula de Hadlock com 4 parâmetros
 * Fórmula: Log10(weight) = 1.3596 - 0.00386*AC*FL + 0.0064*HC + 0.00061*BPD*AC + 0.0424*AC + 0.174*FL
 * IMPORTANTE: A fórmula requer valores em CENTÍMETROS
 * 
 * @param bpd - Diâmetro Biparietal em mm
 * @param hc - Circunferência Cefálica em mm
 * @param ac - Circunferência Abdominal em mm
 * @param fl - Comprimento do Fêmur em mm
 * @returns Peso estimado em gramas
 */
export function calculateFetalWeightHadlock4(
  bpd: number,
  hc: number,
  ac: number,
  fl: number
): number {
  // Converter mm para cm (a fórmula requer cm)
  const bpdCm = bpd / 10;
  const hcCm = hc / 10;
  const acCm = ac / 10;
  const flCm = fl / 10;
  
  console.log('⚖️ [HADLOCK] Valores em cm:', { bpdCm, hcCm, acCm, flCm });
  
  // Fórmula de Hadlock 4 parâmetros
  const log10Weight = 
    1.3596 -
    (0.00386 * acCm * flCm) +
    (0.0064 * hcCm) +
    (0.00061 * bpdCm * acCm) +
    (0.0424 * acCm) +
    (0.174 * flCm);
  
  console.log('⚖️ [HADLOCK] Log10(weight):', log10Weight);
  
  // Converter log10 para peso em gramas
  const weight = Math.pow(10, log10Weight);
  
  console.log('⚖️ [HADLOCK] Peso calculado:', weight, 'g');
  
  return Math.round(weight);
}

/**
 * Calcula o percentil do peso fetal baseado na idade gestacional
 * @param weight - Peso fetal em gramas
 * @param gestationalAgeWeeks - Idade gestacional em semanas
 * @returns Percentil de 0 a 100
 */
export function calculatePercentile(weight: number, gestationalAgeWeeks: number): number {
  console.log('📊 [PERCENTIL-CALC] Entrada:', { weight, gestationalAgeWeeks });
  
  // Arredondar para a semana mais próxima
  const roundedWeeks = Math.round(gestationalAgeWeeks);
  console.log('📊 [PERCENTIL-CALC] Semanas arredondadas:', roundedWeeks);
  
  // Verificar se está dentro do range da tabela
  if (roundedWeeks < 20 || roundedWeeks > 42) {
    console.warn('🚨 [PERCENTIL] Idade gestacional fora do range da tabela:', roundedWeeks);
    return 50; // Retornar percentil 50 como padrão
  }
  
  const reference = FETAL_WEIGHT_REFERENCE[roundedWeeks];
  console.log('📊 [PERCENTIL-CALC] Referência encontrada:', reference);
  
  if (!reference) {
    console.warn('🚨 [PERCENTIL] Referência não encontrada para semana:', roundedWeeks);
    return 50;
  }
  
  // Calcular percentil usando interpolação linear entre os percentis de referência
  console.log('📊 [PERCENTIL-CALC] Comparando peso:', weight, 'com referências:', reference);
  
  if (weight <= reference.p10) {
    // Abaixo do P10
    const ratio = weight / reference.p10;
    const percentil = Math.max(1, Math.round(10 * ratio));
    console.log('📊 [PERCENTIL-CALC] Abaixo P10 - ratio:', ratio, 'percentil:', percentil);
    return percentil;
  } else if (weight >= reference.p90) {
    // Acima do P90
    const excess = weight - reference.p90;
    const range = reference.p90 - reference.p50;
    const ratio = excess / range;
    const percentil = Math.min(99, Math.round(90 + (10 * ratio)));
    console.log('📊 [PERCENTIL-CALC] Acima P90 - excess:', excess, 'range:', range, 'ratio:', ratio, 'percentil:', percentil);
    return percentil;
  } else if (weight < reference.p50) {
    // Entre P10 e P50
    const ratio = (weight - reference.p10) / (reference.p50 - reference.p10);
    const percentil = Math.round(10 + (40 * ratio));
    console.log('📊 [PERCENTIL-CALC] Entre P10-P50 - ratio:', ratio, 'percentil:', percentil);
    return percentil;
  } else {
    // Entre P50 e P90
    const ratio = (weight - reference.p50) / (reference.p90 - reference.p50);
    const percentil = Math.round(50 + (40 * ratio));
    console.log('📊 [PERCENTIL-CALC] Entre P50-P90 - ratio:', ratio, 'percentil:', percentil);
    return percentil;
  }
}

/**
 * Classifica o percentil fetal como PIG, AIG ou GIG
 * @param percentile - Percentil calculado
 * @returns Classificação do peso fetal
 */
export function classifyPercentile(percentile: number): 'PIG' | 'AIG' | 'GIG' {
  if (percentile < 10) {
    return 'PIG'; // Pequeno para Idade Gestacional
  } else if (percentile > 90) {
    return 'GIG'; // Grande para Idade Gestacional
  } else {
    return 'AIG'; // Adequado para Idade Gestacional
  }
}

/**
 * Formata o resultado do percentil no formato: "PERCENTIL (CLASSIFICAÇÃO)"
 * @param percentile - Percentil calculado
 * @param classification - Classificação (PIG, AIG ou GIG)
 * @returns String formatada
 */
export function formatPercentileResult(percentile: number, classification: string): string {
  return `${percentile} (${classification})`;
}

/**
 * Valida se um valor de medida está em um range realista
 * @param value - Valor da medida em mm
 * @param min - Valor mínimo aceitável
 * @param max - Valor máximo aceitável
 * @returns true se válido
 */
export function isValidMeasurement(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Calcula automaticamente o percentil e peso fetal a partir dos campos fornecidos
 * @param fields - Objeto com os campos do formulário
 * @returns Objeto com peso e percentil calculados ou null se dados incompletos
 */
export function calculateFetalPercentile(fields: Record<string, string>): {
  weight: number;
  percentile: number;
  classification: 'PIG' | 'AIG' | 'GIG';
  formattedResult: string;
} | null {
  console.log('🧮 [PERCENTIL] ===== INÍCIO Cálculo Automático =====');
  console.log('🧮 [PERCENTIL] Campos recebidos:', fields);
  
  // Extrair e validar BPD
  const bpdValue = extractNumericValue(fields.bpd || fields.diametrobiparietal || '');
  if (!bpdValue || !isValidMeasurement(bpdValue, 20, 100)) {
    console.log('❌ [PERCENTIL] BPD inválido ou fora do range:', bpdValue);
    return null;
  }
  console.log('✅ [PERCENTIL] BPD:', bpdValue, 'mm');
  
  // Extrair e validar HC
  const hcValue = extractNumericValue(fields.hc || fields.circunferenciacefálica || fields.circunferenciacefalica || fields.cc || '');
  if (!hcValue || !isValidMeasurement(hcValue, 100, 400)) {
    console.log('❌ [PERCENTIL] HC inválido ou fora do range:', hcValue);
    return null;
  }
  console.log('✅ [PERCENTIL] HC:', hcValue, 'mm');
  
  // Extrair e validar AC
  const acValue = extractNumericValue(fields.ac || fields.circunferenciaabdominal || fields.ca || '');
  if (!acValue || !isValidMeasurement(acValue, 100, 400)) {
    console.log('❌ [PERCENTIL] AC inválido ou fora do range:', acValue);
    return null;
  }
  console.log('✅ [PERCENTIL] AC:', acValue, 'mm');
  
  // Extrair e validar FL
  const flValue = extractNumericValue(fields.fl || fields.comprimentofemur || fields.cf || '');
  if (!flValue || !isValidMeasurement(flValue, 20, 90)) {
    console.log('❌ [PERCENTIL] FL inválido ou fora do range:', flValue);
    return null;
  }
  console.log('✅ [PERCENTIL] FL:', flValue, 'mm');
  
  // Extrair e validar IG
  const igValue = parseGestationalAge(fields.ig || fields.idadegestacional || '');
  if (!igValue || igValue < 20 || igValue > 42) {
    console.log('❌ [PERCENTIL] IG inválida ou fora do range:', igValue);
    return null;
  }
  console.log('✅ [PERCENTIL] IG:', igValue, 'semanas');
  
  // Calcular peso fetal usando Hadlock 4
  const weight = calculateFetalWeightHadlock4(bpdValue, hcValue, acValue, flValue);
  console.log('⚖️ [PERCENTIL] Peso calculado:', weight, 'g');
  
  // Calcular percentil
  const percentile = calculatePercentile(weight, igValue);
  console.log('📊 [PERCENTIL] Percentil:', percentile);
  
  // Classificar
  const classification = classifyPercentile(percentile);
  console.log('🏷️ [PERCENTIL] Classificação:', classification);
  
  // Formatar resultado
  const formattedResult = formatPercentileResult(percentile, classification);
  console.log('✅ [PERCENTIL] Resultado formatado:', formattedResult);
  
  console.log('🧮 [PERCENTIL] ===== FIM Cálculo Automático =====');
  
  return {
    weight,
    percentile,
    classification,
    formattedResult
  };
}
