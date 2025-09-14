
import React from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageData } from '@/types/imageTypes';

interface ImageUploadTabProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
}

export const ImageUploadTab: React.FC<ImageUploadTabProps> = ({
  images,
  onImagesChange
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Anexar Imagens ao Atendimento</h3>
        <p className="text-sm text-gray-600">
          Adicione imagens relevantes ao atendimento (opcional). Cada imagem deve ter uma descrição.
        </p>
      </div>
      
      <ImageUploader 
        images={images}
        onImagesChange={onImagesChange}
      />
    </div>
  );
};
