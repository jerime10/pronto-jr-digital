
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para atualizar automaticamente documentos com status "processing" ou URLs incorretas
 * Busca no storage por arquivos correspondentes e atualiza a URL correta
 */
export const useDocumentStatusUpdater = () => {
  const updateDocumentsWithStorageUrls = async () => {
    try {
      console.log('[StatusUpdater] Verificando documentos para atualização de URL...');
      
      // Buscar prontuários que estão em processamento (sem URL ou com URL vazia)
      const { data: processingDocs, error: processingError } = await supabase
        .from('medical_records')
        .select('id, file_url_storage, created_at, patients!inner(id, name, phone, sus)')
        .or('file_url_storage.is.null,file_url_storage.eq.""')
        .order('created_at', { ascending: false })
        .limit(50);

      if (processingError) {
        console.error('[StatusUpdater] Erro ao buscar documentos em processamento:', processingError);
        return;
      }

      // Buscar também prontuários que podem ter URL incorreta (contêm número sem formatação)
      const { data: potentiallyIncorrectDocs, error: incorrectError } = await supabase
        .from('medical_records')
        .select('id, file_url_storage, created_at, patients!inner(id, name, phone, sus)')
        .not('file_url_storage', 'is', null)
        .neq('file_url_storage', '')
        .neq('file_url_storage', 'processing_error')
        .order('created_at', { ascending: false })
        .limit(100);

      if (incorrectError) {
        console.log('[StatusUpdater] Aviso ao buscar docs potencialmente incorretos:', incorrectError);
      }

      // Combinar as listas
      const allDocs = [...(processingDocs || []), ...(potentiallyIncorrectDocs || [])];
      
      if (allDocs.length === 0) {
        console.log('[StatusUpdater] Nenhum documento para verificar');
        return;
      }

      console.log(`[StatusUpdater] Verificando ${allDocs.length} documentos`);

      // Buscar todos os arquivos do storage uma vez
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('documents')
        .list('prontuarios', {
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError || !storageFiles) {
        console.error('[StatusUpdater] Erro ao listar arquivos do storage:', storageError);
        return;
      }

      console.log(`[StatusUpdater] ${storageFiles.length} arquivos encontrados no storage`);

      // Para cada documento, verificar se existe arquivo correspondente
      for (const doc of allDocs) {
        try {
          const docId = (doc as any).id;
          const currentUrl = (doc as any).file_url_storage || '';
          
          // Procurar arquivo que contenha o ID do documento
          const foundFile = storageFiles.find(file => 
            file.name.includes(docId) && file.name.endsWith('.pdf')
          );

          if (foundFile) {
            // Gerar URL pública correta
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(`prontuarios/${foundFile.name}`);

            if (urlData?.publicUrl) {
              const correctUrl = urlData.publicUrl;
              
              // Verificar se a URL atual é diferente da correta
              if (currentUrl !== correctUrl) {
                console.log(`[StatusUpdater] Corrigindo URL para doc ${docId}:`);
                console.log(`  De: ${currentUrl || '(vazio)'}`);
                console.log(`  Para: ${correctUrl}`);

                const { error: updateError } = await supabase
                  .from('medical_records')
                  .update({ file_url_storage: correctUrl })
                  .eq('id', docId);

                if (updateError) {
                  console.error(`[StatusUpdater] Erro ao atualizar doc ${docId}:`, updateError);
                } else {
                  console.log(`[StatusUpdater] Doc ${docId} atualizado com sucesso!`);
                }
              }
            }
          } else {
            // Se não encontrou arquivo e o documento está em processamento há mais de 5 minutos
            if (!currentUrl || currentUrl === '') {
              const docAge = Date.now() - new Date((doc as any).created_at).getTime();
              if (docAge > 300000) { // 5 minutos
                console.log(`[StatusUpdater] Doc ${docId} em processamento há mais de 5 min sem arquivo`);
              }
            }
          }
        } catch (docError) {
          console.error(`[StatusUpdater] Erro ao processar documento:`, docError);
        }
      }

    } catch (error) {
      console.error('[StatusUpdater] Erro geral:', error);
    }
  };

  useEffect(() => {
    // Executar imediatamente
    updateDocumentsWithStorageUrls();

    // Executar a cada 30 segundos
    const interval = setInterval(updateDocumentsWithStorageUrls, 30000);

    return () => clearInterval(interval);
  }, []);

  return { updateDocumentsWithStorageUrls };
};
