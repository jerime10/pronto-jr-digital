
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StorageBucketDocument {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
  size: number;
  patient?: {
    id: string;
    name: string;
    phone: string;
    sus: string;
  } | null;
  metadata: {
    patientName: string;
    patientPhone: string;
    documentType: string;
    attendanceStartAt?: string;
    attendanceEndAt?: string;
  };
}

// Função para extrair informações do nome do arquivo incluindo datas de atendimento
const extractPatientInfoFromFilename = (filename: string) => {
  console.log('Extracting info from filename:', filename);
  
  // Decodificar URL para tratar caracteres especiais como %20
  const decodedFilename = decodeURIComponent(filename);
  console.log('Decoded filename:', decodedFilename);
  
  // Formato atual do storage: "NOME-TELEFONE-ID.pdf"
  // Exemplo: "JOSINETE GOMES DOS SANTOS-91982617840-0e3bb467-518c-402d-9b6c-50d2337014d3.pdf"
  const currentMatch = decodedFilename.match(/^(.+?)-(\d{10,11})-([a-f0-9\-]+).*\.pdf$/i);
  
  if (currentMatch) {
    console.log('Match found:', currentMatch);
    return {
      patientName: currentMatch[1].trim(),
      patientPhone: currentMatch[2], // Já é apenas números
      documentId: currentMatch[3],
      attendanceStartAt: undefined,
      attendanceEndAt: undefined
    };
  }
  
  // Formato com datas de atendimento: "Nome do Paciente - Telefone - StartDateTime - EndDateTime - ID_timestamp.pdf"
  const fullMatch = decodedFilename.match(/^(.+?)\s*-\s*([\d\s\(\)\-\+]+)\s*-\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s*-\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s*-\s*([a-f0-9\-]+).*\.pdf$/i);
  
  if (fullMatch) {
    return {
      patientName: fullMatch[1].trim(),
      patientPhone: fullMatch[2].replace(/\D/g, ''), // Remove caracteres não numéricos
      attendanceStartAt: fullMatch[3],
      attendanceEndAt: fullMatch[4],
      documentId: fullMatch[5]
    };
  }
  
  // Formato antigo sem datas de atendimento: "Nome do Paciente - Telefone - ID_timestamp.pdf"
  const legacyMatch = decodedFilename.match(/^(.+?)\s*-\s*([\d\s\(\)\-\+]+)\s*-\s*([a-f0-9\-]+).*\.pdf$/i);
  
  if (legacyMatch) {
    return {
      patientName: legacyMatch[1].trim(),
      patientPhone: legacyMatch[2].replace(/\D/g, ''),
      documentId: legacyMatch[3],
      attendanceStartAt: undefined,
      attendanceEndAt: undefined
    };
  }
  
  // Fallback: tentar extrair pelo menos o nome
  const nameMatch = decodedFilename.match(/^(.+?)(?:\s*-|\.).*$/);
  const result = {
    patientName: nameMatch ? nameMatch[1].trim() : decodedFilename.replace('.pdf', ''),
    patientPhone: '',
    documentId: '',
    attendanceStartAt: undefined,
    attendanceEndAt: undefined
  };
  
  console.log('Fallback result:', result);
  return result;
};

// Função para converter UTC para horário de Brasília (UTC-3)
const convertToBrasiliaTime = (utcDateString: string | undefined): string | undefined => {
  if (!utcDateString) return undefined;
  
  try {
    const utcDate = new Date(utcDateString);
    // Brasília é UTC-3, então subtraímos 3 horas
    const brasiliaDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
    return brasiliaDate.toISOString();
  } catch (error) {
    console.warn('Error converting to Brasília time:', error);
    return utcDateString;
  }
};

export const useStorageBucketDocuments = () => {
  return useQuery({
    queryKey: ['storage-bucket-documents'],
    queryFn: async () => {
      try {
        console.log('Buscando documentos do Storage bucket "documents/prontuarios"...');
        
        // Listar arquivos do bucket "documents" na pasta "prontuarios"
        const { data: files, error: storageError } = await supabase.storage
          .from('documents')
          .list('prontuarios', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (storageError) {
          console.error('Erro ao buscar arquivos do Storage:', storageError);
          throw storageError;
        }

        if (!files || files.length === 0) {
          console.log('Nenhum arquivo encontrado no bucket');
          return [];
        }

        console.log(`Encontrados ${files.length} arquivos no bucket`);

        // Processar cada arquivo
        const documentsPromises = files.map(async (file) => {
          // Obter URL pública do arquivo com o caminho completo incluindo "prontuarios/"
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`prontuarios/${file.name}`);

          // Extrair informações do paciente do nome do arquivo
          const patientInfo = extractPatientInfoFromFilename(file.name);

          // Converter datas para horário de Brasília
          const attendanceStartAtBrasilia = convertToBrasiliaTime(patientInfo.attendanceStartAt);
          const attendanceEndAtBrasilia = convertToBrasiliaTime(patientInfo.attendanceEndAt);

          // Buscar dados completos do paciente se temos o telefone
          let patient = null;
          if (patientInfo.patientPhone) {
            try {
              // Mock - patients table doesn't exist (using pacientes table)
              const patientData: any = null;
              
              if (patientData) {
                patient = patientData;
              }
            } catch (err) {
              console.warn('Erro ao buscar dados do paciente:', err);
            }
          }

          return {
            id: file.id || file.name,
            name: file.name,
            file_url: urlData.publicUrl,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
            patient,
            metadata: {
              patientName: patientInfo.patientName,
              patientPhone: patientInfo.patientPhone,
              documentType: 'prontuario', // Pode ser expandido no futuro
              attendanceStartAt: attendanceStartAtBrasilia,
              attendanceEndAt: attendanceEndAtBrasilia
            }
          } as StorageBucketDocument;
        });

        const documents = await Promise.all(documentsPromises);
        
        console.log('Documentos processados:', documents);
        return documents;

      } catch (error) {
        console.error('Erro ao carregar documentos do Storage:', error);
        toast.error('Erro ao carregar documentos');
        throw error;
      }
    },
  });
};
