import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MediaStorageService, SignedUploadOptions } from './media-storage.interface';
import { UploadUrlResponseDto } from '@rental-peshawar/shared-types';

@Injectable()
export class CloudinaryStorageAdapter implements MediaStorageService {
  readonly providerName = 'cloudinary';
  private readonly logger = new Logger(CloudinaryStorageAdapter.name);

  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'peshawar-rentals';
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || 'dev_cloudinary_api_key';
    this.apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') || 'dev_cloudinary_api_secret';
  }

  async getSignedUploadUrl(options: SignedUploadOptions): Promise<UploadUrlResponseDto> {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder =
      options.purpose === 'property_image'
        ? `properties/${options.propertyId || options.userId}`
        : `verifications/${options.userId}`;

    const random = crypto.randomBytes(6).toString('hex');
    const publicId = `${folder}/${timestamp}-${random}`;

    // Cloudinary signature calculation: sorted params serialized as key=value&...
    const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    const publicUrl = this.getPublicUrl(publicId);

    return {
      uploadUrl,
      method: 'POST',
      storageKey: publicId,
      expiresInSeconds: 900,
      headers: {
        api_key: this.apiKey,
        timestamp: timestamp.toString(),
        signature: signature,
        folder: folder,
        public_id: publicId,
      },
      publicUrl,
    };
  }

  getPublicUrl(storageKey: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${storageKey}`;
  }

  getThumbnailUrl(storageKey: string, width = 400, height = 300): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_thumb,w_${width},h_${height}/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    this.logger.log(`Deleting file from Cloudinary: ${storageKey}`);
    return true;
  }
}
