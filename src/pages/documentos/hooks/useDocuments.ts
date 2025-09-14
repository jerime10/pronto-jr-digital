
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { deleteDocument } from '../utils/documentActions';

export interface Document {
  id: string;
  title: string;
  file_url: string;
  document_type: string;
  created_at: string;
  patient: {
    name: string;
    sus: string;
    phone?: string;
  };
}

export const useDocuments = () => {
  const fetchDocuments = async () => {
    // Mock - generated_documents table doesn't exist
    const data: any[] = [];
    
    return data;
  };

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments
  });

  const handleDeleteDocument = async (documentId: string) => {
    console.log("Deleting document with ID:", documentId);
    await deleteDocument(documentId, refetch);
  };

  const handleDownloadDocument = (fileUrl: string) => {
    import('../utils/documentActions').then(({ downloadDocument }) => {
      downloadDocument(fileUrl);
    });
  };

  const handleShareDocument = (document: Document) => {
    import('../utils/documentActions').then(({ shareViaWhatsApp }) => {
      shareViaWhatsApp(document, refetch);
    });
  };

  return {
    documents,
    isLoading,
    error,
    refetch,
    handleDeleteDocument,
    handleDownloadDocument,
    handleShareDocument
  };
};
