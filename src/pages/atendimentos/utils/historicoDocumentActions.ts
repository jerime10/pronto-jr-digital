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
    
    // Se não tem telefone, tentar extrair do nome do arquivo (para arquivos do storage)
    if (!phone || phone.trim() === '') {
      console.log('Telefone não encontrado no registro, tentando extrair do filename:', doc.filename);
      
      // Tentar extrair telefone do nome do arquivo
      const decodedFilename = decodeURIComponent(doc.filename);
      console.log('Tentando extrair de:', decodedFilename);
      
      // Formato: "NOME-TELEFONE-ID.pdf"
      const phoneMatch = decodedFilename.match(/^.+?-(\d{10,11})-[a-f0-9\-]+.*\.pdf$/i);
      if (phoneMatch) {
        phone = phoneMatch[1];
        console.log('Telefone extraído do filename:', phone);
      }
    }
    
    if (!phone || phone.trim() === '') {
      // Criar URL com mensagem pré-formatada para copiar
      const message = `Olá ${doc.patient.name}! 

Segue seu prontuário médico:
${doc.file_url}

Consultório JRS
Cuidados Especializados em Enfermagem`;

      // Copiar para área de transferência
      try {
        await navigator.clipboard.writeText(message);
        toast.success(`Mensagem copiada! Cole no WhatsApp do paciente ${doc.patient.name}`, {
          duration: 5000
        });
      } catch (clipboardError) {
        // Fallback: abrir WhatsApp sem número
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success(`WhatsApp aberto. Cole o número do paciente ${doc.patient.name}`, {
          duration: 5000
        });
      }
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    console.log('Telefone limpo:', cleanPhone);
    
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido. Deve ter pelo menos 10 dígitos.');
      return;
    }

    // Garantir que o telefone tenha o formato correto (55 + DDD + número)
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = `55${formattedPhone}`;
    }

    const message = `Olá ${doc.patient.name}! 

Segue seu prontuário médico:
${doc.file_url}

Consultório JRS
Cuidados Especializados em Enfermagem`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('URL WhatsApp:', whatsappUrl);

    // Atualizar registro de compartilhamento se for um registro do banco
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
        console.log('Erro ao atualizar registro de compartilhamento (pode ser normal):', updateError);
      }
    }

    window.open(whatsappUrl, '_blank');
    toast.success(`Compartilhamento via WhatsApp iniciado para ${doc.patient.name}!`);
    
    if (refetch) {
      refetch();
    }
  } catch (error) {
    console.error('Erro ao compartilhar via WhatsApp:', error);
    toast.error('Erro ao compartilhar documento via WhatsApp');
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