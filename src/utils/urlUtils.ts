/**
 * Utilitários para manipulação de URLs e redirecionamentos dinâmicos
 */

/**
 * Ajusta uma URL para que seja "portável" entre ambientes (Local vs Produção).
 * Se a URL fornecida for para localhost mas o ambiente atual não for local,
 * ela será ajustada para usar a origem atual.
 */
export const getDynamicUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  try {
    const currentOrigin = window.location.origin;
    const isCurrentLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Se a URL for relativa, apenas anexa ao origin atual
    if (url.startsWith('/')) {
      return `${currentOrigin}${url}`;
    }
    
    const urlObj = new URL(url);
    const isUrlLocal = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    
    // Se a URL aponta para localhost mas não estamos em ambiente local
    if (isUrlLocal && !isCurrentLocal) {
      // Substituir a origem da URL pela origem atual (mantendo path e params)
      return `${currentOrigin}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    
    // Garantir HTTPS se não for localhost
    if (!isCurrentLocal && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  } catch (e) {
    // Se não for uma URL válida (ex: apenas um path), tenta tratar como relativo
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return url;
  }
};

/**
 * Garante que o origin use HTTPS se necessário
 */
export const getSecureOrigin = (): string => {
  const origin = window.location.origin;
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return origin.replace('http://', 'https://');
  }
  return origin;
};
