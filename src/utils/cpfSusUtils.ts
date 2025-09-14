// Utilitários para validação e formatação de CPF e SUS

/**
 * Formata CPF ou SUS com suas respectivas máscaras
 * @param value - Valor a ser formatado
 * @returns Valor formatado ou string vazia se inválido
 */
export function formatCpfOrSus(value: string): string {
  // Remove todos os caracteres não numéricos
  const numbersOnly = value.replace(/\D/g, '');
  
  // CPF - 11 dígitos
  if (numbersOnly.length <= 11) {
    return formatCpf(numbersOnly);
  }
  
  // SUS - até 15 dígitos
  if (numbersOnly.length <= 15) {
    return formatSus(numbersOnly);
  }
  
  return numbersOnly.substring(0, 15); // Limita a 15 dígitos
}

/**
 * Formata CPF com máscara XXX.XXX.XXX-XX
 * @param numbers - Números do CPF
 * @returns CPF formatado
 */
function formatCpf(numbers: string): string {
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.substring(0, 3)}.${numbers.substring(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6)}`;
  } else {
    return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6, 9)}-${numbers.substring(9, 11)}`;
  }
}

/**
 * Formata SUS com máscara XXX XXXX XXXX XXXX
 * @param numbers - Números do SUS
 * @returns SUS formatado
 */
function formatSus(numbers: string): string {
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.substring(0, 3)} ${numbers.substring(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.substring(0, 3)} ${numbers.substring(3, 7)} ${numbers.substring(7)}`;
  } else {
    return `${numbers.substring(0, 3)} ${numbers.substring(3, 7)} ${numbers.substring(7, 11)} ${numbers.substring(11, 15)}`;
  }
}

/**
 * Valida se é um CPF ou SUS válido
 * @param value - Valor formatado ou não
 * @returns true se for válido
 */
export function isValidCpfOrSus(value: string): boolean {
  const numbersOnly = value.replace(/\D/g, '');
  
  // CPF deve ter 11 dígitos
  if (numbersOnly.length === 11) {
    return isValidCpf(numbersOnly);
  }
  
  // SUS deve ter 15 dígitos
  if (numbersOnly.length === 15) {
    return isValidSus(numbersOnly);
  }
  
  return false;
}

/**
 * Valida CPF
 * @param cpf - CPF apenas com números
 * @returns true se válido
 */
function isValidCpf(cpf: string): boolean {
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica primeiro dígito
  if (parseInt(cpf[9]) !== digit1) return false;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica segundo dígito
  return parseInt(cpf[10]) === digit2;
}

/**
 * Valida SUS (validação básica - 15 dígitos)
 * @param sus - SUS apenas com números
 * @returns true se válido
 */
function isValidSus(sus: string): boolean {
  // SUS deve ter exatamente 15 dígitos
  return sus.length === 15 && /^\d{15}$/.test(sus);
}

/**
 * Remove formatação do CPF/SUS
 * @param value - Valor formatado
 * @returns Apenas números
 */
export function cleanCpfOrSus(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Detecta se o valor é CPF ou SUS
 * @param value - Valor a ser analisado
 * @returns 'cpf', 'sus' ou 'unknown'
 */
export function detectCpfOrSus(value: string): 'cpf' | 'sus' | 'unknown' {
  const numbersOnly = value.replace(/\D/g, '');
  
  if (numbersOnly.length === 11) return 'cpf';
  if (numbersOnly.length === 15) return 'sus';
  
  return 'unknown';
}