import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MEDIA_STORAGE_SERVICE, MediaStorageService } from './storage/media-storage.interface';
import {
  GetUploadUrlRequestDto,
  CompleteUploadRequestDto,
  ModerateImageRequestDto,
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_PROPERTY_IMAGES,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
} from './dto/media.dto';
import { ErrorCode, ImageModerationStatus } from '@rental-peshawar/shared-types';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(MEDIA_STORAGE_SERVICE)
    private readonly storageService: MediaStorageService,
  ) {}

  /**
   * Generates a secure, short-lived signed upload URL.
   */
  async getUploadUrl(userId: string, dto: GetUploadUrlRequestDto, userRoles: string[] = []) {
    // 1. Validate MIME type
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(dto.mimeType)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: `Unsupported media format: '${dto.mimeType}'. Allowed formats: JPEG, PNG, WEBP.`,
      });
    }

    // 2. Validate max file size (8 MB)
    if (dto.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new UnprocessableEntityException({
        code: ErrorCode.FILE_TOO_LARGE,
        message: `File size exceeds the 8 MB maximum limit. Received: ${(dto.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB.`,
      });
    }

    // 3. If for property, enforce ownership and max 12 images
    if (dto.purpose === 'property_image') {
      if (!dto.propertyId) {
        throw new UnprocessableEntityException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'propertyId is required when purpose is property_image',
        });
      }

      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, deletedAt: null },
      });

      if (!property) {
        throw new NotFoundException(`Property with ID '${dto.propertyId}' not found.`);
      }

      const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
      if (property.landlordId !== userId && !isAdmin) {
        throw new ForbiddenException(
          'You do not have permission to upload images for this property.',
        );
      }

      const currentImageCount = await this.prisma.propertyImage.count({
        where: { propertyId: dto.propertyId },
      });

      if (currentImageCount >= MAX_PROPERTY_IMAGES) {
        throw new UnprocessableEntityException({
          code: ErrorCode.IMAGE_LIMIT_EXCEEDED,
          message: `Property already has reached the maximum allowed limit of ${MAX_PROPERTY_IMAGES} images.`,
        });
      }
    }

    // 4. Generate signed upload URL from configured storage adapter
    const uploadResult = await this.storageService.getSignedUploadUrl({
      purpose: dto.purpose,
      mimeType: dto.mimeType,
      fileSizeBytes: dto.fileSizeBytes,
      propertyId: dto.propertyId,
      userId,
    });

    this.logger.log(
      `Signed upload URL issued for user ${userId}, purpose: ${dto.purpose}, key: ${uploadResult.storageKey}`,
    );
    return uploadResult;
  }

  /**
   * Finalizes an uploaded image and stores verified metadata in the database.
   */
  async completeUpload(userId: string, dto: CompleteUploadRequestDto, userRoles: string[] = []) {
    // 1. Validate MIME type
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(dto.mimeType)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: `Unsupported media format: '${dto.mimeType}'. Allowed formats: JPEG, PNG, WEBP.`,
      });
    }

    // 2. Validate file size
    if (dto.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new UnprocessableEntityException({
        code: ErrorCode.FILE_TOO_LARGE,
        message: 'File size exceeds maximum allowed limit of 8 MB.',
      });
    }

    // 3. Validate image dimensions if specified
    if (dto.width !== undefined && dto.height !== undefined) {
      if (dto.width < MIN_IMAGE_WIDTH || dto.height < MIN_IMAGE_HEIGHT) {
        throw new UnprocessableEntityException({
          code: ErrorCode.IMAGE_DIMENSIONS_TOO_SMALL,
          message: `Image dimensions (${dto.width}x${dto.height}) must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels.`,
        });
      }
    }

    const publicUrl = this.storageService.getPublicUrl(dto.storageKey);
    const thumbnailUrl = this.storageService.getThumbnailUrl(dto.storageKey);

    // If property image, save to property_images table
    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, deletedAt: null },
      });

      if (!property) {
        throw new NotFoundException(`Property with ID '${dto.propertyId}' not found.`);
      }

      const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
      if (property.landlordId !== userId && !isAdmin) {
        throw new ForbiddenException(
          'You do not have permission to attach images to this property.',
        );
      }

      const count = await this.prisma.propertyImage.count({
        where: { propertyId: dto.propertyId },
      });

      if (count >= MAX_PROPERTY_IMAGES) {
        throw new UnprocessableEntityException({
          code: ErrorCode.IMAGE_LIMIT_EXCEEDED,
          message: `Property already has reached maximum limit of ${MAX_PROPERTY_IMAGES} images.`,
        });
      }

      const image = await this.prisma.propertyImage.create({
        data: {
          propertyId: dto.propertyId,
          url: publicUrl,
          thumbnailUrl,
          storageKey: dto.storageKey,
          caption: dto.caption || null,
          isPrimary: dto.isPrimary ?? count === 0,
          sortOrder: dto.sortOrder ?? count,
          moderationStatus: ImageModerationStatus.PENDING,
          mimeType: dto.mimeType,
          fileSizeBytes: dto.fileSizeBytes,
          width: dto.width || null,
          height: dto.height || null,
          checksum: dto.checksum || null,
        },
      });

      await this.auditService.log({
        actorId: userId,
        action: 'media:upload_complete',
        targetType: 'property_image',
        targetId: image.id,
        after: { propertyId: image.propertyId, storageKey: image.storageKey },
      });

      return image;
    }

    // For non-property documents (e.g. CNIC or selfie)
    return {
      storageKey: dto.storageKey,
      url: publicUrl,
      thumbnailUrl,
      fileSizeBytes: dto.fileSizeBytes,
      mimeType: dto.mimeType,
    };
  }

  /**
   * Deletes a media image from the database and storage adapter.
   */
  async deleteMedia(userId: string, imageId: string, userRoles: string[] = []) {
    const image = await this.prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: true },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found.`);
    }

    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
    if (image.property.landlordId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this image.');
    }

    await this.prisma.propertyImage.delete({
      where: { id: imageId },
    });

    if (image.storageKey) {
      await this.storageService.deleteFile(image.storageKey);
    }

    await this.auditService.log({
      actorId: userId,
      action: 'media:delete',
      targetType: 'property_image',
      targetId: imageId,
      before: { propertyId: image.propertyId, storageKey: image.storageKey },
    });

    return { success: true, message: 'Image deleted successfully.' };
  }

  /**
   * Admin: Moderate an image (approve or reject with reason)
   */
  async moderateImage(imageId: string, adminId: string, dto: ModerateImageRequestDto) {
    const image = await this.prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found.`);
    }

    const updated = await this.prisma.propertyImage.update({
      where: { id: imageId },
      data: {
        moderationStatus: dto.status as ImageModerationStatus,
        rejectionReason:
          dto.status === 'REJECTED'
            ? dto.rejectionReason || 'Image rejected by administrator'
            : null,
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: `media:moderate_${dto.status.toLowerCase()}`,
      targetType: 'property_image',
      targetId: imageId,
      before: { moderationStatus: image.moderationStatus },
      after: {
        moderationStatus: updated.moderationStatus,
        rejectionReason: updated.rejectionReason,
      },
    });

    return updated;
  }
}
