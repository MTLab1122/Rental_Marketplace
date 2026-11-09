import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsIn,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export const ALLOWED_MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_PROPERTY_IMAGES = 12;
export const MIN_IMAGE_WIDTH = 600;
export const MIN_IMAGE_HEIGHT = 400;

export class GetUploadUrlRequestDto {
  @IsString()
  @IsIn(['property_image', 'cnic_document', 'selfie'], {
    message: 'purpose must be one of: property_image, cnic_document, selfie',
  })
  purpose!: 'property_image' | 'cnic_document' | 'selfie';

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsNumber()
  @Min(1024, { message: 'File size must be at least 1 KB' })
  @Type(() => Number)
  fileSizeBytes!: number;
}

export class CompleteUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  width?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  height?: number;

  @IsNumber()
  @Type(() => Number)
  fileSizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsString()
  @IsOptional()
  checksum?: string;
}

export class ModerateImageRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'], {
    message: 'status must be either APPROVED or REJECTED',
  })
  status!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
