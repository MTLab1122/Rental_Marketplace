import { Test, TestingModule } from '@nestjs/testing';
import { InquiryService } from './inquiry.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  PropertyStatus,
  PropertyEligibility,
  TenantType,
  InquiryStatus,
  NotificationType,
  ErrorCode,
} from '@rental-peshawar/shared-types';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('InquiryService', () => {
  let service: InquiryService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const landlordId = '22222222-2222-2222-2222-222222222222';
  const otherUserId = '33333333-3333-3333-3333-333333333333';
  const propertyId = '44444444-4444-4444-4444-444444444444';
  const inquiryId = '55555555-5555-5555-5555-555555555555';

  const mockProperty = {
    id: propertyId,
    landlordId,
    title: 'University Town Hostel Room',
    status: PropertyStatus.APPROVED,
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    deletedAt: null,
    inquiryCount: 0,
    landlord: { id: landlordId, fullName: 'Gul Khan' },
  };

  const mockInquiry = {
    id: inquiryId,
    propertyId,
    tenantId,
    landlordId,
    status: InquiryStatus.SUBMITTED,
    message: 'I am an engineering student at UOP interested in this room.',
    property: mockProperty,
    tenant: { id: tenantId, fullName: 'Ahmad Jan', email: 'ahmad@example.com' },
  };

  const mockPrismaService = {
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    inquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<InquiryService>(InquiryService);
  });

  describe('createInquiry', () => {
    it('throws NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(
        service.createInquiry(tenantId, {
          propertyId,
          message: 'Interested in this property',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('enforces segregation: Family tenant cannot inquire on STUDENTS_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      await expect(
        service.createInquiry(
          tenantId,
          { propertyId, message: 'Interested in studio' },
          { tenantType: TenantType.FAMILY },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects landlord inquiring on their own property with 422 CANNOT_INQUIRE_OWN_PROPERTY', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      await expect(
        service.createInquiry(landlordId, {
          propertyId,
          message: 'Can I view this?',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: ErrorCode.CANNOT_INQUIRE_OWN_PROPERTY,
          }),
        }),
      );
    });

    it('creates inquiry, notifies landlord, writes audit log, and increments inquiryCount', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.inquiry.create.mockResolvedValue(mockInquiry);

      const res = await service.createInquiry(
        tenantId,
        {
          propertyId,
          message: 'I am an engineering student at UOP interested in this room.',
        },
        { tenantType: TenantType.STUDENT },
      );

      expect(res.id).toBe(inquiryId);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        NotificationType.INQUIRY_RECEIVED,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ inquiryId, propertyId }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'inquiry:create' }),
      );
    });
  });

  describe('updateStatus', () => {
    it('throws ForbiddenException if unrelated user attempts status update', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);

      await expect(
        service.updateStatus(inquiryId, otherUserId, { status: InquiryStatus.REPLIED }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates status and dispatches notification to the tenant', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);
      mockPrismaService.inquiry.update.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.ACCEPTED,
      });

      const res = await service.updateStatus(inquiryId, landlordId, {
        status: InquiryStatus.ACCEPTED,
      });

      expect(res.status).toBe(InquiryStatus.ACCEPTED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        tenantId,
        NotificationType.INQUIRY_REPLIED,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ inquiryId, status: InquiryStatus.ACCEPTED }),
      );
    });
  });
});
