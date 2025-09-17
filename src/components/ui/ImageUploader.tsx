import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageChange,
  placeholder = 'AT',
  size = 'md',
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Apenas arquivos JPG, JPEG e PNG são permitidos');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo permitido: 5MB');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      validateFile(file);
      
      const base64 = await convertToBase64(file);
      onImageChange(base64);
      
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Clear input to allow re-upload of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && !disabled) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    toast.success('Imagem removida');
  };

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative ${sizeClasses[size]} cursor-pointer`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileInput}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors`}>
          {currentImage ? (
            <AvatarImage src={currentImage} alt="Imagem do usuário" />
          ) : (
            <AvatarFallback className="text-2xl bg-gray-100">
              {isUploading ? (
                <Upload className="w-6 h-6 animate-pulse" />
              ) : (
                placeholder
              )}
            </AvatarFallback>
          )}
        </Avatar>
        
        {currentImage && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {currentImage ? 'Alterar foto' : 'Adicionar foto'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          JPG, JPEG ou PNG até 5MB
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;