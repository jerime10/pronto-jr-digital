
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, MessageCircle, FileText, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StorageBucketDocument } from '../hooks/useStorageBucketDocuments';

interface StorageBucketDocumentListViewProps {
  documents: StorageBucketDocument[];
  onRefresh?: () => void;
}

export const StorageBucketDocumentListView: React.FC<StorageBucketDocumentListViewProps> = ({ 
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

  const formatBrasiliaDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  return (
    <div className="bg-white rounded-lg border">
      {documents.map((document, index) => {
        const patientName = document.patient?.name || document.metadata.patientName || "Paciente não identificado";
        const patientPhone = document.patient?.phone || document.metadata.patientPhone || 'Não informado';
        const hasPhone = patientPhone?.trim() !== '' && patientPhone !== 'Não informado';
        const hasAttendanceInfo = document.metadata.attendanceStartAt && document.metadata.attendanceEndAt;

        return (
          <div 
            key={document.id} 
            className={`flex items-center justify-between p-4 ${index !== documents.length - 1 ? 'border-b' : ''} hover:bg-gray-50 transition-colors`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{patientName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Telefone: {patientPhone}</span>
                  {hasAttendanceInfo ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatBrasiliaDateTime(document.metadata.attendanceStartAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duração: {calculateDuration(document.metadata.attendanceStartAt, document.metadata.attendanceEndAt)}
                      </span>
                    </div>
                  ) : (
                    <span>Dados do atendimento não disponíveis</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
                title={!hasPhone ? "Telefone do paciente não disponível" : "Enviar via WhatsApp"}
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
          </div>
        );
      })}
    </div>
  );
};
