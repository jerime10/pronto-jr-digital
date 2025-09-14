
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StorageBucketDocument } from '../hooks/useStorageBucketDocuments';

interface StorageBucketDocumentTableViewProps {
  documents: StorageBucketDocument[];
  onRefresh?: () => void;
}

export const StorageBucketDocumentTableView: React.FC<StorageBucketDocumentTableViewProps> = ({ 
  documents, 
  onRefresh 
}) => {
  const handleView = (document: StorageBucketDocument) => {
    console.log('Opening PDF URL:', document.file_url);
    window.open(document.file_url, '_blank');
    toast.success('Documento aberto em nova aba');
  };

  const handleDownload = async (document: StorageBucketDocument) => {
    try {
      console.log('Downloading PDF from:', document.file_url);
      
      const response = await fetch(document.file_url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(link);
      }, 100);
      
      toast.success('Download concluído!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleWhatsApp = (document: StorageBucketDocument) => {
    const phone = document.patient?.phone || document.metadata.patientPhone;
    
    if (!phone || phone.trim() === '') {
      toast.error('Telefone do paciente não disponível');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const patientName = document.patient?.name || document.metadata.patientName;
    const message = `Olá ${patientName}! Segue o documento: ${document.file_url}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com o documento');
  };

  const handleDelete = async (document: StorageBucketDocument) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([`prontuarios/${document.name}`]);

      if (error) {
        throw error;
      }

      toast.success('Documento excluído com sucesso!');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erro ao excluir documento');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>SUS</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            const patientName = document.patient?.name || document.metadata.patientName || "Não identificado";
            const patientSus = document.patient?.sus || "N/A";
            const patientPhone = document.patient?.phone || document.metadata.patientPhone || 'N/A';
            const hasPhone = patientPhone?.trim() !== '' && patientPhone !== 'N/A';

            return (
              <TableRow key={document.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="max-w-[200px] truncate" title={patientName}>
                    {patientName}
                  </div>
                </TableCell>
                <TableCell>{patientSus}</TableCell>
                <TableCell>{patientPhone}</TableCell>
                <TableCell>{formatDate(document.created_at)}</TableCell>
                <TableCell>{formatFileSize(document.size)}</TableCell>
                <TableCell>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                    {document.metadata.documentType === 'prontuario' ? 'Prontuário' : document.metadata.documentType}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      onClick={() => handleView(document)}
                      variant="ghost" 
                      size="sm"
                      title="Ver documento"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={() => handleDownload(document)}
                      variant="ghost" 
                      size="sm"
                      title="Baixar documento"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button 
                      onClick={() => handleWhatsApp(document)}
                      variant="ghost" 
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      disabled={!hasPhone}
                      title={!hasPhone ? "Telefone não disponível" : "Enviar via WhatsApp"}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={() => handleDelete(document)}
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      title="Excluir documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
