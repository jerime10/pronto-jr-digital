
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Document {
  id: string;
  title: string;
  file_url: string;
  document_type: string;
  created_at: string;
  patient: {
    name: string;
    sus: string;
    phone: string;
  };
}

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      // Mock - generated_documents table doesn't exist
      const data: any[] = [];
      
      return data;
    },
  });
};
