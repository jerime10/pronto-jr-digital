
import { hexToHSL } from './colorUtils';

/**
 * UTILITÁRIO DE TEMAS - PERSONALIZAÇÃO VISUAL DO SISTEMA
 * 
 * Este arquivo controla como as configurações de tema são aplicadas ao documento.
 * Para personalizar cores, fontes e outros aspectos visuais, edite as funções abaixo.
 * 
 * COMO USAR:
 * - As cores são convertidas de HEX para HSL para melhor compatibilidade com CSS
 * - As variáveis CSS são aplicadas no :root para uso global
 * - Fontes são definidas como propriedades CSS customizadas
 */

/**
 * Aplica as configurações de tema ao documento HTML
 * @param themeSettings - Configurações de tema a serem aplicadas
 */
export const applyThemeToDocument = (themeSettings: {
  primaryColor?: string | null;     // Cor primária (botões, links, destaques)
  accentColor?: string | null;      // Cor de destaque (elementos secundários)
  fontFamily?: string | null;       // Família de fonte principal
  logoUrl?: string | null;          // URL do logo (não aplicado aqui)
}): void => {
  try {
    // APLICAÇÃO DA COR PRIMÁRIA
    // Converte cor primária de HEX para HSL e define variáveis CSS
    if (themeSettings.primaryColor) {
      const primaryHSL = hexToHSL(themeSettings.primaryColor);
      // Define as variáveis CSS para a cor primária
      document.documentElement.style.setProperty('--primary-h', `${primaryHSL.h}`);
      document.documentElement.style.setProperty('--primary-s', `${primaryHSL.s}%`);
      document.documentElement.style.setProperty('--primary-l', `${primaryHSL.l}%`);
    }

    // APLICAÇÃO DA COR DE DESTAQUE
    // Converte cor de destaque de HEX para HSL e define variáveis CSS
    if (themeSettings.accentColor) {
      const accentHSL = hexToHSL(themeSettings.accentColor);
      // Define as variáveis CSS para a cor de destaque
      document.documentElement.style.setProperty('--accent-h', `${accentHSL.h}`);
      document.documentElement.style.setProperty('--accent-s', `${accentHSL.s}%`);
      document.documentElement.style.setProperty('--accent-l', `${accentHSL.l}%`);
    }

    // APLICAÇÃO DA FAMÍLIA DE FONTE
    // Define a fonte principal do sistema
    if (themeSettings.fontFamily) {
      document.documentElement.style.setProperty('--font-family', themeSettings.fontFamily);
    }

    console.log('Tema aplicado com sucesso:', themeSettings);
  } catch (error) {
    console.error('Erro ao aplicar tema:', error);
    // Não lança erro para evitar quebra da aplicação
  }
};

/**
 * GUIA DE PERSONALIZAÇÃO MANUAL:
 * 
 * Para personalizar cores sem usar a interface:
 * 1. Edite o arquivo src/index.css na seção :root
 * 2. Modifique as variáveis --primary-h, --primary-s, --primary-l
 * 3. Use ferramentas online para converter HEX para HSL
 * 
 * Para adicionar novas variáveis de cor:
 * 1. Adicione a variável no :root do index.css
 * 2. Expanda esta função para aplicar a nova variável
 * 3. Use a variável nos componentes com var(--sua-variavel)
 * 
 * Para personalizar fontes:
 * 1. Adicione a fonte no index.html (Google Fonts)
 * 2. Configure no tailwind.config.ts
 * 3. Use classes Tailwind ou variável CSS --font-family
 */
