/**
 * Utilitários para cálculos fetais usando a fórmula de Hadlock
 */

// Tabela de referência de peso fetal por idade gestacional (semanas)
// Valores baseados em curvas de crescimento fetal de Hadlock (percentis 10, 50 e 90)
// Faixa válida: 14 a 42 semanas
const FETAL_WEIGHT_REFERENCE: Record<number, { p10: number; p50: number; p90: number }> = {
  14: { p10: 25, p50: 43, p90: 70 },
  15: { p10: 35, p50: 55, p90: 85 },
  16: { p10: 48, p50: 75, p90: 110 },
  17: { p10: 65, p50: 100, p90: 145 },
  18: { p10: 85, p50: 130, p90: 185 },
  19: { p10: 110, p50: 170, p90: 240 },
  20: { p10: 140, p50: 215, p90: 300 },
  21: { p10: 175, p50: 270, p90: 375 },
  22: { p10: 215, p50: 330, p90: 460 },
  23: { p10: 260, p50: 400, p90: 555 },
  24: { p10: 310, p50: 475, p90: 660 },
  25: { p10: 365, p50: 560, p90: 775 },
  26: { p10: 425, p50: 650, p90: 900 },
  27: { p10: 490, p50: 750, p90: 1035 },
  28: { p10: 560, p50: 855, p90: 1180 },
  29: { p10: 635, p50: 970, p90: 1340 },
  30: { p10: 715, p50: 1090, p90: 1505 },
  31: { p10: 800, p50: 1220, p90: 1685 },
  32: { p10: 890, p50: 1360, p90: 1875 },
  33: { p10: 985, p50: 1505, p90: 2075 },
  34: { p10: 1085, p50: 1660, p90: 2290 },
  35: { p10: 1190, p50: 1820, p90: 2515 },
  36: { p10: 1300, p50: 1990, p90: 2750 },
  37: { p10: 1415, p50: 2170, p90: 2995 },
  38: { p10: 1535, p50: 2355, p90: 3250 },
  39: { p10: 1660, p50: 2550, p90: 3515 },
  40: { p10: 1790, p50: 2750, p90: 3790 },
  41: { p10: 1925, p50: 2960, p90: 4075 },
  42: { p10: 2065, p50: 3175, p90: 4370 }
};

/**
 * Extrai valor numérico de uma string, removendo unidades e convertendo se necessário
 * @param input - String contendo o valor (ex: "85mm", "8.5cm", "85")
 * @returns Valor numérico em mm ou null se inválido
 */
export function extractNumericValue(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  
  console.log('🔢 [EXTRACT] Entrada:', input);
  
  // Remover espaços
  const cleaned = input.trim().toLowerCase();
  console.log('🔢 [EXTRACT] Limpo:', cleaned);
  
  // Tentar extrair número com regex
  const match = cleaned.match(/(\d+[.,]?\d*)/);
  if (!match) {
    console.log('❌ [EXTRACT] Nenhum número encontrado');
    return null;
  }
  
  // Converter vírgula para ponto
  const numStr = match[1].replace(',', '.');
  console.log('🔢 [EXTRACT] String numérica:', numStr);
  let value = parseFloat(numStr);
  
  if (isNaN(value)) {
    console.log('❌ [EXTRACT] Não é um número válido');
    return null;
  }
  
  console.log('🔢 [EXTRACT] Valor extraído:', value);
  
  // Converter cm para mm se necessário
  if (cleaned.includes('cm')) {
    value = value * 10;
    console.log('🔢 [EXTRACT] Convertido de cm para mm:', value);
  }
  
  // Para valores com "g" (gramas), manter como está
  // Para valores sem unidade ou com "mm", manter como está
  
  console.log('✅ [EXTRACT] Valor final:', value);
  return value;
}

/**
 * Parseia string de idade gestacional e retorna em semanas
 * @param ig - String de IG (ex: "32s 4d", "32 semanas 4 dias", "32+4")
 * @returns Número de semanas ou null se inválido
 */
export function parseGestationalAge(ig: string): number | null {
  if (!ig || typeof ig !== 'string') return null;
  
  console.log('📅 [PARSE-IG] Entrada:', ig);
  
  const cleaned = ig.trim().toLowerCase();
  console.log('📅 [PARSE-IG] Limpo:', cleaned);
  
  // Padrão 1: "32s 4d" ou "32S4D" ou "32s0d" ou "32s"
  let match = cleaned.match(/(\d+)\s*s\s*(\d+)\s*d/i);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    const result = weeks + (days / 7);
    console.log('✅ [PARSE-IG] Padrão "XSXD" encontrado:', result);
    return result;
  }
  
  // Padrão 1.1: apenas semanas com "s" (ex: "32s")
  match = cleaned.match(/(\d+)\s*s/i);
  if (match) {
    const weeks = parseInt(match[1]);
    const result = weeks;
    console.log('✅ [PARSE-IG] Padrão "XS" encontrado:', result);
    return result;
  }
  
  // Padrão 2: "32 semanas 4 dias"
  match = cleaned.match(/(\d+)\s*semanas?\s*(\d+)\s*dias?/i);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    const result = weeks + (days / 7);
    console.log('✅ [PARSE-IG] Padrão "32 semanas 4 dias" encontrado:', result);
    return result;
  }
  
  // Padrão 3: "32+4" ou "32 + 4"
  match = cleaned.match(/(\d+)\s*\+\s*(\d+)/);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = parseInt(match[2]);
    const result = weeks + (days / 7);
    console.log('✅ [PARSE-IG] Padrão "32+4" encontrado:', result);
    return result;
  }
  
  // Padrão 4: apenas semanas "32"
  match = cleaned.match(/^(\d+)$/);
  if (match) {
    const result = parseInt(match[1]);
    console.log('✅ [PARSE-IG] Padrão numérico simples encontrado:', result);
    return result;
  }
  
  console.log('❌ [PARSE-IG] Nenhum padrão reconhecido');
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

