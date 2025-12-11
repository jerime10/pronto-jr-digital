
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Eye, FileText, Phone, User, AlertCircle, Loader2, Trash2, MessageCircle, Clock, Baby } from 'lucide-react';
import { HistoricoDocument } from '../hooks/useHistoricoDocuments';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  downloadHistoricoDocument,
  viewHistoricoDocument,
  shareHistoricoDocumentViaWhatsApp,
  deleteHistoricoDocument
} from '../utils/historicoDocumentActions';

interface HistoricoDocumentListViewProps {
  documents: HistoricoDocument[];
  onRefresh: () => void;
}

export const HistoricoDocumentListView: React.FC<HistoricoDocumentListViewProps> = ({
  documents,
  onRefresh
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const calculateDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return null;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
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


  const handleDownload = (document: HistoricoDocument) => downloadHistoricoDocument(document.file_url, document.filename);
  const handleView = (document: HistoricoDocument) => viewHistoricoDocument(document, document.filename);
  const handleWhatsApp = (document: HistoricoDocument) => shareHistoricoDocumentViaWhatsApp(document, onRefresh);
  const handleDelete = async (document: HistoricoDocument) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteHistoricoDocument(document.id, onRefresh);
    }
  };

  const getStatusBadge = (status: HistoricoDocument['status']) => {
    switch (status) {
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

  return (
    <div className="rounded-md border">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">Status</TableHead>
            <TableHead className="w-[130px]">Paciente</TableHead>
            <TableHead className="w-[120px]">Telefone</TableHead>
            <TableHead className="w-[130px]">SUS</TableHead>
            <TableHead className="w-[140px]">Início Atendimento</TableHead>
            <TableHead className="w-[140px]">Término Atendimento</TableHead>
            <TableHead className="w-[70px]">Duração</TableHead>
            <TableHead className="w-[130px]">Informações Obstétricas</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            const duration = calculateDuration(document.attendance_start_at, document.attendance_end_at);
            
            return (
              <TableRow key={document.id}>
                <TableCell>
                  {getStatusBadge(document.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{document.patient.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {document.patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{document.patient.phone}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{document.patient.sus}</span>
                </TableCell>
                <TableCell>
                  {document.attendance_start_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatDate(document.attendance_start_at)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {document.attendance_end_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatDate(document.attendance_end_at)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {duration && (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{duration}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {document.obstetricInfo && (document.obstetricInfo.ig || document.obstetricInfo.dpp) ? (
                    <div className="inline-flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-pink-50 border border-pink-200">
                      {document.obstetricInfo.ig && (
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4 text-pink-500" />
                          <span className="text-xs text-muted-foreground">IG:</span>
                          <span className="text-sm font-semibold text-pink-600">{document.obstetricInfo.ig}</span>
                        </div>
                      )}
                      {document.obstetricInfo.dpp && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-pink-400" />
                          <span className="text-xs text-muted-foreground">DPP:</span>
                          <span className="text-sm font-semibold text-pink-600">{document.obstetricInfo.dpp}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(document)}
                      disabled={document.status !== 'ready'}
                      title={document.status !== 'ready' ? 'Documento em processamento' : 'Visualizar documento'}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      disabled={document.status !== 'ready'}
                      title={document.status !== 'ready' ? 'Documento em processamento' : 'Baixar documento'}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWhatsApp(document)}
                      disabled={document.status !== 'ready' || !document.patient.phone}
                      title={document.status !== 'ready' ? 'Documento em processamento' : !document.patient.phone ? 'Telefone não disponível' : 'Enviar via WhatsApp'}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document)}
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>

                    {document.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        title="Atualizar status"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </Button>
                    )}
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
