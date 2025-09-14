
import React from 'react';
import { StorageDocumentCard } from './StorageDocumentCard';
import { useStorageDocuments } from '../hooks/useStorageDocuments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

export const DocumentsList: React.FC = () => {
  const { documents, isLoading, error, refetch } = useStorageDocuments();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error("Error loading documents:", error);
    return (
      <EmptyState 
        icon={<FileText size={32} />}
        title="Erro ao carregar documentos"
        description="Ocorreu um erro ao buscar os documentos. Tente novamente."
      />
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState 
        icon={<FileText size={32} />}
        title="Nenhum documento encontrado"
        description="Os documentos PDF gerados aparecerão aqui quando estiverem disponíveis."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <StorageDocumentCard
          key={doc.id}
          document={doc}
          onRefresh={refetch}
        />
      ))}
    </div>
  );
};
