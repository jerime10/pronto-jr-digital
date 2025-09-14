
/**
 * UTILITÁRIOS DE COR - CONVERSÃO E MANIPULAÇÃO
 * 
 * Este arquivo contém funções para conversão entre formatos de cor.
 * Usado principalmente para converter cores HEX em HSL para compatibilidade com CSS.
 * 
 * FORMATOS SUPORTADOS:
 * - HEX: #FF0000 (vermelho)
 * - HSL: { h: 0, s: 100, l: 50 } (vermelho)
 */

/**
 * Interface que define o formato HSL
 */
export interface HSLColor {
  h: number; // Matiz (Hue): 0-360 graus
  s: number; // Saturação (Saturation): 0-100%
  l: number; // Luminosidade (Lightness): 0-100%
}

/**
 * Converte uma cor em formato HEX para HSL
 * 
 * COMO USAR:
 * const cor = hexToHSL('#FF0000'); // Retorna { h: 0, s: 100, l: 50 }
 * 
 * @param hex - Cor em formato HEX (ex: '#FF0000' ou 'FF0000')
 * @returns Objeto HSL com propriedades h, s, l
 */
export const hexToHSL = (hex: string): HSLColor => {
  // Remove o # se presente
  const cleanHex = hex.replace('#', '');
  
  // CONVERSÃO HEX PARA RGB
  // Extrai componentes vermelho, verde e azul
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // CONVERSÃO RGB PARA HSL
  // Encontra valores máximo e mínimo para cálculo
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h: number;      // Matiz
  let s: number;      // Saturação
  const l = (max + min) / 2;  // Luminosidade

  if (max === min) {
    // Cor é cinza (sem saturação)
    h = s = 0;
  } else {
    const d = max - min;
    
    // Calcula saturação baseada na luminosidade
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    // Calcula matiz baseado no componente dominante
    switch (max) {
      case r: 
        h = (g - b) / d + (g < b ? 6 : 0); 
        break;
      case g: 
        h = (b - r) / d + 2; 
        break;
      case b: 
        h = (r - g) / d + 4; 
        break;
      default: 
        h = 0;
    }
    h /= 6;
  }

  // Retorna valores em formato padrão
  return {
    h: Math.round(h * 360),     // Matiz em graus (0-360)
    s: Math.round(s * 100),     // Saturação em porcentagem (0-100)
    l: Math.round(l * 100),     // Luminosidade em porcentagem (0-100)
  };
};

/**
 * DICAS DE USO:
 * 
 * Para usar cores HSL no CSS:
 * background-color: hsl(360, 100%, 50%);
 * 
 * Para usar com variáveis CSS:
 * background-color: hsl(var(--primary-h), var(--primary-s)%, var(--primary-l)%);
 * 
 * Para converter online:
 * - Use ferramentas como https://www.rapidtables.com/convert/color/hex-to-hsl.html
 * 
 * Vantagens do HSL sobre HEX:
 * - Mais fácil para criar variações (mudar só a luminosidade)
 * - Melhor para animações e transições
 * - Mais intuitivo para ajustes de cor
 */
