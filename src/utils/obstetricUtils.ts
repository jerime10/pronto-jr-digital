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
 * @returns true se contém "OBSTÉTRICA" (case insensitive)
 */
export const isObstetricService = (serviceName: string): boolean => {
  if (!serviceName || typeof serviceName !== 'string') {
    return false;
  }
  return serviceName.toUpperCase().includes('OBSTÉTRICA');
};

/**
 * Valida formato de data DD/MM/AAAA
 * @param date String da data
 * @returns true se o formato está correto
 */
export const isValidDateFormat = (date: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(date)) {
    return false;
  }

  const [day, month, year] = date.split('/').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  return dateObj.getDate() === day && 
         dateObj.getMonth() === month - 1 && 
         dateObj.getFullYear() === year;
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