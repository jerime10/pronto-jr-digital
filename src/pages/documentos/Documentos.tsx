
import React from 'react';
import { DocumentList } from './components/DocumentList';
import { useDocuments } from './hooks/useDocuments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Documentos: React.FC = () => {
  const { 
    documents, 
    isLoading, 
    handleDeleteDocument, 
    handleDownloadDocument, 
    handleShareDocument 
  } = useDocuments();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documentos do Paciente</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DocumentList 
          documents={documents || []}
          onDelete={handleDeleteDocument}
          onDownload={handleDownloadDocument}
          onShare={handleShareDocument}
        />
      )}
    </div>
  );
};

export default Documentos;
