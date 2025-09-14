import { useQuery } from '@tanstack/react-query';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface Professional {
  id: string;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'COMUM';
  ativo: boolean;
  created_at?: string;
}

export const useProfessionalData = () => {
  const { user } = useSimpleAuth();
  
  const { data: professional, isLoading: isLoadingProfessional } = useQuery<Professional | null>({
    queryKey: ['current_professional', user?.id],
    queryFn: async (): Promise<Professional | null> => {
      if (!user) {
        console.log('No authenticated user');
        return null;
      }
      
      try {
        // Return the professional data directly from the authenticated user
        return {
          id: user.id,
          nome: user.username,
          email: user.username + '@sistema.com',
          tipo: user.isAdmin ? 'ADMIN' : 'COMUM',
          ativo: true,
          created_at: new Date().toISOString()
        };
        
      } catch (error) {
        console.error('Error in useProfessionalData:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!user
  });

  return {
    professional,
    isLoadingProfessional
  };
};