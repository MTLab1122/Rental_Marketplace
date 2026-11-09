import { UploadUrlResponseDto } from '@rental-peshawar/shared-types';

export interface SignedUploadOptions {
  purpose: 'property_image' | 'cnic_document' | 'selfie';
  mimeType: string;
  fileSizeBytes: number;
  propertyId?: string;
  userId: string;
}

export interface MediaStorageService {
  readonly providerName: string;

  getSignedUploadUrl(options: SignedUploadOptions): Promise<UploadUrlResponseDto>;

  getPublicUrl(storageKey: string): string;

  getThumbnailUrl(storageKey: string, width?: number, height?: number): string;

  deleteFile(storageKey: string): Promise<boolean>;
}

export const MEDIA_STORAGE_SERVICE = 'MEDIA_STORAGE_SERVICE';
