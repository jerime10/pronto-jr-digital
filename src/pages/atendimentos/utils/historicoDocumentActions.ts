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
    console.log('Tentando compartilhar via WhatsApp:', doc);
    
    let phone = doc.patient?.phone;
    
    // Se não tem telefone, tentar extrair do nome do arquivo
    if (!phone || phone.trim() === '') {
      const decodedFilename = decodeURIComponent(doc.filename);
      const phoneMatch = decodedFilename.match(/^.+?-(\d{10,11})-[a-f0-9\-]+.*\.pdf$/i);
      if (phoneMatch) {
        phone = phoneMatch[1];
      }
    }

    // Mensagem ultra-simplificada para evitar HTTP 429
    const shortMessage = `Olá! Seu prontuário: ${doc.file_url}`;
    
    if (!phone || phone.trim() === '') {
      await navigator.clipboard.writeText(shortMessage);
      toast.success('📋 Mensagem copiada para área de transferência');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    // Formato: 55 + DDD + número
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // Criar link direto (mais confiável que window.open)
    const link = document.createElement('a');
    link.href = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(shortMessage)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Copiar mensagem como backup
    try {
      await navigator.clipboard.writeText(shortMessage);
    } catch (e) {
      console.log('Não foi possível copiar:', e);
    }
    
    // Clicar no link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`✅ WhatsApp aberto!`, {
      duration: 3000,
      description: 'Mensagem copiada como backup'
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
    try {
      const fallbackMessage = `Seu prontuário: ${doc.file_url}`;
      await navigator.clipboard.writeText(fallbackMessage);
      toast.info('📋 Mensagem copiada! Cole no WhatsApp', {
        duration: 5000
      });
    } catch (clipboardError) {
      toast.error('Erro ao compartilhar. Tente novamente.', {
        duration: 5000
      });
    }
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