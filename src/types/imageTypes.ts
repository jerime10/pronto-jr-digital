
export interface ImageData {
  id: string;
  base64: string;
  description: string;
  filename: string;
  size: number;
  type: string;
}

export interface ImageUploadError {
  file: string;
  message: string;
}

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
export const MAX_DESCRIPTION_LENGTH = 100;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
