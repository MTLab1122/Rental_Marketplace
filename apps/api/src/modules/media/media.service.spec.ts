import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MEDIA_STORAGE_SERVICE } from './storage/media-storage.interface';
import { ErrorCode, ImageModerationStatus } from '@rental-peshawar/shared-types';
import { ForbiddenException } from '@nestjs/common';

describe('MediaService', () => {
  let service: MediaService;

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const propertyId = '33333333-3333-3333-3333-333333333333';
  const imageId = '44444444-4444-4444-4444-444444444444';

  const mockProperty = {
    id: propertyId,
    landlordId: userId,
    title: 'Hayatabad Modern Apartment',
  };

  const mockImage = {
    id: imageId,
    propertyId,
    url: 'https://storage.rental-peshawar.pk/properties/p1.jpg',
    storageKey: 'properties/p1.jpg',
    moderationStatus: ImageModerationStatus.PENDING,
    property: mockProperty,
  };

  const mockPrismaService = {
    property: {
      findFirst: jest.fn(),
    },
    propertyImage: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockStorageService = {
    getSignedUploadUrl: jest.fn().mockResolvedValue({
      uploadUrl: 'https://s3.peshawar.mock/upload?signature=xyz',
      method: 'PUT',
      storageKey: 'properties/img-123.jpg',
      expiresInSeconds: 900,
    }),
    getPublicUrl: jest.fn((key) => `https://cdn.rental-peshawar.pk/${key}`),
    getThumbnailUrl: jest.fn((key) => `https://cdn.rental-peshawar.pk/${key}?w=300`),
    deleteFile: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: MEDIA_STORAGE_SERVICE, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('getUploadUrl', () => {
    it('rejects unsupported MIME types with 422 INVALID_FILE_TYPE', async () => {
      await expect(
        service.getUploadUrl(userId, {
          purpose: 'property_image',
          propertyId,
          mimeType: 'application/pdf',
          fileSizeBytes: 1024 * 500,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.INVALID_FILE_TYPE,
          }),
        }),
      );
    });

    it('rejects files larger than 8MB with 422 FILE_TOO_LARGE', async () => {
      await expect(
        service.getUploadUrl(userId, {
          purpose: 'property_image',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 9 * 1024 * 1024, // 9 MB
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.FILE_TOO_LARGE,
          }),
        }),
      );
    });

    it('throws ForbiddenException if non-owner non-admin requests upload URL', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      await expect(
        service.getUploadUrl(otherUserId, {
          purpose: 'property_image',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when property reaches maximum limit of 12 images', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.propertyImage.count.mockResolvedValue(12);

      await expect(
        service.getUploadUrl(userId, {
          purpose: 'property_image',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.IMAGE_LIMIT_EXCEEDED,
          }),
        }),
      );
    });

    it('returns signed upload URL on valid request', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.propertyImage.count.mockResolvedValue(3);

      const res = await service.getUploadUrl(userId, {
        purpose: 'property_image',
        propertyId,
        mimeType: 'image/png',
        fileSizeBytes: 2 * 1024 * 1024,
      });

      expect(res.uploadUrl).toBeDefined();
      expect(res.storageKey).toBe('properties/img-123.jpg');
    });
  });

  describe('completeUpload', () => {
    it('rejects dimensions smaller than 600x400 with 422 IMAGE_DIMENSIONS_TOO_SMALL', async () => {
      await expect(
        service.completeUpload(userId, {
          storageKey: 'properties/test.jpg',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 500000,
          width: 500,
          height: 350,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.IMAGE_DIMENSIONS_TOO_SMALL,
          }),
        }),
      );
    });

    it('successfully stores property image metadata in PENDING moderation status', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.propertyImage.count.mockResolvedValue(0);
      mockPrismaService.propertyImage.create.mockResolvedValue({
        id: imageId,
        propertyId,
        url: 'https://cdn.rental-peshawar.pk/properties/test.jpg',
        isPrimary: true,
        moderationStatus: ImageModerationStatus.PENDING,
      });

      const res = await service.completeUpload(userId, {
        storageKey: 'properties/test.jpg',
        propertyId,
        mimeType: 'image/jpeg',
        fileSizeBytes: 500000,
        width: 1200,
        height: 800,
      });

      expect(res).toBeDefined();
      expect(mockPrismaService.propertyImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPrimary: true,
            moderationStatus: ImageModerationStatus.PENDING,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('deleteMedia', () => {
    it('throws ForbiddenException if non-owner non-admin deletes image', async () => {
      mockPrismaService.propertyImage.findUnique.mockResolvedValue(mockImage);

      await expect(service.deleteMedia(otherUserId, imageId)).rejects.toThrow(ForbiddenException);
    });

    it('deletes image and calls storage delete when authorized', async () => {
      mockPrismaService.propertyImage.findUnique.mockResolvedValue(mockImage);
      mockPrismaService.propertyImage.delete.mockResolvedValue(mockImage);

      const res = await service.deleteMedia(userId, imageId);
      expect(res.success).toBe(true);
      expect(mockPrismaService.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: imageId },
      });
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('properties/p1.jpg');
    });
  });

  describe('moderateImage', () => {
    it('admin approves image', async () => {
      mockPrismaService.propertyImage.findUnique.mockResolvedValue(mockImage);
      mockPrismaService.propertyImage.update.mockResolvedValue({
        ...mockImage,
        moderationStatus: ImageModerationStatus.APPROVED,
      });

      const res = await service.moderateImage(imageId, 'admin-1', {
        status: ImageModerationStatus.APPROVED,
      });

      expect(res.moderationStatus).toBe(ImageModerationStatus.APPROVED);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'media:moderate_approved' }),
      );
    });

    it('admin rejects image with reason', async () => {
      mockPrismaService.propertyImage.findUnique.mockResolvedValue(mockImage);
      mockPrismaService.propertyImage.update.mockResolvedValue({
        ...mockImage,
        moderationStatus: ImageModerationStatus.REJECTED,
        rejectionReason: 'Blurry photo containing contact phone number watermark',
      });

      const res = await service.moderateImage(imageId, 'admin-1', {
        status: ImageModerationStatus.REJECTED,
        rejectionReason: 'Blurry photo containing contact phone number watermark',
      });

      expect(res.moderationStatus).toBe(ImageModerationStatus.REJECTED);
      expect(res.rejectionReason).toContain('Blurry photo');
    });
  });
});
