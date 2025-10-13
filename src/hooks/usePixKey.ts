import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PixKeyResponse {
  pixKey: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePixKey(): PixKeyResponse {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pix_key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('pix_key')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar chave PIX:', error);
        throw error;
      }

      return (data?.pix_key as string) || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    pixKey: data || null,
    isLoading,
    error: error as Error | null,
  };
}
