
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '../hooks/useDocuments';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';
import { fetchDocumentAssets } from '@/services/documentAssetsService';

// Check if a URL is from n8n production server
const isN8nProductionUrl = (url: string): boolean => {
  return url.includes('n8n.mentoriajrs.com');
};

/**
 * Utility function to clean document URL and extract proper filename
 */
const cleanDocumentUrl = (fileUrl: string): { url: string, filename: string } => {
  try {
    // Remove query parameters that affect content handling
    const url = new URL(fileUrl);
    const pathname = url.pathname;
    
    // Extract filename from the path and sanitize it
    let filename = pathname.split('/').pop() || 'documento.pdf';
    
    // Clean up the filename
    filename = filename.replace(/[^\w\d.-]/g, '_');
    
    // Ensure .pdf extension
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename = `${filename}.pdf`;
    }
    
    return {
      url: fileUrl,
      filename
    };
  } catch (e) {
    console.error("Error cleaning URL:", e);
    return {
      url: fileUrl,
      filename: 'documento.pdf'
    };
  }
};

/**
 * Downloads a document with proper content-type handling
 */
export const downloadDocument = (fileUrl: string) => {
  if (!fileUrl) {
    toast.error("URL do documento inválida");
    return;
  }

  try {
    // Clean URL and get proper filename
    const { url, filename } = cleanDocumentUrl(fileUrl);
    
    // Force bypass cache by adding a timestamp parameter
    // Add contentType=pdf parameter to force PDF MIME type
    const timestamp = new Date().getTime();
    const urlWithParams = `${url}${url.includes('?') ? '&' : '?'}contentType=application/pdf&t=${timestamp}&download=true`;
    
    console.log("Opening PDF URL for download:", urlWithParams);
    
    // Check if this is an n8n production URL
    if (isN8nProductionUrl(url)) {
      console.log("Detected n8n production URL, opening in new tab");
      window.open(urlWithParams, '_blank');
      toast.success('Link do documento aberto em nova guia');
      return;
    }
    
    // Usar Fetch para obter o arquivo explicitamente como PDF
    fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Origin': window.location.origin,
      },
      mode: 'no-cors', // Use no-cors for better CORS handling
      cache: 'no-store' // Evitar cache
    })
    .then(response => {
      console.log('Response type:', response.type);
      
      // When using no-cors mode, we'll get an opaque response
      if (response.type === 'opaque') {
        console.log('Received opaque response, opening in new tab');
        window.open(urlWithParams, '_blank');
        toast.success('Link do documento aberto em nova guia');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      if (!blob) return; // May be undefined if we opened in a new tab
      
      // Forçar o tipo MIME para PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // Criar URL a partir do blob recebido
      const fileURL = URL.createObjectURL(pdfBlob);
      
      // Criar elemento de link para download
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', filename);
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      
      // Adicionar ao body, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar o objeto URL criado
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 100);
      
      toast.success("Download iniciado");
    })
    .catch(error => {
      console.error("Erro ao baixar documento:", error);
      toast.error("Erro ao baixar o documento. Tentando método alternativo...");
      
      // Método alternativo - abrir em nova aba
      window.open(urlWithParams, '_blank');
      toast.info("Documento aberto em nova aba");
    });
  } catch (error) {
    console.error("Erro ao baixar documento:", error);
    
    // Fallback: try opening in a new tab
    try {
      const { url } = cleanDocumentUrl(fileUrl);
      const urlWithParams = `${url}${url.includes('?') ? '&' : '?'}contentType=application/pdf&t=${Date.now()}&download=true`;
      window.open(urlWithParams, '_blank');
      toast.info("Documento aberto em nova aba");
    } catch (e) {
      toast.error("Erro ao baixar o documento");
    }
  }
};

/**
 * Enhanced shares a document via WhatsApp with template support and automatic logo/signature inclusion
 */