// Aproximação da CDF da distribuição normal padrão (Abramowitz & Stegun)
function stdNormalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Calcula o percentil do peso fetal usando a fórmula de crescimento de Hadlock (1991)
 * @param weight - Peso fetal em gramas
 * @param gestationalAgeWeeks - Idade gestacional em semanas
 * @returns Percentil de 1 a 99
 */
export function calculatePercentile(weight: number, gestationalAgeWeeks: number): number {
  console.log('📊 [PERCENTIL-CALC] Entrada:', { weight, gestationalAgeWeeks });
  
  // Limites da idade gestacional
  if (gestationalAgeWeeks < 10 || gestationalAgeWeeks > 42) {
    console.warn('🚨 [PERCENTIL] Idade gestacional fora do range (10-42 semanas):', gestationalAgeWeeks);
    return 50; // Retornar percentil 50 como padrão
  }
  
  // Equação de crescimento de Hadlock 1991: ln(W) = 0.578 + 0.332(GA) - 0.00354(GA²)
  const ga = gestationalAgeWeeks;
  const lnExpectedW = 0.578 + 0.332 * ga - 0.00354 * ga * ga;
  const expectedWeight = Math.exp(lnExpectedW);
  
  // Desvio Padrão é de 12.7% do peso esperado
  const sd = 0.127 * expectedWeight;
  
  // Z-score
  const zScore = (weight - expectedWeight) / sd;
  
  // Converter Z-score em percentil usando distribuição normal padrão CDF
  const percentileFloat = stdNormalCDF(zScore) * 100;
  
  // Arredondar e garantir limites
  const percentile = Math.max(1, Math.min(99, Math.round(percentileFloat)));
  
  console.log('📊 [PERCENTIL-CALC] Hadlock 1991 -> Expected:', expectedWeight.toFixed(2), 'SD:', sd.toFixed(2), 'Z-score:', zScore.toFixed(2), 'Percentil:', percentile);
  
  return percentile;
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
 * Calcula automaticamente o percentil fetal a partir dos campos fornecidos
 * @param fields - Objeto com os campos do formulário (deve incluir PESO manual)
 * @returns Objeto com percentil calculado e alerta se IG fora da faixa válida
 */
export function calculateFetalPercentile(fields: Record<string, string>): {
  percentile: number;
  classification: 'PIG' | 'AIG' | 'GIG';
  formattedResult: string;
  warning?: string;
} | null {
  console.log('🧮 [PERCENTIL] ===== INÍCIO Cálculo de Percentil =====');
  console.log('🧮 [PERCENTIL] Campos recebidos:', fields);
  console.log('🧮 [PERCENTIL] Chaves dos campos:', Object.keys(fields));
  
  // Tentar encontrar o campo PESO por diferentes variações de nome
  const pesoKey = Object.keys(fields).find(k => k.toLowerCase() === 'peso');
  console.log('🔍 [PERCENTIL] Chave do PESO encontrada:', pesoKey);
  console.log('🔍 [PERCENTIL] Valor do PESO:', fields[pesoKey || 'peso']);
  
  // Extrair e validar PESO (manual)
  const pesoValue = extractNumericValue(fields[pesoKey || 'peso'] || '');
  console.log('🔍 [PERCENTIL] PESO extraído:', pesoValue);
  
  if (!pesoValue) {
    console.log('❌ [PERCENTIL] PESO não encontrado ou inválido:', pesoValue);
    return null;
  }
  
  if (!isValidMeasurement(pesoValue, 10, 6000)) {
    console.log('❌ [PERCENTIL] PESO fora do range (10-6000g):', pesoValue);
    return null;
  }
  console.log('✅ [PERCENTIL] PESO válido:', pesoValue, 'g');
  
  // Tentar encontrar o campo IG por diferentes variações de nome
  const igKey = Object.keys(fields).find(k => 
    k.toLowerCase() === 'ig' || 
    k.toLowerCase().includes('idadegestacional')
  );
  console.log('🔍 [PERCENTIL] Chave da IG encontrada:', igKey);
  console.log('🔍 [PERCENTIL] Valor da IG:', fields[igKey || 'ig']);
  
  // Extrair e validar IG
  const igValue = parseGestationalAge(fields[igKey || 'ig'] || fields.idadegestacional || '');
  console.log('🔍 [PERCENTIL] IG extraída:', igValue);
  
  if (!igValue) {
    console.log('❌ [PERCENTIL] IG não encontrada ou inválida:', igValue);
    return null;
  }
  console.log('✅ [PERCENTIL] IG válida:', igValue, 'semanas');
  
  // Verificar se IG está fora da faixa válida (14-42 semanas)
  let warning: string | undefined;
  if (igValue < 14 || igValue > 42) {
    warning = '⚠️ ATENÇÃO: Cálculo preciso apenas para IG entre 14 e 42 semanas';
    console.log('⚠️ [PERCENTIL] ' + warning);
  }
  
  // Calcular percentil usando o peso informado
  const percentile = calculatePercentile(pesoValue, igValue);
  console.log('📊 [PERCENTIL] Percentil:', percentile);
  
  // Classificar
  const classification = classifyPercentile(percentile);
  console.log('🏷️ [PERCENTIL] Classificação:', classification);
  
  // Formatar resultado
  const formattedResult = formatPercentileResult(percentile, classification);
  console.log('✅ [PERCENTIL] Resultado formatado:', formattedResult);
  
  console.log('🧮 [PERCENTIL] ===== FIM Cálculo de Percentil =====');
  
  return {
    percentile,
    classification,
    formattedResult,
    warning
  };
}
