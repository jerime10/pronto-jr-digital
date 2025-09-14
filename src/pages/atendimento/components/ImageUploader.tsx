
import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ImageData, 
  ImageUploadError, 
  SUPPORTED_IMAGE_TYPES, 
  MAX_DESCRIPTION_LENGTH, 
  MAX_FILE_SIZE 
} from '@/types/imageTypes';

interface ImageUploaderProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
      return `Tipo de arquivo não suportado. Use apenas: ${SUPPORTED_IMAGE_TYPES.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const newImages: ImageData[] = [];
    const errors: ImageUploadError[] = [];

    for (const file of Array.from(files)) {
      const validationError = validateFile(file);
      
      if (validationError) {
        errors.push({ file: file.name, message: validationError });
        continue;
      }

      try {
        const base64 = await convertToBase64(file);
        const imageData: ImageData = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          base64,
          description: '',
          filename: file.name,
          size: file.size,
          type: file.type
        };
        newImages.push(imageData);
      } catch (error) {
        errors.push({ 
          file: file.name, 
          message: 'Erro ao processar arquivo' 
        });
      }
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(`${error.file}: ${error.message}`);
      });
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) adicionada(s) com sucesso!`);
    }

    setIsUploading(false);
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const updateImageDescription = (imageId: string, description: string) => {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`);
      return;
    }

    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, description } : img
    );
    onImagesChange(updatedImages);
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
    toast.success('Imagem removida com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload de Imagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {isUploading ? 'Processando imagens...' : 'Clique ou arraste imagens aqui'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos suportados: JPG, JPEG, PNG (máx. 10MB cada)
            </p>
            <Button variant="outline" disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Selecionar Arquivos'}
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept={SUPPORTED_IMAGE_TYPES.join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Images Preview and Description */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imagens Anexadas ({images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={image.base64}
                        alt={image.filename}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                    
                    {/* Image Details and Description */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{image.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(image.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${image.id}`}>
                          Descrição da Imagem *
                        </Label>
                        <div className="relative">
                          <Textarea
                            id={`desc-${image.id}`}
                            placeholder="Descreva esta imagem... (obrigatório)"
                            value={image.description}
                            onChange={(e) => updateImageDescription(image.id, e.target.value)}
                            className={`resize-none ${
                              image.description.length > MAX_DESCRIPTION_LENGTH 
                                ? 'border-red-500 focus:border-red-500' 
                                : ''
                            }`}
                            rows={2}
                          />
                          <div className={`text-xs mt-1 flex items-center justify-between ${
                            image.description.length > MAX_DESCRIPTION_LENGTH 
                              ? 'text-red-500' 
                              : 'text-gray-500'
                          }`}>
                            <span>
                              {image.description.length > MAX_DESCRIPTION_LENGTH && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Limite excedido!
                                </span>
                              )}
                            </span>
                            <span>
                              {image.description.length}/{MAX_DESCRIPTION_LENGTH}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
