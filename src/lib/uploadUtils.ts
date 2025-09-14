
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Uploads a logo file to Supabase storage
 * @param file The file to upload
 * @param progressCallback Callback function to track upload progress
 * @returns Promise resolving to the public URL of the uploaded file
 */
export const uploadLogo = async (
  file: File, 
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.includes('image/')) {
      throw new Error('O arquivo selecionado não é uma imagem válida');
    }

    // Create a unique filename
    const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
    
    // Show initial progress
    if (progressCallback) {
      progressCallback(10);
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw uploadError;
    }

    // Update progress
    if (progressCallback) {
      progressCallback(80);
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('site-assets')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Não foi possível obter a URL pública do arquivo');
    }

    // Complete progress
    if (progressCallback) {
      progressCallback(100);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error during logo upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
    toast.error(`Erro ao fazer upload do logo: ${errorMessage}`);
    throw error;
  }
};
