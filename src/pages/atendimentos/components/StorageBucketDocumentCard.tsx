
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StorageBucketDocument } from '../hooks/useStorageBucketDocuments';
import { WhatsAppTemplateButton } from '@/components/ui/WhatsAppTemplateButton';

interface StorageBucketDocumentCardProps {
  document: StorageBucketDocument;
  onRefresh?: () => void;
}

export const StorageBucketDocumentCard: React.FC<StorageBucketDocumentCardProps> = ({ 
  document, 
  onRefresh 
}) => {
  const handleView = () => {
    console.log('Opening PDF URL:', document.file_url);
    window.open(document.file_url, '_blank');
    toast.success('Documento aberto em nova aba');
  };

  const handleDownload = async () => {
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

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      // Excluir do Storage com o caminho completo
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

  const formatBrasiliaDateTime = (dateString: string | undefined) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBrasiliaTime = (dateString: string | undefined) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return '--';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Tamanho desconhecido';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasPhone = (document.patient?.phone || document.metadata.patientPhone)?.trim() !== '';
  const patientName = document.patient?.name || document.metadata.patientName || "Paciente não identificado";
  const patientSus = document.patient?.sus || "Não informado";
  const patientPhone = document.patient?.phone || document.metadata.patientPhone || 'Não informado';

  const hasAttendanceInfo = document.metadata.attendanceStartAt && document.metadata.attendanceEndAt;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">{patientName}</span>
        </CardTitle>
        <div className="text-xs text-gray-500">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
            {document.metadata.documentType === 'prontuario' ? 'Prontuário' : document.metadata.documentType}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-grow">
        <div className="text-sm text-gray-600">
          <p><strong>Arquivo:</strong> {document.name}</p>
          <p><strong>SUS:</strong> {patientSus}</p>
          <p><strong>Telefone:</strong> {patientPhone}</p>
          <p><strong>Tamanho:</strong> {formatFileSize(document.size)}</p>
        </div>

        {/* Informações de horário do atendimento */}
        {hasAttendanceInfo && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Informações do Atendimento
            </h4>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">
                  <strong>Início:</strong> {formatBrasiliaDateTime(document.metadata.attendanceStartAt)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">
                  <strong>Fim:</strong> {formatBrasiliaDateTime(document.metadata.attendanceEndAt)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">
                  <strong>Duração:</strong> {calculateDuration(document.metadata.attendanceStartAt, document.metadata.attendanceEndAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 pb-4 flex flex-col gap-2">
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

        <div className="flex gap-2 w-full">
          <WhatsAppTemplateButton
            patientName={patientName}
            consultDate={hasAttendanceInfo ? formatBrasiliaDateTime(document.metadata.attendanceStartAt) : 'Data não disponível'}
            documentUrl={document.file_url}
            patientPhone={document.patient?.phone || document.metadata.patientPhone}
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
