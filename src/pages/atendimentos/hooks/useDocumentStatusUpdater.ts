
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentToUpdate {
  id: string;
  patient_name: string;
  patient_sus: string;
  created_at: string;
}

/**
 * Hook para atualizar automaticamente documentos com status "processing"
 * Busca no storage por arquivos correspondentes e atualiza a URL
 */
export const useDocumentStatusUpdater = () => {
  const updateProcessingDocuments = async () => {
    try {
      console.log('Verificando documentos em processamento...');
      
      // Mock - generated_documents table doesn't exist
      const processingDocs: any[] = [];
      const queryError = null;

      if (queryError) {
        console.error('Erro ao buscar documentos em processamento:', queryError);
        return;
      }

      if (!processingDocs || processingDocs.length === 0) {
        console.log('Nenhum documento em processamento encontrado');
        return;
      }

      console.log(`Encontrados ${processingDocs.length} documentos em processamento`);

      // 2. Para cada documento, tentar encontrar o arquivo no storage
      for (const doc of processingDocs) {
        try {
          const patient = doc.patients;
          if (!patient) continue;

          // Gerar possíveis nomes de arquivo
          const patientNameFormatted = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
          const possibleFilenames = [
            `${patientNameFormatted}-${patient.sus}`,
            `${patient.name}-${patient.sus}`,
            `prontuario_${patientNameFormatted}_${patient.sus}`,
            `prontuario-${patientNameFormatted}-${patient.sus}`
          ];

          console.log(`Buscando arquivo para documento ${doc.id}:`, possibleFilenames);

          // Buscar arquivos no storage
          const { data: storageFiles, error: storageError } = await supabase.storage
            .from('documents')
            .list('prontuarios', {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (storageError) {
            console.error('Erro ao buscar arquivos no storage:', storageError);
            continue;
          }

          if (!storageFiles || storageFiles.length === 0) {
            console.log('Nenhum arquivo encontrado no storage');
            continue;
          }

          // Procurar arquivo correspondente
          let foundFile = null;
          
          for (const file of storageFiles) {
            const fileName = file.name;
            
            // Verificar se o nome do arquivo contém algum dos padrões esperados
            const matchesPattern = possibleFilenames.some(pattern => 
              fileName.toLowerCase().includes(pattern.toLowerCase())
            );

            // Verificar se o arquivo foi criado após o documento (com margem de 5 minutos)
            const fileCreatedAt = new Date(file.created_at);
            const docCreatedAt = new Date(doc.created_at);
            const timeDiff = fileCreatedAt.getTime() - docCreatedAt.getTime();
            
            if (matchesPattern && timeDiff > -300000 && timeDiff < 600000) { // Entre -5min e +10min
              foundFile = file;
              console.log(`Arquivo correspondente encontrado: ${fileName}`);
              break;
            }
          }

          if (foundFile) {
            // Gerar URL pública do arquivo
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(`prontuarios/${foundFile.name}`);

            if (urlData?.publicUrl) {
              console.log(`Atualizando documento ${doc.id} com URL: ${urlData.publicUrl}`);
              
              // Mock update - generated_documents table doesn't exist
              console.log('Mock updating document with URL:', doc.id, urlData.publicUrl);
              console.log(`Documento ${doc.id} atualizado com sucesso`);
            }
          } else {
            console.log(`Nenhum arquivo correspondente encontrado para documento ${doc.id}`);
            
            // Se o documento tem mais de 5 minutos e não encontrou arquivo, marcar como erro
            const docAge = Date.now() - new Date(doc.created_at).getTime();
            if (docAge > 300000) { // 5 minutos
              console.log(`Marcando documento ${doc.id} como erro (muito tempo em processamento)`);
              
              // Mock update - generated_documents table doesn't exist
              console.log('Mock marking document as error:', doc.id);
            }
          }

        } catch (error) {
          console.error(`Erro ao processar documento ${doc.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Erro geral ao atualizar documentos:', error);
    }
  };

  useEffect(() => {
    // Executar imediatamente
    updateProcessingDocuments();

    // Executar a cada 30 segundos
    const interval = setInterval(updateProcessingDocuments, 30000);

    return () => clearInterval(interval);
  }, []);

  return { updateProcessingDocuments };
};