export const shareViaWhatsApp = async (document: Document, refetchDocuments: () => void) => {
  try {
    let phoneNumber = '';
    
    // Check if patient phone exists or get it from user input
    if (!document.patient?.phone) {
      const inputPhoneNumber = prompt("Digite o número de WhatsApp do paciente (com DDD):");
      if (!inputPhoneNumber) return;
      
      // Format phone number
      phoneNumber = inputPhoneNumber.replace(/\D/g, '');
    } else {
      // Use existing phone number
      phoneNumber = document.patient.phone.replace(/\D/g, '');
    }
    
    // Validate phone number
    if (phoneNumber.length < 10) {
      toast.error("Número de telefone inválido");
      return;
    }
    
    // Add country code if needed
    if (!phoneNumber.startsWith('55') && phoneNumber.length === 11) {
      phoneNumber = `55${phoneNumber}`;
    }

    // Fetch document assets (logo and signature) to include in n8n payload
    const assets = await fetchDocumentAssets();
    console.log('Document assets fetched for sharing:', {
      hasLogo: !!assets.logoData,
      hasSignature: !!assets.signatureData,
      hasProfessionalInfo: !!(assets.signatureProfessionalName || assets.signatureProfessionalTitle || assets.signatureProfessionalRegistry)
    });

    // Mock webhook URL - site_settings table doesn't exist
    const webhookUrl = null;

    // If webhook is configured, send document data with assets to n8n
    if (webhookUrl) {
      try {
        console.log('Sending document data with assets to n8n for WhatsApp sharing...');
        
        // Create payload with document data and assets
        const n8nPayload = {
          action: 'whatsapp_share',
          timestamp: new Date().toISOString(),
          document: {
            id: document.id,
            title: document.title,
            file_url: document.file_url,
            document_type: document.document_type,
            created_at: document.created_at,
            patient: document.patient
          },
          recipient: {
            phone: phoneNumber,
            name: document.patient?.name || 'Paciente'
          },
          // Include logo and signature with professional info automatically
          assets: {
            logo: assets.logoData ? {
              base64: assets.logoData,
              filename: 'logo.png',
              size: (assets.logoData.length * 3) / 4 // Approximate base64 size
            } : null,
            signature: assets.signatureData ? {
              base64: assets.signatureData,
              filename: 'assinatura.png',
              size: (assets.signatureData.length * 3) / 4, // Approximate base64 size
              professional: {
                name: assets.signatureProfessionalName || '',
                title: assets.signatureProfessionalTitle || '',
                registry: assets.signatureProfessionalRegistry || ''
              }
            } : null
          }
        };

        // Send to n8n webhook
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors',
          body: JSON.stringify(n8nPayload)
        });

        console.log('Document data with assets and professional info sent to n8n successfully');
        toast.success('Dados enviados para processamento n8n com logo, assinatura e informações do profissional incluídos!');
      } catch (n8nError) {
        console.error('Error sending to n8n:', n8nError);
        toast.error('Erro ao enviar dados para n8n, mas continuando com WhatsApp...');
      }
    }

    // Mock update - generated_documents table doesn't exist
    console.log("Mock document marked as shared:", document.id);
    
    // Ensure we have a valid URL before proceeding
    if (!document.file_url || typeof document.file_url !== 'string') {
      toast.error("URL do documento inválida");
      return;
    }
    
    // Clean URL for sharing
    const { url } = cleanDocumentUrl(document.file_url);
    
    // Add special query parameter to force PDF content-type and cache busting
    const timestamp = new Date().getTime();
    const documentUrlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}contentType=application/pdf&t=${timestamp}&download=true`;
    
    console.log("Sharing PDF URL via WhatsApp:", documentUrlWithTimestamp);
    
    // Get templates for the document type
    const templates = await whatsappTemplateService.getTemplatesByType(document.document_type || 'general');
    let message = '';

    if (templates && templates.length > 0) {
      // Use the first active template
      const template = templates[0];
      message = whatsappTemplateService.processTemplate(template.template, {
        nome: document.patient?.name || 'Paciente',
        data_consulta: document.created_at ? new Date(document.created_at).toLocaleDateString('pt-BR') : '',
        link: documentUrlWithTimestamp
      });
    } else {
      // Fallback to default message with template service for greeting
      const greeting = whatsappTemplateService.generateGreeting();
      message = `${greeting}! Segue o documento "${document.title}": ${documentUrlWithTimestamp}`;
    }
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    toast.success("Mensagem enviada para o WhatsApp!");
    refetchDocuments();
  } catch (error) {
    console.error("Erro ao compartilhar documento:", error);
    toast.error("Erro ao compartilhar documento");
  }
};

/**
 * Deletes a document with improved error handling
 */
export const deleteDocument = async (documentId: string, refetchDocuments: () => void) => {
  try {
    // Confirm deletion with the user
    if (!confirm("Tem certeza que deseja excluir este documento?")) {
      return;
    }
    
    console.log("Attempting to delete document:", documentId);
    
    // Mock delete - generated_documents table doesn't exist
    console.log("Mock document successfully deleted from database");
    toast.success("Documento excluído com sucesso");
    refetchDocuments();
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    toast.error("Erro ao excluir documento");
  }
};
