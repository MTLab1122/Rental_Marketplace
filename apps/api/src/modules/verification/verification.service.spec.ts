import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { VerificationStatus, NotificationType } from '@rental-peshawar/shared-types';
import { normalizeCnic, maskCnic, hashCnic, encryptCnic, decryptCnic } from './cnic.util';

describe('VerificationService', () => {
  let service: VerificationService;

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const recordId = 'rec-1111-1111';
  const rawCnic = '1730112345671';
  const normalizedCnic = '17301-1234567-1';
  const maskedCnic = '17301-*******-1';

  const mockRecord = {
    id: recordId,
    userId,
    fullName: 'Ahmad Khan',
    phoneNumber: '+923001234567',
    cnicNumberMasked: maskedCnic,
    status: VerificationStatus.PENDING,
    address: 'Phase 5, Hayatabad, Peshawar',
    reviewNotes: null,
    verifiedAt: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    verificationRecord: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    landlordProfile: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('peshawar_dev_jwt_access_secret_super_secure_minimum_32_chars'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  describe('CNIC Utilities', () => {
    it('normalizes 13-digit raw string to formatted CNIC', () => {
      expect(normalizeCnic('1730112345671')).toBe(normalizedCnic);
      expect(normalizeCnic('17301-1234567-1')).toBe(normalizedCnic);
    });

    it('masks CNIC protecting middle 7 digits', () => {
      expect(maskCnic(normalizedCnic)).toBe(maskedCnic);
    });

    it('hashes CNIC deterministically with SHA-256', () => {
      const hash1 = hashCnic(normalizedCnic);
      const hash2 = hashCnic(normalizedCnic);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('encrypts and decrypts CNIC with AES-256-GCM', () => {
      const key = '12345678901234567890123456789012';
      const encrypted = encryptCnic(normalizedCnic, key);
      const decrypted = decryptCnic(encrypted, key);
      expect(decrypted).toBe(normalizedCnic);
    });
  });

  describe('submitVerification', () => {
    it('rejects duplicate CNIC if already verified for another account', async () => {
      mockPrismaService.verificationRecord.findFirst.mockResolvedValue({
        id: 'existing-rec',
        userId: otherUserId,
        status: VerificationStatus.VERIFIED,
      });

      await expect(
        service.submitVerification(userId, {
          fullName: 'Ahmad Khan',
          phoneNumber: '+923001234567',
          cnicNumber: rawCnic,
          cnicFrontStorageKey: 'verifications/cnic-front.jpg',
          cnicBackStorageKey: 'verifications/cnic-back.jpg',
          selfieStorageKey: 'verifications/selfie.jpg',
          address: 'Hayatabad, Peshawar',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates verification record and updates landlord profile', async () => {
      mockPrismaService.verificationRecord.findFirst
        .mockResolvedValueOnce(null) // no duplicate
        .mockResolvedValueOnce(null); // no existing record for this user

      mockPrismaService.verificationRecord.create.mockResolvedValue(mockRecord);

      const res = await service.submitVerification(userId, {
        fullName: 'Ahmad Khan',
        phoneNumber: '+923001234567',
        cnicNumber: rawCnic,
        cnicFrontStorageKey: 'verifications/cnic-front.jpg',
        cnicBackStorageKey: 'verifications/cnic-back.jpg',
        selfieStorageKey: 'verifications/selfie.jpg',
        address: 'Hayatabad, Peshawar',
      });

      expect(res.status).toBe(VerificationStatus.PENDING);
      expect(res.cnicNumberMasked).toBe(maskedCnic);
      expect(mockPrismaService.landlordProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            cnicNumber: maskedCnic,
            isCnicVerified: false,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'landlord:submit_verification' }),
      );
    });
  });

  describe('getLandlordVerification', () => {
    it('returns UNVERIFIED if no record found', async () => {
      mockPrismaService.verificationRecord.findFirst.mockResolvedValue(null);

      const res = await service.getLandlordVerification(userId);
      expect(res.status).toBe(VerificationStatus.UNVERIFIED);
    });

    it('returns masked verification info when record exists', async () => {
      mockPrismaService.verificationRecord.findFirst.mockResolvedValue(mockRecord);

      const res = await service.getLandlordVerification(userId);
      expect(res.status).toBe(VerificationStatus.PENDING);
      expect(res.cnicNumberMasked).toBe(maskedCnic);
    });
  });

  describe('reviewVerification', () => {
    it('admin approves verification, activates landlord isVerified and dispatches notification', async () => {
      mockPrismaService.verificationRecord.findUnique.mockResolvedValue(mockRecord);
      mockPrismaService.verificationRecord.update.mockResolvedValue({
        ...mockRecord,
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      });

      const res = await service.reviewVerification(recordId, 'admin-1', {
        status: VerificationStatus.VERIFIED,
      });

      expect(res.status).toBe(VerificationStatus.VERIFIED);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isVerified: true },
      });
      expect(mockPrismaService.landlordProfile.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isCnicVerified: true },
      });
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        userId,
        NotificationType.SYSTEM,
        expect.stringContaining('Approved'),
        expect.any(String),
        expect.objectContaining({ status: VerificationStatus.VERIFIED }),
      );
    });

    it('admin rejects verification and notifies landlord with reason', async () => {
      mockPrismaService.verificationRecord.findUnique.mockResolvedValue(mockRecord);
      mockPrismaService.verificationRecord.update.mockResolvedValue({
        ...mockRecord,
        status: VerificationStatus.REJECTED,
        reviewNotes: 'CNIC back image is illegible',
      });

      const res = await service.reviewVerification(recordId, 'admin-1', {
        status: VerificationStatus.REJECTED,
        reviewNotes: 'CNIC back image is illegible',
      });

      expect(res.status).toBe(VerificationStatus.REJECTED);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isVerified: false },
      });
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        userId,
        NotificationType.SYSTEM,
        expect.any(String),
        expect.stringContaining('CNIC back image is illegible'),
        expect.objectContaining({ status: VerificationStatus.REJECTED }),
      );
    });
  });
});
