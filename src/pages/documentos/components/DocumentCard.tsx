
import React from 'react';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, Trash2 } from 'lucide-react';
import { Document } from '../hooks/useDocuments';
import { WhatsAppTemplateButton } from '@/components/ui/WhatsAppTemplateButton';

interface DocumentCardProps {
  document: Document;
  onDownload: (fileUrl: string) => void;
  onShare: (document: Document) => void;
  onDelete: (documentId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDownload,
  onShare,
  onDelete
}) => {
  const hasPhone = document.patient?.phone && document.patient.phone.trim() !== '';
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-muted pb-2">
        <CardTitle className="text-lg flex items-center">
          <File className="h-4 w-4 mr-2" />
          <span className="truncate">{document.title}</span>
        </CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
            {document.document_type === 'prontuario' ? 'Prontuário' : document.document_type}
          </span>
          <span>{format(new Date(document.created_at), 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4">
          <p className="text-sm font-medium">Paciente</p>
          <p className="text-sm">{document.patient?.name || 'Desconhecido'}</p>
          <p className="text-sm text-muted-foreground">SUS: {document.patient?.sus || 'N/A'}</p>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onDownload(document.file_url)}
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
          
          <WhatsAppTemplateButton
            patientName={document.patient?.name}
            consultDate={format(new Date(document.created_at), 'dd/MM/yyyy HH:mm')}
            documentUrl={document.file_url}
            patientPhone={document.patient?.phone}
            variant="default"
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={!hasPhone}
          >
            WhatsApp
          </WhatsAppTemplateButton>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
          onClick={() => onDelete(document.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
};
