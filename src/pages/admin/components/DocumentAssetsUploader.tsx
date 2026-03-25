
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage, Eye, User, ImageIcon } from 'lucide-react';
import { useDocumentAssets } from '@/hooks/useDocumentAssets';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionButtonGuard } from '@/components/PermissionGuard';
import { ProfessionalSignatureInfo } from '@/types/siteSettingsTypes';
import { SUPPORTED_ASSET_TYPES, MAX_ASSET_SIZE } from '@/types/documentAssetTypes';

const DocumentAssetsUploader: React.FC = () => {
  const {
    assets,
    isLoading,
    uploadProgress,
    isUploading,
    isSaving,
    uploadLogo,
    uploadSignature,
    uploadRtSignature,
    uploadAttendantLogo,
    updateProfessionalInfo,
    updateRtInfo,
    removeLogo,
    removeSignature,
    removeRtSignature,
    removeAttendantLogo,
    attendantLogoData,
  } = useDocumentAssets();

  const { isAdmin } = usePermissions();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const rtSignatureInputRef = useRef<HTMLInputElement>(null);
  const attendantLogoInputRef = useRef<HTMLInputElement>(null);

  // Professional info state
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalSignatureInfo>({
    name: '',
    title: '',
    registry: '',
  });

  // RT info state
  const [rtInfo, setRtInfo] = useState<ProfessionalSignatureInfo>({
    name: '',
    title: '',
    registry: '',
  });

  // Drag and drop states
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverSignature, setDragOverSignature] = useState(false);
  const [dragOverRtSignature, setDragOverRtSignature] = useState(false);
  const [dragOverAttendantLogo, setDragOverAttendantLogo] = useState(false);

  // Update professional info when assets change
  useEffect(() => {
    if (assets) {
      setProfessionalInfo({
        name: assets.signatureProfessionalName || '',
        title: assets.signatureProfessionalTitle || '',
        registry: assets.signatureProfessionalRegistry || '',
      });
      setRtInfo({
        name: assets.rtName || '',
        title: assets.rtTitle || '',
        registry: assets.rtRegistry || '',
      });
    }
  }, [assets]);

  const validateFile = (file: File) => {
    if (!SUPPORTED_ASSET_TYPES.includes(file.type as any)) {
      throw new Error('Apenas arquivos JPG, JPEG e PNG são permitidos');
    }
    
    if (file.size > MAX_ASSET_SIZE) {
      throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        uploadLogo(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
    // Clear input to allow re-upload of same file
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        uploadSignature(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
    // Clear input to allow re-upload of same file
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const handleRtSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        uploadRtSignature(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
    // Clear input to allow re-upload of same file
    if (rtSignatureInputRef.current) {
      rtSignatureInputRef.current.value = '';
    }
  };

  const handleAttendantLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file);
        uploadAttendantLogo(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
    // Clear input to allow re-upload of same file
    if (attendantLogoInputRef.current) {
      attendantLogoInputRef.current.value = '';
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverLogo(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        uploadLogo(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
  };

  const handleSignatureDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSignature(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        uploadSignature(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
  };

  const handleRtSignatureDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverRtSignature(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        uploadRtSignature(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
  };

  const handleAttendantLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverAttendantLogo(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        uploadAttendantLogo(file);
      } catch (error) {
        console.error('File validation error:', error);
      }
    }
  };

  const handleLogoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverLogo(false);
  };

  const handleSignatureDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSignature(true);
  };

  const handleSignatureDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSignature(false);
  };

  const handleRtSignatureDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverRtSignature(true);
  };

  const handleRtSignatureDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverRtSignature(false);
  };

  const handleAttendantLogoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverAttendantLogo(true);
  };

  const handleAttendantLogoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverAttendantLogo(false);
  };

  const handleProfessionalInfoChange = (field: keyof ProfessionalSignatureInfo, value: string) => {
    setProfessionalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRtInfoChange = (field: keyof ProfessionalSignatureInfo, value: string) => {
    setRtInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfessionalInfo = () => {
    // Validate required fields when signature exists
    if (assets?.signatureData) {
      if (!professionalInfo.name.trim() || !professionalInfo.title.trim() || !professionalInfo.registry.trim()) {
        return;
      }
    }
    updateProfessionalInfo(professionalInfo);
  };

  const handleSaveRtInfo = () => {
    // Validate required fields when signature exists
    if (assets?.rtSignatureData) {
      if (!rtInfo.name.trim() || !rtInfo.title.trim() || !rtInfo.registry.trim()) {
        return;
      }
    }
    updateRtInfo(rtInfo);
  };

  const handleRemoveSignature = () => {
    removeSignature();
    setProfessionalInfo({
      name: '',
      title: '',
      registry: '',
    });
  };

  const handleRemoveRtSignature = () => {
    removeRtSignature();
    setRtInfo({
      name: '',
      title: '',
      registry: '',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileSizeFromBase64 = (base64: string) => {
    // Remove data URL prefix and calculate size
    const base64Data = base64.split(',')[1] || base64;
    const bytes = (base64Data.length * 3) / 4;
    return bytes;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Assets para Documentos</h2>
        <p className="text-muted-foreground mt-1">
          Configure logo e assinatura que serão incluídos automaticamente nos documentos enviados via n8n
        </p>
      </div>

      {(isUploading || isSaving) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" />
            {isUploading ? 'Fazendo upload...' : 'Salvando...'}
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Logo da Clínica
            </CardTitle>
            <CardDescription>
              Upload do logo que será incluído nos documentos (JPG, JPEG, PNG - máx. 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assets?.logoData ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={assets.logoData}
                    alt="Logo"
                    className="w-full h-32 object-contain bg-gray-50 rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <img
                          src={assets.logoData}
                          alt="Logo - Visualização"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tamanho: {formatFileSize(getFileSizeFromBase64(assets.logoData))}
                </div>
                <div className="flex gap-2">
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={() => logoInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Substituir
                    </Button>
                  </ActionButtonGuard>
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={removeLogo}
                      variant="destructive"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </ActionButtonGuard>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOverLogo 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => logoInputRef.current?.click()}
                  onDrop={handleLogoDrop}
                  onDragOver={handleLogoDragOver}
                  onDragLeave={handleLogoDragLeave}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique ou arraste o logo aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, JPEG, PNG - máximo 10MB
                  </p>
                </div>
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full"
                  disabled={isUploading || isSaving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Logo
                </Button>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Signature Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Assinatura Digital
            </CardTitle>
            <CardDescription>
              Upload da assinatura e informações do profissional (JPG, JPEG, PNG - máx. 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {assets?.signatureData ? (
                <div className="relative group">
                  <img
                    src={assets.signatureData}
                    alt="Assinatura"
                    className="w-full h-32 object-contain bg-gray-50 rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <img
                          src={assets.signatureData}
                          alt="Assinatura - Visualização"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOverSignature 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => signatureInputRef.current?.click()}
                  onDrop={handleSignatureDrop}
                  onDragOver={handleSignatureDragOver}
                  onDragLeave={handleSignatureDragLeave}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique ou arraste a assinatura aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, JPEG, PNG - máximo 10MB
                  </p>
                </div>
              )}

              {assets?.signatureData && (
                <div className="text-sm text-muted-foreground">
                  Tamanho: {formatFileSize(getFileSizeFromBase64(assets.signatureData))}
                </div>
              )}

              {/* Professional Info Form */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  <Label className="font-medium">Informações do Profissional</Label>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="professional-name" className="text-sm">Nome do Profissional *</Label>
                    <Input
                      id="professional-name"
                      value={professionalInfo.name}
                      onChange={(e) => handleProfessionalInfoChange('name', e.target.value)}
                      placeholder="Ex: JERIME REGO SOARES"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="professional-title" className="text-sm">Profissão/Especialidade *</Label>
                    <Input
                      id="professional-title"
                      value={professionalInfo.title}
                      onChange={(e) => handleProfessionalInfoChange('title', e.target.value)}
                      placeholder="Ex: Enfermeiro Especialista"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="professional-registry" className="text-sm">Órgão de Classe/Registro *</Label>
                    <Input
                      id="professional-registry"
                      value={professionalInfo.registry}
                      onChange={(e) => handleProfessionalInfoChange('registry', e.target.value)}
                      placeholder="Ex: Coren-502061"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={handleSaveProfessionalInfo}
                      size="sm"
                      className="w-full"
                      disabled={isUploading || isSaving || !professionalInfo.name.trim() || !professionalInfo.title.trim() || !professionalInfo.registry.trim()}
                    >
                      Salvar Informações
                    </Button>
                  </ActionButtonGuard>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <ActionButtonGuard permission="configuracoes">
                  <Button
                    onClick={() => signatureInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    disabled={isUploading || isSaving}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {assets?.signatureData ? 'Substituir Assinatura' : 'Selecionar Assinatura'}
                  </Button>
                </ActionButtonGuard>
                {assets?.signatureData && (
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={handleRemoveSignature}
                      variant="destructive"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Tudo
                    </Button>
                  </ActionButtonGuard>
                )}
              </div>
            </div>
            <input
              ref={signatureInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
              onChange={handleSignatureUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* RT Signature Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Assinatura Digital RT
            </CardTitle>
            <CardDescription>
              Upload da assinatura e informações do Responsável Técnico (JPG, JPEG, PNG - máx. 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {assets?.rtSignatureData ? (
                <div className="relative group">
                  <img
                    src={assets.rtSignatureData}
                    alt="Assinatura RT"
                    className="w-full h-32 object-contain bg-gray-50 rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <img
                          src={assets.rtSignatureData}
                          alt="Assinatura RT - Visualização"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOverRtSignature 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => rtSignatureInputRef.current?.click()}
                  onDrop={handleRtSignatureDrop}
                  onDragOver={handleRtSignatureDragOver}
                  onDragLeave={handleRtSignatureDragLeave}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique ou arraste a assinatura do RT aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, JPEG, PNG - máximo 10MB
                  </p>
                </div>
              )}

              {assets?.rtSignatureData && (
                <div className="text-sm text-muted-foreground">
                  Tamanho: {formatFileSize(getFileSizeFromBase64(assets.rtSignatureData))}
                </div>
              )}

              {/* RT Info Form */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  <Label className="font-medium">Informações do Responsável Técnico</Label>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rt-name" className="text-sm">Nome do RT *</Label>
                    <Input
                      id="rt-name"
                      value={rtInfo.name}
                      onChange={(e) => handleRtInfoChange('name', e.target.value)}
                      placeholder="Ex: NOME DO RT"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rt-title" className="text-sm">Profissão/Especialidade *</Label>
                    <Input
                      id="rt-title"
                      value={rtInfo.title}
                      onChange={(e) => handleRtInfoChange('title', e.target.value)}
                      placeholder="Ex: Enfermeiro Responsável"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rt-registry" className="text-sm">Órgão de Classe/Registro *</Label>
                    <Input
                      id="rt-registry"
                      value={rtInfo.registry}
                      onChange={(e) => handleRtInfoChange('registry', e.target.value)}
                      placeholder="Ex: Coren-000000"
                      className="mt-1"
                      disabled={isUploading || isSaving}
                    />
                  </div>
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={handleSaveRtInfo}
                      size="sm"
                      className="w-full"
                      disabled={isUploading || isSaving || !rtInfo.name.trim() || !rtInfo.title.trim() || !rtInfo.registry.trim()}
                    >
                      Salvar Informações do RT
                    </Button>
                  </ActionButtonGuard>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <ActionButtonGuard permission="configuracoes">
                  <Button
                    onClick={() => rtSignatureInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    disabled={isUploading || isSaving}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {assets?.rtSignatureData ? 'Substituir Assinatura RT' : 'Selecionar Assinatura RT'}
                  </Button>
                </ActionButtonGuard>
                {assets?.rtSignatureData && (
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={handleRemoveRtSignature}
                      variant="destructive"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Tudo RT
                    </Button>
                  </ActionButtonGuard>
                )}
              </div>
            </div>
            <input
              ref={rtSignatureInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
              onChange={handleRtSignatureUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Attendant Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Logo do Atendente
            </CardTitle>
            <CardDescription>
              Upload do logo do atendente que será incluído nos documentos (JPG, JPEG, PNG - máx. 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendantLogoData ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={attendantLogoData}
                    alt="Logo do Atendente"
                    className="w-full h-32 object-contain bg-gray-50 rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <img
                          src={attendantLogoData}
                          alt="Logo do Atendente - Visualização"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tamanho: {formatFileSize(getFileSizeFromBase64(attendantLogoData))}
                </div>
                <div className="flex gap-2">
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={() => attendantLogoInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Substituir
                    </Button>
                  </ActionButtonGuard>
                  <ActionButtonGuard permission="configuracoes">
                    <Button
                      onClick={removeAttendantLogo}
                      variant="destructive"
                      size="sm"
                      disabled={isUploading || isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </ActionButtonGuard>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOverAttendantLogo 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => attendantLogoInputRef.current?.click()}
                  onDrop={handleAttendantLogoDrop}
                  onDragOver={handleAttendantLogoDragOver}
                  onDragLeave={handleAttendantLogoDragLeave}
                >
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique ou arraste o logo do atendente aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, JPEG, PNG - máximo 10MB
                  </p>
                </div>
                <Button
                  onClick={() => attendantLogoInputRef.current?.click()}
                  className="w-full"
                  disabled={isUploading || isSaving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Logo do Atendente
                </Button>
              </div>
            )}
            <input
              ref={attendantLogoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
              onChange={handleAttendantLogoUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Como funciona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• O logo da clínica, assinatura e logo do atendente serão incluídos automaticamente em todos os documentos enviados via n8n</li>
          <li>• Use imagens JPG, JPEG ou PNG com fundo transparente para melhor resultado</li>
          <li>• Recomendamos logo com largura máxima de 200px e assinatura com altura máxima de 100px</li>
          <li>• As informações do profissional são obrigatórias quando há assinatura e serão enviadas junto com a imagem</li>
          <li>• O logo do atendente é opcional e pode ser usado para personalizar documentos específicos</li>
          <li>• Os assets são armazenados em base64 e enviados junto com os dados dos documentos</li>
          <li>• Suporte para arrastar e soltar arquivos para facilitar o upload</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentAssetsUploader;
