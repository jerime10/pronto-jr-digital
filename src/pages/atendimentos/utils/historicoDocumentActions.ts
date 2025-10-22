import { toast } from 'sonner';

export interface HistoricoDocument {
  id: string;
  filename: string;
  file_url: string;
  patient: {
    name: string;
    phone?: string;
    sus?: string;
  };
  created_at: string;
}

export const downloadHistoricoDocument = (fileUrl: string, filename: string) => {
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    toast.error('Erro ao baixar documento');
  }
};

export const shareHistoricoDocumentViaWhatsApp = async (doc: HistoricoDocument, refetch?: () => void) => {
  try {
    console.log('Compartilhando via WhatsApp:', doc);
    
    let phone = doc.patient?.phone;
    
    // Tentar extrair telefone do nome do arquivo se necessário
    if (!phone || phone.trim() === '') {
      const decodedFilename = decodeURIComponent(doc.filename);
      const phoneMatch = decodedFilename.match(/^.+?-(\d{10,11})-[a-f0-9\-]+.*\.pdf$/i);
      if (phoneMatch) {
        phone = phoneMatch[1];
      }
    }

    const message = `Olá! Seu prontuário está disponível: ${doc.file_url}`;
    
    // Copiar para área de transferência
    await navigator.clipboard.writeText(message);
    
    if (!phone || phone.trim() === '') {
      toast.success('📋 Mensagem copiada!', {
        description: 'Cole no WhatsApp para compartilhar',
        duration: 4000
      });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      toast.success('📋 Mensagem copiada!', {
        description: 'Telefone inválido. Cole no WhatsApp manualmente',
        duration: 4000
      });
      return;
    }

    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    toast.success('📋 Mensagem copiada!', {
      description: 'Clique aqui para abrir o WhatsApp',
      duration: 5000,
      action: {
        label: 'Abrir WhatsApp',
        onClick: () => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      }
    });

    // Atualizar registro
    if (!doc.id.startsWith('storage-')) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase
          .from('generated_documents')
          .update({ 
            shared_at: new Date().toISOString(),
            shared_via: 'whatsapp'
          })
          .eq('medical_record_id', doc.id);
      } catch (updateError) {
        console.log('Erro ao atualizar registro:', updateError);
      }
    }
    
    if (refetch) {
      refetch();
    }
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
    toast.error('Erro ao copiar mensagem. Tente novamente.');
  }
};

export const viewHistoricoDocument = (doc: HistoricoDocument, filename?: string) => {
  try {
    const finalFilename = filename || doc.filename || 'documento.pdf';
    console.log('Visualizando documento:', finalFilename);
    console.log('URL do documento:', doc.file_url);
    
    // Usar window.open diretamente - mais simples e confiável
    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    
    toast.success('Documento aberto para visualização');
  } catch (error) {
    console.error('Erro ao visualizar documento:', error);
    toast.error('Erro ao visualizar documento');
  }
};

export const deleteHistoricoDocument = async (documentId: string, refetch?: () => void) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log('Deletando documento do histórico:', documentId);
    
    // Check if this is a storage-only document (starts with 'storage-')
    if (documentId.startsWith('storage-')) {
      // Extract filename from ID (format: storage-filename)
      const filename = documentId.replace('storage-', '');
      console.log('Deletando arquivo do storage:', filename);
      
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([`prontuarios/${filename}`]);
      
      if (storageError) {
        console.error('Erro ao excluir do storage:', storageError);
        throw new Error(`Erro ao excluir arquivo: ${storageError.message}`);
      }
      
      console.log('Arquivo excluído com sucesso do storage');
      toast.success('Documento excluído com sucesso!');
      
      if (refetch) {
        refetch();
      }
      return;
    }
    
    // First delete from generated_documents to avoid foreign key constraint violation
    console.log('Excluindo registros dependentes de generated_documents...');
    const { error: generatedDocsError } = await supabase
      .from('generated_documents')
      .delete()
      .eq('medical_record_id', documentId);
    
    if (generatedDocsError) {
      console.log('Erro ao excluir de generated_documents (pode ser normal se não existir):', generatedDocsError);
    }

    // Then delete from medical_records table
    const { error: medicalRecordError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', documentId);
    
    if (medicalRecordError) {
      console.error('Erro ao excluir medical_record:', medicalRecordError);
      throw new Error(`Erro ao excluir prontuário: ${medicalRecordError.message}`);
    }
    
    console.log('Prontuário excluído com sucesso da tabela medical_records');

    toast.success('Prontuário excluído com sucesso!');
    
    if (refetch) {
      refetch();
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    toast.error(`Erro ao excluir documento: ${errorMessage}`);
  }
};