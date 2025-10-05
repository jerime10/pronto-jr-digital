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

        // Buscar arquivos do Storage apenas como fallback (para arquivos antigos)
        try {
          const { data: storageFiles, error: storageError } = await supabase.storage
            .from('documents')
            .list('prontuarios', {
              limit: 50,
              offset: 0,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (!storageError && storageFiles && storageFiles.length > 0) {
            console.log('Arquivos encontrados no storage (fallback):', storageFiles.length);
            
            for (const file of storageFiles) {
              if (!file.name.endsWith('.pdf')) {
                continue;
              }

              // Verificar se já existe um documento com este arquivo
              const existingDoc = documentsWithData.find(doc => 
                doc.filename === file.name || doc.file_url.includes(file.name)
              );

              if (!existingDoc) {
                // Gerar URL pública do arquivo
                const { data: urlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(`prontuarios/${file.name}`);

                // Extrair informações do paciente do nome do arquivo
                const extractPatientInfo = (filename: string) => {
                  console.log('Extracting patient info from filename:', filename);
                  
                  // Decodificar URL para tratar caracteres especiais como %20
                  const decodedFilename = decodeURIComponent(filename);
                  console.log('Decoded filename:', decodedFilename);
                  
                  // Formato atual do storage: "NOME-TELEFONE-ID.pdf"
                  // Exemplo: "JOSINETE GOMES DOS SANTOS-91982617840-0e3bb467-518c-402d-9b6c-50d2337014d3.pdf"
                  const currentMatch = decodedFilename.match(/^(.+?)-(\d{10,11})-([a-f0-9\-]+).*\.pdf$/i);
                  
                  if (currentMatch) {
                    console.log('Current format match found:', currentMatch);
                    return {
                      name: currentMatch[1].trim(),
                      phone: currentMatch[2], // Já é apenas números
                      recordId: currentMatch[3]
                    };
                  }
                  
                  // Formato com espaços: "Nome do Paciente - Telefone - StartDateTime - EndDateTime - ID_timestamp.pdf"
                  const match = decodedFilename.match(/^(.+?)\s*-\s*([\d\s\(\)\-\+]+)\s*-.*\.pdf$/i);
                  if (match) {
                    console.log('Spaced format match found:', match);
                    return {
                      name: match[1].trim(),
                      phone: match[2].replace(/\D/g, ''), // Remove caracteres não numéricos
                      recordId: null
                    };
                  }
                  
                  // Fallback: só o nome
                  const nameMatch = decodedFilename.match(/^(.+?)(?:\s*-|\.).*$/);
                  const result = {
                    name: nameMatch ? nameMatch[1].trim() : decodedFilename.replace('.pdf', ''),
                    phone: '',
                    recordId: null
                  };
                  
                  console.log('Fallback result:', result);
                  return result;
                };

                // Tentar extrair dados do nome do arquivo
                console.log('Processando arquivo:', file.name);
                
                const patientInfo = extractPatientInfo(file.name);
                
                let patientData = {
                  name: patientInfo.name,
                  phone: patientInfo.phone,
                  sus: ''
                };

                // Se extraiu um recordId do nome do arquivo, tentar buscar mais dados
                if (patientInfo.recordId) {
                  try {
                    const { data: recordData } = await supabase
                      .from('medical_records')
                      .select(`
                        id,
                        patients!inner(
                          name,
                          phone,
                          sus
                        )
                      `)
                      .eq('id', patientInfo.recordId)
                      .single();

                    if (recordData && recordData.patients) {
                      patientData = {
                        name: recordData.patients.name,
                        phone: recordData.patients.phone || patientInfo.phone, // Usar telefone do arquivo se não tiver no DB
                        sus: recordData.patients.sus || ''
                      };
                      console.log('Dados do paciente encontrados:', patientData);
                    } else {
                      console.log('Prontuário não encontrado para UUID:', patientInfo.recordId);
                    }
                  } catch (error) {
                    console.log('Erro ao buscar dados do paciente para arquivo:', file.name, error);
                  }
                } else {
                  // Tentar buscar UUID de forma alternativa (para compatibilidade com formatos antigos)
                  const fileName = file.name.replace('.pdf', '');
                  const fileNameParts = fileName.split('-');
                  
                  let recordId = null;
                  if (fileNameParts.length > 1) {
                    // Pegar os últimos 5 segmentos que poderiam formar um UUID
                    const possibleUuidParts = fileNameParts.slice(-5);
                    const possibleUuid = possibleUuidParts.join('-');
                    
                    // Verificar se é um UUID válido (36 caracteres)
                    if (possibleUuid.length === 36) {
                      recordId = possibleUuid;
                      console.log('UUID encontrado no arquivo (fallback):', recordId);
                      
                      try {
                        const { data: recordData } = await supabase
                          .from('medical_records')
                          .select(`
                            id,
                            patients!inner(
                              name,
                              phone,
                              sus
                            )
                          `)
                          .eq('id', recordId)
                          .single();

                        if (recordData && recordData.patients) {
                          patientData = {
                            name: recordData.patients.name,
                            phone: recordData.patients.phone || patientInfo.phone,
                            sus: recordData.patients.sus || ''
                          };
                          console.log('Dados do paciente encontrados (fallback):', patientData);
                        }
                      } catch (error) {
                        console.log('Erro ao buscar dados do paciente (fallback):', error);
                      }
                    }
                  }
                }
                
                documentsWithData.push({
                  id: `storage-${file.name}`,
                  filename: file.name,
                  file_url: urlData.publicUrl,
                  patient: patientData,
                  attendance_start_at: null,
                  attendance_end_at: null,
                  created_at: file.created_at || new Date().toISOString(),
                  status: 'ready' as const
                });
              }
            }
          }
        } catch (storageError) {
          console.error('Erro ao buscar arquivos do storage:', storageError);
        }

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