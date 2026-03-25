
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Eye, FileText, Loader2, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  downloadHistoricoDocument,
  viewHistoricoDocument,
  shareHistoricoDocumentViaWhatsApp,
  deleteHistoricoDocument,
  HistoricoDocument
} from '../utils/historicoDocumentActions';
import { usePermissions } from '@/hooks/usePermissions';

interface HistoricoDocumentCardProps {
  doc: HistoricoDocument;
  onRefresh: () => void;
}

export function HistoricoDocumentCard({ 
  doc, 
  onRefresh
}: HistoricoDocumentCardProps) {
  if (!doc) return null;

  const isProcessing = doc.file_url === 'processing';
  const { isAtendente } = usePermissions();

  const handleDownload = () => {
    if (isProcessing) return;
    downloadHistoricoDocument(doc.file_url, doc.filename);
  };

  const handleShare = () => {
    if (isProcessing) return;
    shareHistoricoDocumentViaWhatsApp(doc, onRefresh);
  };

  const handleView = () => {
    if (isProcessing) return;
    viewHistoricoDocument(doc, doc.filename);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
      await deleteHistoricoDocument(doc.id, onRefresh);
    }
  };

  // Formatar duração
  const getDuration = () => {
    // Tenta pegar a duração do documento se ele tiver
    const record = doc as any;
    if (record.attendance_start_at && record.attendance_end_at) {
      const start = new Date(record.attendance_start_at);
      const end = new Date(record.attendance_end_at);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins > 0) return `${diffMins} min`;
    }
    return null;
  };

  const duration = getDuration();

  return (
    <Card className={`relative overflow-hidden ${isProcessing ? 'border-amber-200 bg-amber-50/30' : 'hover:border-primary/50'} transition-all duration-200`}>
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-200 overflow-hidden">
          <div className="h-full bg-amber-400 animate-pulse w-1/2 rounded-r-full" style={{ animationDuration: '1.5s' }} />
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h3 className="font-semibold text-lg line-clamp-1" title={doc.title || doc.filename}>
              {doc.title || 'Prontuário'}
            </h3>
          </div>
          <Badge variant={isProcessing ? "outline" : "default"} className={
            isProcessing 
              ? "bg-amber-100 text-amber-800 border-amber-200" 
              : "bg-emerald-100 text-emerald-800 border-emerald-200"
          }>
            {isProcessing ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processando
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Pronto
              </span>
            )}
          </Badge>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-sm">
            <div className="bg-gray-100 p-2 rounded-full text-gray-500 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 line-clamp-2">
                {doc.patient?.name || 'Paciente não identificado'}
              </p>
              {doc.patient?.phone && (
                <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {doc.patient.phone}
                </p>
              )}
              {doc.patient?.sus && (
                <p className="text-gray-500 mt-0.5">SUS: {doc.patient.sus}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
            {/* Exibir Início e Término se existirem no registro (apenas para prontuários) */}
            {((doc as any).attendance_start_at) && (
              <div className="flex items-center gap-2 text-xs text-gray-600 border-b border-gray-200 pb-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <div className="flex flex-col">
                  <span>Início: {format(new Date((doc as any).attendance_start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  <span className="text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Término: {(doc as any).attendance_end_at ? format(new Date((doc as any).attendance_end_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Não informado'}
                  </span>
                </div>
              </div>
            )}
            
            {duration && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Duração: {duration}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Criado: {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
        </div>

        {isProcessing ? (
          <div className="bg-amber-50 p-3 rounded text-sm text-amber-800 border border-amber-100 flex items-start gap-2">
            <Loader2 className="h-4 w-4 animate-spin mt-0.5 shrink-0" />
            <p>Documento sendo processado. Aguarde alguns instantes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full h-9 bg-white hover:bg-gray-50 border-gray-200" 
              onClick={handleView}
            >
              <Eye className="h-4 w-4 mr-2 text-gray-500" />
              Visualizar
            </Button>
            <Button 
              className="w-full h-9 bg-primary hover:bg-primary/90 text-white" 
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-9 col-span-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar via WhatsApp
            </Button>
            
            {/* Delete button - only for admin, not for attendants */}
            {!isAtendente && (
              <Button 
                variant="outline" 
                className="w-full h-9 col-span-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mt-1" 
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Documento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
