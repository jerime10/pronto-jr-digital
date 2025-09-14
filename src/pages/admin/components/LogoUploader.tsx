
import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface LogoUploaderProps {
  logoUrl: string | null;
  onLogoChange: (file: File | null, previewUrl: string | null) => void;
  uploadProgress: number;
  isUploading: boolean;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ 
  logoUrl, 
  onLogoChange, 
  uploadProgress, 
  isUploading 
}) => {
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.includes('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('O arquivo é muito grande. O tamanho máximo é 2MB.');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        setPreviewLogo(previewUrl);
        onLogoChange(file, previewUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="logo">Logo do Sistema</Label>
      <div className="flex items-center gap-4">
        <div className="border rounded-md w-32 h-32 flex items-center justify-center overflow-hidden bg-gray-50">
          {(previewLogo || logoUrl) ? (
            <div className="w-full h-full">
              <AspectRatio ratio={1/1} className="bg-muted">
                <img 
                  src={previewLogo || logoUrl || ''} 
                  alt="Logo preview" 
                  className="object-contain w-full h-full"
                />
              </AspectRatio>
            </div>
          ) : (
            <span className="text-gray-400">Sem logo</span>
          )}
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500">
            Formatos suportados: JPG, PNG, SVG. Tamanho máximo: 2MB.
          </p>
        </div>
      </div>
      
      {isUploading && uploadProgress > 0 && (
        <div className="w-full mt-2">
          <Progress value={uploadProgress} className="h-2.5" />
          <p className="text-xs text-gray-500 mt-1">
            Enviando... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
