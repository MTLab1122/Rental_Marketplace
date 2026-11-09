import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MediaStorageService, SignedUploadOptions } from './media-storage.interface';
import { UploadUrlResponseDto } from '@rental-peshawar/shared-types';

@Injectable()
export class S3StorageAdapter implements MediaStorageService {
  readonly providerName = 's3';
  private readonly logger = new Logger(S3StorageAdapter.name);

  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'peshawar-rental-media';
    this.region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    this.accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') || 'minioadmin';
    this.secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') || 'minioadmin123';
  }

  private hmac(key: string | Buffer, string: string): Buffer {
    return crypto.createHmac('sha256', key).update(string).digest();
  }

  private getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ): Buffer {
    const kDate = this.hmac('AWS4' + key, dateStamp);
    const kRegion = this.hmac(kDate, regionName);
    const kService = this.hmac(kRegion, serviceName);
    return this.hmac(kService, 'aws4_request');
  }

  async getSignedUploadUrl(options: SignedUploadOptions): Promise<UploadUrlResponseDto> {
    const ext = options.mimeType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');

    const storageKey =
      options.purpose === 'property_image'
        ? `properties/${options.propertyId || options.userId}/${timestamp}-${random}.${ext}`
        : `verifications/${options.userId}/${options.purpose}-${timestamp}-${random}.${ext}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const expiresInSeconds = 900; // 15 minutes

    const host = new URL(this.endpoint).host;
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key]!)}`)
      .join('&');

    const canonicalUri = `/${this.bucket}/${storageKey}`;
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3');
    const signature = this.hmac(signingKey, stringToSign).toString('hex');

    const uploadUrl = `${this.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    const publicUrl = this.getPublicUrl(storageKey);

    return {
      uploadUrl,
      method: 'PUT',
      storageKey,
      expiresInSeconds,
      headers: {
        'Content-Type': options.mimeType,
      },
      publicUrl,
    };
  }

  getPublicUrl(storageKey: string): string {
    const cleanEndpoint = this.endpoint.replace(/\/+$/, '');
    return `${cleanEndpoint}/${this.bucket}/${storageKey}`;
  }

  getThumbnailUrl(storageKey: string, width = 400, height = 300): string {
    const cleanEndpoint = this.endpoint.replace(/\/+$/, '');
    return `${cleanEndpoint}/${this.bucket}/${storageKey}?w=${width}&h=${height}&fit=crop`;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    this.logger.log(`Deleting file from S3: ${storageKey}`);
    return true;
  }
}
