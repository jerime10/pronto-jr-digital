
export interface DocumentAsset {
  id: string;
  base64: string;
  filename: string;
  size: number;
  type: string;
}

export interface DocumentAssetError {
  file: string;
  message: string;
}

export const SUPPORTED_ASSET_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
export const MAX_ASSET_SIZE = 10 * 1024 * 1024; // 10MB
export const ASSET_TYPES = {
  LOGO: 'logo',
  SIGNATURE: 'signature'
} as const;

export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];
