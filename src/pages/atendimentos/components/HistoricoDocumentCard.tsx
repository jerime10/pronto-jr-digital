
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Download, Eye, FileText, Phone, User, AlertCircle, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { HistoricoDocument } from '../hooks/useHistoricoDocuments';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  downloadHistoricoDocument,
  viewHistoricoDocument,
  shareHistoricoDocumentViaWhatsApp,
  deleteHistoricoDocument
} from '../utils/historicoDocumentActions';

interface HistoricoDocumentCardProps {
  document: HistoricoDocument;
  onRefresh: () => void;
}

export const HistoricoDocumentCard: React.FC<HistoricoDocumentCardProps> = ({ 
  document, 
  onRefresh 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const calculateDuration = () => {
    if (!document.attendance_start_at || !document.attendance_end_at) return null;
    
    try {
      const start = new Date(document.attendance_start_at);
      const end = new Date(document.attendance_end_at);
      const minutes = differenceInMinutes(end, start);
      
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
      }
    } catch {
      return null;
    }
  };

  const handleDownload = () => downloadHistoricoDocument(document.file_url, document.filename);
  const handleView = () => viewHistoricoDocument(document, document.filename);
  // Extrai telefone do filename se não estiver no patient.phone
  const extractPhoneFromFilename = () => {
    if (document.patient.phone && document.patient.phone.trim() !== '') {
      return document.patient.phone;
    }
    
    // Tentar extrair do filename: "NOME-TELEFONE-ID.pdf"
    const decodedFilename = decodeURIComponent(document.filename);
    const phoneMatch = decodedFilename.match(/^.+?-(\d{10,11})-[a-f0-9\-]+.*\.pdf$/i);
    return phoneMatch ? phoneMatch[1] : null;
  };

  const extractedPhone = extractPhoneFromFilename();

  const handleWhatsApp = () => {
    console.log('WhatsApp button clicked for document:', {
      id: document.id,
      patientName: document.patient.name,
      phone: document.patient.phone,
      extractedPhone,
      filename: document.filename,
      status: document.status
    });
    shareHistoricoDocumentViaWhatsApp(document, onRefresh);
  };
  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteHistoricoDocument(document.id, onRefresh);
    }
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processando
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      case 'ready':
      default:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <FileText className="w-3 h-3 mr-1" />
            Pronto
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (document.status) {
      case 'processing':
        return 'Documento sendo processado. Aguarde alguns instantes...';
      case 'error':
        return 'Erro no processamento do documento. Tente reenviar.';
      case 'ready':
      default:
        return 'Documento pronto para visualização e download';
    }
  };

  const duration = calculateDuration();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Prontuário
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações do Paciente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{document.patient.name}</span>
          </div>
          
          {(document.patient.phone || extractedPhone) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{document.patient.phone || extractedPhone}</span>
            </div>
          )}
          
          {document.patient.sus && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">SUS:</span>
              <span>{document.patient.sus}</span>
            </div>
          )}
        </div>
        
        {/* Informações de Data e Duração */}
        <div className="space-y-2">
          {document.attendance_start_at && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Início: {formatDate(document.attendance_start_at)}</span>
            </div>
          )}
          
          {document.attendance_end_at && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Término: {formatDate(document.attendance_end_at)}</span>
            </div>
          )}

          {duration && (
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
              <Clock className="w-4 h-4" />
              <span>Duração: {duration}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Criado: {formatDate(document.created_at)}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {getStatusMessage()}
        </div>
        
        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={document.status !== 'ready'}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Visualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={document.status !== 'ready'}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            disabled={document.status !== 'ready'}
            className="flex-1"
            title={
              document.status !== 'ready' ? 'Documento ainda não está pronto' :
              !extractedPhone ? 'Telefone não cadastrado - clique para copiar mensagem' :
              undefined
            }
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {!extractedPhone ? 'Copiar Mensagem' : 'WhatsApp'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </div>

        {document.status === 'processing' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="w-full text-xs"
          >
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Atualizar Status
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
