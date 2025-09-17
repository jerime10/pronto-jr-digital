
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DocumentAsset, SUPPORTED_ASSET_TYPES, MAX_ASSET_SIZE } from '@/types/documentAssetTypes';
import { ProfessionalSignatureInfo } from '@/types/siteSettingsTypes';
import { saveDocumentAssets, fetchDocumentAssets } from '@/services/documentAssetsService';

export function useDocumentAssets() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing assets
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['document_assets'],
    queryFn: fetchDocumentAssets,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Validate file
  const validateFile = (file: File) => {
    if (!SUPPORTED_ASSET_TYPES.includes(file.type as any)) {
      throw new Error('Apenas arquivos JPG, JPEG e PNG são permitidos');
    }
    
    if (file.size > MAX_ASSET_SIZE) {
      throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
    }
  };

  // Process file for upload
  const processFile = async (file: File): Promise<DocumentAsset> => {
    validateFile(file);
    
    const base64 = await convertFileToBase64(file);
    
    return {
      id: crypto.randomUUID(),
      base64,
      filename: file.name,
      size: file.size,
      type: file.type
    };
  };

  // Save assets mutation
  const saveAssetsMutation = useMutation({
    mutationFn: saveDocumentAssets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_assets'] });
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
      toast.success('Assets salvos com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving assets:', error);
      toast.error('Erro ao salvar assets');
    },
  });

  // Upload logo
  const uploadLogo = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(25);
      
      const logoAsset = await processFile(file);
      setUploadProgress(75);
      
      await saveAssetsMutation.mutateAsync({
        logoData: logoAsset.base64,
        signatureData: assets?.signatureData || null,
        signatureProfessionalName: assets?.signatureProfessionalName || null,
        signatureProfessionalTitle: assets?.signatureProfessionalTitle || null,
        signatureProfessionalRegistry: assets?.signatureProfessionalRegistry || null,
        attendantLogoData: assets?.attendantLogoData || null,
      });
      
      setUploadProgress(100);
      toast.success('Logo salvo com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do logo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload signature
  const uploadSignature = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(25);
      
      const signatureAsset = await processFile(file);
      setUploadProgress(75);
      
      await saveAssetsMutation.mutateAsync({
        logoData: assets?.logoData || null,
        signatureData: signatureAsset.base64,
        signatureProfessionalName: assets?.signatureProfessionalName || null,
        signatureProfessionalTitle: assets?.signatureProfessionalTitle || null,
        signatureProfessionalRegistry: assets?.signatureProfessionalRegistry || null,
        attendantLogoData: assets?.attendantLogoData || null,
      });
      
      setUploadProgress(100);
      toast.success('Assinatura salva com sucesso!');
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da assinatura');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload attendant logo
  const uploadAttendantLogo = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(25);
      
      const attendantLogoAsset = await processFile(file);
      setUploadProgress(75);
      
      await saveAssetsMutation.mutateAsync({
        logoData: assets?.logoData || null,
        signatureData: assets?.signatureData || null,
        signatureProfessionalName: assets?.signatureProfessionalName || null,
        signatureProfessionalTitle: assets?.signatureProfessionalTitle || null,
        signatureProfessionalRegistry: assets?.signatureProfessionalRegistry || null,
        attendantLogoData: attendantLogoAsset.base64,
      });
      
      setUploadProgress(100);
      toast.success('Logo do atendente salvo com sucesso!');
    } catch (error) {
      console.error('Error uploading attendant logo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do logo do atendente');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Update professional info
  const updateProfessionalInfo = async (professionalInfo: ProfessionalSignatureInfo) => {
    try {
      await saveAssetsMutation.mutateAsync({
        logoData: assets?.logoData || null,
        signatureData: assets?.signatureData || null,
        signatureProfessionalName: professionalInfo.name,
        signatureProfessionalTitle: professionalInfo.title,
        signatureProfessionalRegistry: professionalInfo.registry,
        attendantLogoData: assets?.attendantLogoData || null,
      });
      toast.success('Informações do profissional salvas com sucesso!');
    } catch (error) {
      console.error('Error updating professional info:', error);
      toast.error('Erro ao salvar informações do profissional');
    }
  };

  // Remove logo
  const removeLogo = async () => {
    try {
      await saveAssetsMutation.mutateAsync({
        logoData: null,
        signatureData: assets?.signatureData || null,
        signatureProfessionalName: assets?.signatureProfessionalName || null,
        signatureProfessionalTitle: assets?.signatureProfessionalTitle || null,
        signatureProfessionalRegistry: assets?.signatureProfessionalRegistry || null,
        attendantLogoData: assets?.attendantLogoData || null,
      });
      toast.success('Logo removido com sucesso!');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  // Remove signature
  const removeSignature = async () => {
    try {
      await saveAssetsMutation.mutateAsync({
        logoData: assets?.logoData || null,
        signatureData: null,
        signatureProfessionalName: null,
        signatureProfessionalTitle: null,
        signatureProfessionalRegistry: null,
        attendantLogoData: assets?.attendantLogoData || null,
      });
      toast.success('Assinatura removida com sucesso!');
    } catch (error) {
      console.error('Error removing signature:', error);
      toast.error('Erro ao remover assinatura');
    }
  };

  // Remove attendant logo
  const removeAttendantLogo = async () => {
    try {
      await saveAssetsMutation.mutateAsync({
        logoData: assets?.logoData || null,
        signatureData: assets?.signatureData || null,
        signatureProfessionalName: assets?.signatureProfessionalName || null,
        signatureProfessionalTitle: assets?.signatureProfessionalTitle || null,
        signatureProfessionalRegistry: assets?.signatureProfessionalRegistry || null,
        attendantLogoData: null,
      });
      toast.success('Logo do atendente removido com sucesso!');
    } catch (error) {
      console.error('Error removing attendant logo:', error);
      toast.error('Erro ao remover logo do atendente');
    }
  };

  return {
    assets,
    isLoading,
    error,
    uploadProgress,
    isUploading,
    isSaving: saveAssetsMutation.isPending,
    uploadLogo,
    uploadSignature,
    uploadAttendantLogo,
    updateProfessionalInfo,
    removeLogo,
    removeSignature,
    removeAttendantLogo,
    attendantLogoData: assets?.attendantLogoData || null,
  };
}
