// Utilitários para validação e formatação de telefone

/**
 * Valida e formata um número de telefone brasileiro
 * @param phone - Número de telefone a ser formatado
 * @returns Número formatado ou string vazia se inválido
 */
export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Se não há números, retorna string vazia
  if (numbersOnly.length === 0) {
    return '';
  }
  
  // Se tiver 10 dígitos, adiciona o 9
  if (numbersOnly.length === 10) {
    const ddd = numbersOnly.substring(0, 2);
    const firstDigit = numbersOnly.substring(2, 3);
    const restNumber = numbersOnly.substring(2);
    
    // Se o primeiro dígito após o DDD não for 9, adiciona o 9
    if (firstDigit !== '9') {
      const formattedNumber = ddd + '9' + restNumber;
      return formatToPhoneMask(formattedNumber);
    }
    return formatToPhoneMask(numbersOnly);
  }
  
  // Se tiver 11 dígitos, apenas formata
  if (numbersOnly.length === 11) {
    return formatToPhoneMask(numbersOnly);
  }
  
  // Retorna o número parcialmente formatado enquanto digita
  if (numbersOnly.length > 0 && numbersOnly.length <= 11) {
    return formatToPhoneMask(numbersOnly);
  }
  
  // Se tiver mais de 11 dígitos, trunca para 11
  if (numbersOnly.length > 11) {
    return formatToPhoneMask(numbersOnly.substring(0, 11));
  }
  
  return '';
}

/**
 * Aplica a máscara de telefone
 * @param numbers - Números sem formatação
 * @returns Número formatado com máscara
 */
function formatToPhoneMask(numbers: string): string {
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `(${numbers.substring(0, 2)})${numbers.substring(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.substring(0, 2)})${numbers.substring(2, 6)}-${numbers.substring(6)}`;
  } else {
    return `(${numbers.substring(0, 2)})${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
  }
}

/**
 * Valida se um número de telefone está no formato correto
 * @param phone - Número de telefone formatado
 * @returns true se o número for válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Deve ter 11 dígitos após formatação (com o 9 adicionado se necessário)
  if (numbersOnly.length !== 11) {
    return false;
  }
  
  // Verifica se o terceiro dígito é 9 (celular)
  const thirdDigit = numbersOnly.substring(2, 3);
  if (thirdDigit !== '9') {
    return false;
  }
  
  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(numbersOnly.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
}

/**
 * Remove a formatação do telefone, mantendo apenas os números
 * @param phone - Número de telefone formatado
 * @returns Números apenas
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}