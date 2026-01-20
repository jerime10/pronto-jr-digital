
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
    <div className="rounded-md border overflow-x-auto w-full">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-xs sm:text-sm">Status</TableHead>
            <TableHead className="min-w-[120px] text-xs sm:text-sm">Paciente</TableHead>
            <TableHead className="w-[100px] text-xs sm:text-sm hidden sm:table-cell">Telefone</TableHead>
            <TableHead className="w-[80px] text-xs sm:text-sm">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            return (
              <TableRow key={document.id}>
                <TableCell className="py-2">
                  {getStatusBadge(document.status)}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground text-sm truncate max-w-[150px] sm:max-w-none">{document.patient.name}</span>
                  </div>
                  <div className="sm:hidden text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {document.patient.phone || 'Sem telefone'}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell py-2">
                  {document.patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{document.patient.phone}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(document)}
                      disabled={document.status !== 'ready'}
                      title={document.status !== 'ready' ? 'Documento em processamento' : 'Visualizar documento'}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownload(document)}
                      disabled={document.status !== 'ready'}
                      title={document.status !== 'ready' ? 'Documento em processamento' : 'Baixar documento'}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleWhatsApp(document)}
                      disabled={document.status !== 'ready' || !document.patient.phone}
                      title={document.status !== 'ready' ? 'Documento em processamento' : !document.patient.phone ? 'Telefone não disponível' : 'Enviar via WhatsApp'}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(document)}
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>

                    {document.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
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
