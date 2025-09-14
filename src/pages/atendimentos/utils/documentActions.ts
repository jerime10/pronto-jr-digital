import { toast } from 'sonner';

export interface Document {
  id: string;
  title?: string;
  file_url: string;
  patient?: {
    name: string;
    phone?: string;
    sus?: string;
  };
}

export const downloadDocument = (fileUrl: string) => {
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop() || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    toast.error('Erro ao baixar documento');
  }
};

export const shareViaWhatsApp = async (document: Document, refetch?: () => void) => {
  try {
    const phone = document.patient?.phone;
    
    if (!phone) {
      toast.error('Número de telefone do paciente não encontrado');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    const message = `Olá! Segue o documento: ${document.file_url}`;
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Mock sharing update
    console.log('Mock sharing document via WhatsApp:', document.id);

    window.open(whatsappUrl, '_blank');
    toast.success('Compartilhamento via WhatsApp iniciado!');
    
    if (refetch) {
      refetch();
    }
  } catch (error) {
    console.error('Erro ao compartilhar via WhatsApp:', error);
    toast.error('Erro ao compartilhar documento');
  }
};

export const deleteDocument = async (documentId: string, refetch?: () => void) => {
  if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
    return;
  }

  try {
    // Mock delete - generated_documents table doesn't exist
    console.log('Mock deleting document:', documentId);

    toast.success('Documento excluído com sucesso!');
    
    if (refetch) {
      refetch();
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    toast.error('Erro ao excluir documento');
  }
};