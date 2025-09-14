import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface StorageDocument {
  id: string;
  title: string;
  file_url: string;
  document_type: string;
  created_at: string;
  patient: {
    name: string;
    phone?: string;
    sus?: string;
  };
}

export const useStorageDocuments = () => {
  const fetchStorageDocuments = async (): Promise<StorageDocument[]> => {
    try {
      // Mock - generated_documents table doesn't exist
      const documents: any[] = [];
      
      if (documents.length === 0) {
        console.log('Nenhum documento encontrado no storage');
        return [];
      }

      // Transform data
      return documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        file_url: doc.file_url,
        document_type: doc.document_type,
        created_at: doc.created_at,
        patient: doc.patients || {
          name: 'Paciente não identificado',
          phone: '',
          sus: ''
        }
      }));
    } catch (error) {
      console.error('Erro ao buscar documentos do storage:', error);
      toast.error('Erro ao carregar documentos do storage');
      throw error;
    }
  };

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['storage-documents'],
    queryFn: fetchStorageDocuments,
    retry: 1,
  });

  return {
    documents: documents || [],
    isLoading,
    error,
    refetch
  };
};