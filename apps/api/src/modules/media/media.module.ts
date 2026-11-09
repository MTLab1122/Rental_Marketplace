import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { AdminMediaController } from './admin-media.controller';
import { MEDIA_STORAGE_SERVICE } from './storage/media-storage.interface';
import { S3StorageAdapter } from './storage/s3-storage.adapter';
import { CloudinaryStorageAdapter } from './storage/cloudinary-storage.adapter';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  controllers: [MediaController, AdminMediaController],
  providers: [
    MediaService,
    AuditService,
    TokenService,
    S3StorageAdapter,
    CloudinaryStorageAdapter,
    {
      provide: MEDIA_STORAGE_SERVICE,
      useFactory: (
        config: ConfigService,
        s3Adapter: S3StorageAdapter,
        cloudinaryAdapter: CloudinaryStorageAdapter,
      ) => {
        const provider =
          config.get<string>('MEDIA_PROVIDER') || config.get<string>('STORAGE_PROVIDER') || 's3';
        return provider.toLowerCase() === 'cloudinary' ? cloudinaryAdapter : s3Adapter;
      },
      inject: [ConfigService, S3StorageAdapter, CloudinaryStorageAdapter],
    },
  ],
  exports: [MediaService, MEDIA_STORAGE_SERVICE],
})
export class MediaModule {}
