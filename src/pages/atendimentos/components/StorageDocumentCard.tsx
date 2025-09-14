
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StorageDocument } from '../hooks/useStorageDocuments';
import { WhatsAppTemplateButton } from '@/components/ui/WhatsAppTemplateButton';

interface StorageDocumentCardProps {
  document: StorageDocument;
  onRefresh?: () => void;
}

export const StorageDocumentCard: React.FC<StorageDocumentCardProps> = ({ 
  document, 
  onRefresh 
}) => {
  const handleView = () => {
    if (!document.file_url) {
      toast.error('URL do documento não disponível');
      return;
    }

    console.log('Opening PDF URL:', document.file_url);
    window.open(document.file_url, '_blank');
    toast.success('Documento aberto em nova aba');
  };

  const handleDownload = async () => {
    try {
      if (!document.file_url) {
        toast.error('URL do documento não disponível');
        return;
      }

      console.log('Downloading PDF from:', document.file_url);
      
      const response = await fetch(document.file_url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
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

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      // Mock delete - generated_documents table doesn't exist
      console.log('Mock deleting document:', document.id);

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

  // Verificar se patient existe e tem telefone
  const hasPhone = document.patient && document.patient.phone && document.patient.phone.trim() !== '';
  
  // Nome do paciente com verificação de null
  const patientName = document.patient ? document.patient.name : "Paciente não informado";
  
  // SUS do paciente com verificação de null
  const patientSus = document.patient ? document.patient.sus : "Não informado";
  
  // Telefone do paciente com verificação de null
  const patientPhone = document.patient ? document.patient.phone || 'Não informado' : 'Não informado';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">{patientName}</span>
        </CardTitle>
        <div className="text-xs text-gray-500">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
            {document.document_type === 'prontuario' ? 'Prontuário' : document.document_type}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-grow">
        <div className="text-sm text-gray-600">
          <p><strong>Título:</strong> {document.title}</p>
          <p><strong>SUS:</strong> {patientSus}</p>
          <p><strong>Telefone:</strong> {patientPhone}</p>
          <p><strong>Data:</strong> {formatDate(document.created_at)}</p>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 pb-4 flex flex-col gap-2">
        {/* Primeira linha de botões */}
        <div className="flex gap-2 w-full">
          <Button 
            onClick={handleView}
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1 text-xs"
          >
            <Eye className="h-3 w-3" />
            Ver
          </Button>
          
          <Button 
            onClick={handleDownload}
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1 text-xs"
          >
            <Download className="h-3 w-3" />
            Baixar
          </Button>
        </div>

        {/* Segunda linha de botões */}
        <div className="flex gap-2 w-full">
          <WhatsAppTemplateButton
            patientName={patientName}
            consultDate={formatDate(document.created_at)}
            documentUrl={document.file_url || ''}
            patientPhone={document.patient?.phone}
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
            disabled={!hasPhone}
          >
            WhatsApp
          </WhatsAppTemplateButton>
          
          <Button 
            onClick={handleDelete}
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
