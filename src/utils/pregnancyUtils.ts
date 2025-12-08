/**
 * Utilitários para cálculos relacionados à gravidez
 */

export interface PregnancyInfo {
  gestationalAge: string; // Formato: "29S6D"
  dpp: string; // Data Provável do Parto no formato DD/MM/YY
  weeksCompleted: number;
  daysRemaining: number;
  totalDays: number;
}

/**
 * Calcula a idade gestacional e DPP baseada na DUM (Data da Última Menstruação)
 * @param dum - Data da Última Menstruação no formato YYYY-MM-DD
 * @param referenceDate - Data de referência para o cálculo (padrão: hoje)
 * @returns Informações da gravidez calculadas
 */
export function calculatePregnancyInfo(dum: string, referenceDate?: Date): PregnancyInfo {
  const dumDate = new Date(dum);
  const refDate = referenceDate || new Date();
  
  // Calcular diferença em dias
  const timeDiff = refDate.getTime() - dumDate.getTime();
  const totalDays = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Calcular semanas e dias
  const weeksCompleted = Math.floor(totalDays / 7);
  const daysRemaining = totalDays % 7;
  
  // Formatar idade gestacional
  const gestationalAge = `${weeksCompleted}S${daysRemaining}D`;
  
  // Calcular DPP (280 dias após a DUM)
  const dppDate = new Date(dumDate);
  dppDate.setDate(dppDate.getDate() + 280);
  
  // Formatar DPP como DD/MM/AAAA
  const day = String(dppDate.getDate()).padStart(2, '0');
  const month = String(dppDate.getMonth() + 1).padStart(2, '0');
  const year = String(dppDate.getFullYear());
  const dpp = `${day}/${month}/${year}`;
  
  return {
    gestationalAge,
    dpp,
    weeksCompleted,
    daysRemaining,
    totalDays
  };
}

/**
 * Formata as informações da gravidez no formato solicitado: "IG: 29S6D . DPP: 27/11/25"
 * @param dum - Data da Última Menstruação no formato YYYY-MM-DD
 * @param referenceDate - Data de referência para o cálculo (padrão: hoje)
 * @returns String formatada com IG e DPP
 */
export function formatPregnancyDisplay(dum: string, referenceDate?: Date): string {
  const info = calculatePregnancyInfo(dum, referenceDate);
  return `IG: ${info.gestationalAge} . DPP: ${info.dpp}`;
}

/**
 * Verifica se uma DUM é válida (não pode ser no futuro e deve ser razoável para uma gravidez)
 * @param dum - Data da Última Menstruação no formato YYYY-MM-DD
 * @returns true se a DUM é válida
 */
export function isValidDum(dum: string): boolean {
  const dumDate = new Date(dum);
  const today = new Date();
  
  // Não pode ser no futuro
  if (dumDate > today) {
    return false;
  }
  
  // Não pode ser mais de 42 semanas (294 dias) atrás
  const timeDiff = today.getTime() - dumDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff > 294) {
    return false;
  }
  
  // Não pode ser menos de 4 semanas (28 dias) atrás
  if (daysDiff < 28) {
    return false;
  }
  
  return true;
}