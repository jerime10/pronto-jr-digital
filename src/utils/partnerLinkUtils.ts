import { Usuario } from '@/types/database';

/**
 * Utilitários para geração e gerenciamento de links de parceiros
 */

// Configurações base para URLs
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const APPOINTMENT_PATH = '/agendamento';
const REGISTRATION_PATH = '/cadastro-paciente';

/**
 * Gera um link de agendamento exclusivo para um parceiro
 */
export const generatePartnerBookingLink = (partner: Usuario): string => {
  if (!partner.username || !partner.partner_code) {
    throw new Error('Parceiro deve ter username e partner_code válidos');
  }

  const params = new URLSearchParams({
    partner: partner.username,
    code: partner.partner_code
  });

  return `${BASE_URL}${APPOINTMENT_PATH}?${params.toString()}`;
};

/**
 * Gera um link de cadastro de paciente vinculado ao parceiro
 */
export const generatePartnerRegistrationLink = (partner: Usuario): string => {
  if (!partner.username || !partner.partner_code) {
    throw new Error('Parceiro deve ter username e partner_code válidos');
  }

  const params = new URLSearchParams({
    partner: partner.username,
    code: partner.partner_code,
    redirect: 'agendamento'
  });

  return `${BASE_URL}${REGISTRATION_PATH}?${params.toString()}`;
};

/**
 * Gera um link curto usando apenas o código do parceiro
 */
export const generateShortPartnerLink = (partnerCode: string): string => {
  if (!partnerCode) {
    throw new Error('Código do parceiro é obrigatório');
  }

  const params = new URLSearchParams({
    c: partnerCode
  });

  return `${BASE_URL}${APPOINTMENT_PATH}?${params.toString()}`;
};

/**
 * Extrai informações do parceiro de uma URL
 */
export const extractPartnerFromUrl = (url: string): { username?: string; code?: string } => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      username: params.get('partner') || params.get('p') || undefined,
      code: params.get('code') || params.get('c') || undefined
    };
  } catch (error) {
    console.error('Erro ao extrair informações do parceiro da URL:', error);
    return {};
  }
};

/**
 * Valida se uma URL contém parâmetros de parceiro válidos
 */
export const isValidPartnerUrl = (url: string): boolean => {
  const { username, code } = extractPartnerFromUrl(url);
  return !!(username || code);
};

/**
 * Gera um QR Code data URL para um link de parceiro
 */
export const generatePartnerQRCode = async (partnerLink: string): Promise<string> => {
  try {
    // Usando uma biblioteca de QR Code simples (seria necessário instalar)
    // Por enquanto, retornamos um placeholder
    const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(partnerLink)}`;
    return qrData;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Falha ao gerar QR Code');
  }
};

/**
 * Copia um link para a área de transferência
 */
export const copyLinkToClipboard = async (link: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link);
      return true;
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Erro ao copiar link:', error);
    return false;
  }
};

/**
 * Formata um link para exibição (encurta se muito longo)
 */
export const formatLinkForDisplay = (link: string, maxLength: number = 50): string => {
  if (link.length <= maxLength) {
    return link;
  }
  
  const start = link.substring(0, maxLength / 2);
  const end = link.substring(link.length - maxLength / 2);
  return `${start}...${end}`;
};

/**
 * Gera estatísticas de uso de um link de parceiro
 */
export interface PartnerLinkStats {
  totalClicks: number;
  totalAppointments: number;
  conversionRate: number;
  lastUsed?: Date;
}

/**
 * Calcula estatísticas de uso de um parceiro (placeholder - seria implementado com dados reais)
 */
export const calculatePartnerStats = async (partnerCode: string): Promise<PartnerLinkStats> => {
  // Esta função seria implementada com consultas reais ao banco de dados
  // Por enquanto, retornamos dados mockados
  return {
    totalClicks: 0,
    totalAppointments: 0,
    conversionRate: 0,
    lastUsed: undefined
  };
};

/**
 * Valida se um código de parceiro é válido
 */
export const isValidPartnerCode = (code: string): boolean => {
  // Código deve ter entre 6 e 12 caracteres alfanuméricos
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  return codeRegex.test(code);
};

/**
 * Gera um código de parceiro único
 */
export const generateUniquePartnerCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};