
import React from 'react';
import { DocumentCard } from './DocumentCard';
import { Document } from '../hooks/useDocuments';
import { EmptyState } from '@/components/ui/empty-state';
import { File } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDownload: (fileUrl: string) => void;
  onShare: (document: Document) => void;
  onDelete: (documentId: string) => void;
  isLoading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDownload,
  onShare,
  onDelete,
  isLoading = false
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando documentos...</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState 
        icon={<File size={32} />}
        title="Nenhum documento encontrado"
        description="Os documentos gerados durante o atendimento aparecem nesta página."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocumentCard 
          key={doc.id} 
          document={doc}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
