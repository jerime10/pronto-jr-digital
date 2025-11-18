import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDocumentStatusUpdater } from './useDocumentStatusUpdater';

export interface HistoricoDocument {
  id: string;
  filename: string;
  file_url: string;
  patient: {
    name: string;
    phone: string;
    sus: string;
  };
  attendance_start_at: string | null;
  attendance_end_at: string | null;
  created_at: string;
  status: 'ready' | 'processing' | 'error';
  // Informações obstétricas
  dum?: string | null; // Data da Última Menstruação
  appointment?: {
    dum?: string | null;
  } | null;
}

export const useHistoricoDocuments = () => {
  // Usar o hook de atualização automática
  useDocumentStatusUpdater();

  return useQuery({
    queryKey: ['historico-documents'],
    queryFn: async () => {
      try {
        console.log('Iniciando busca de documentos do histórico...');
        
        const documentsWithData: HistoricoDocument[] = [];

        // Buscar prontuários da tabela medical_records com file_url_storage válido (prontos)
        const { data: readyRecords, error: readyError } = await supabase
          .from('medical_records')
          .select(`
            id,
            file_url_storage,
            attendance_start_at,
            attendance_end_at,
            created_at,
            dum,
            appointment_id,
            patients!inner(
              id,
              name,
              phone,
              sus
            ),
            appointments(
              id,
              dum
            )
          `)
          .not('file_url_storage', 'is', null)
          .neq('file_url_storage', '')
          .neq('file_url_storage', 'processing_error')
          .order('created_at', { ascending: false });

        if (readyError) {
          console.error('Erro ao buscar prontuários prontos:', readyError);
        }

        // Buscar também prontuários em processamento ou com erro
        const { data: processingRecords, error: processingError } = await supabase
          .from('medical_records')
          .select(`
            id,
            file_url_storage,
            attendance_start_at,
            attendance_end_at,
            created_at,
            dum,
            appointment_id,
            patients!inner(
              id,
              name,
              phone,
              sus
            ),
            appointments(
              id,
              dum
            )
          `)
          .or('file_url_storage.is.null,file_url_storage.eq."",file_url_storage.eq."processing_error"')
          .order('created_at', { ascending: false });

        if (processingError) {
          console.log('Aviso ao buscar registros em processamento:', processingError);
        }

        console.log('Prontuários prontos encontrados:', readyRecords?.length || 0);
        console.log('Prontuários em processamento/erro encontrados:', processingRecords?.length || 0);

        // Processar prontuários prontos
        if (readyRecords && readyRecords.length > 0) {
          for (const record of readyRecords) {
            try {
              const filename = `${(record as any).patients.name}_${(record as any).id}.pdf`;

              documentsWithData.push({
                id: (record as any).id,
                filename,
                file_url: (record as any).file_url_storage,
                patient: {
                  name: (record as any).patients.name,
                  phone: (record as any).patients.phone || '',
                  sus: (record as any).patients.sus || ''
                },
                attendance_start_at: (record as any).attendance_start_at,
                attendance_end_at: (record as any).attendance_end_at,
                created_at: (record as any).created_at,
                status: 'ready' as const,
                dum: (record as any).appointments?.dum || null,
                appointment: (record as any).appointments ? {
                  dum: (record as any).appointments.dum
                } : null
              });
            } catch (error) {
              console.error('Erro ao processar prontuário pronto:', (record as any).id, error);
            }
          }
        }

        // Processar prontuários em processamento ou com erro
        if (processingRecords && processingRecords.length > 0) {
          for (const record of processingRecords) {
            try {
              let status: 'processing' | 'error' = 'processing';
              if ((record as any).file_url_storage === 'processing_error') {
                status = 'error';
              }

              const filename = `${(record as any).patients.name}_${(record as any).id}.pdf`;

              documentsWithData.push({
                id: (record as any).id,
                filename,
                file_url: (record as any).file_url_storage || '',
                patient: {
                  name: (record as any).patients.name,
                  phone: (record as any).patients.phone || '',
                  sus: (record as any).patients.sus || ''
                },
                attendance_start_at: (record as any).attendance_start_at,
                attendance_end_at: (record as any).attendance_end_at,
                created_at: (record as any).created_at,
                status,
                dum: (record as any).appointments?.dum || null,
                appointment: (record as any).appointments ? {
                  dum: (record as any).appointments.dum
                } : null
              });
            } catch (error) {
              console.error('Erro ao processar prontuário em processamento:', (record as any).id, error);
            }
          }
        }

        // Fallback do Storage removido para evitar duplicidade e centralizar na fonte oficial (medical_records)

        console.log(`Total de documentos processados: ${documentsWithData.length}`);
        
        // Ordenar por data de criação (mais recente primeiro)
        documentsWithData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return documentsWithData;

      } catch (error) {
        console.error('Erro ao carregar documentos do histórico:', error);
        toast.error('Erro ao carregar documentos do histórico');
        throw error;
      }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000, // Considerar dados obsoletos após 10 segundos
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  });
};