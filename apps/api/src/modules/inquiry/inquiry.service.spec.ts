import { Test, TestingModule } from '@nestjs/testing';
import { InquiryService } from './inquiry.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { ConversationService } from '../conversation/conversation.service';
import {
  PropertyStatus,
  PropertyEligibility,
  TenantType,
  InquiryStatus,
  NotificationType,
} from '@rental-peshawar/shared-types';
import {
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('InquiryService', () => {
  let service: InquiryService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const landlordId = '22222222-2222-2222-2222-222222222222';
  const otherUserId = '33333333-3333-3333-3333-333333333333';
  const propertyId = '44444444-4444-4444-4444-444444444444';
  const inquiryId = '55555555-5555-5555-5555-555555555555';
  const conversationId = '66666666-6666-6666-6666-666666666666';

  const mockProperty = {
    id: propertyId,
    landlordId,
    title: 'University Town Hostel Room',
    status: PropertyStatus.APPROVED,
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    isAvailable: true,
    deletedAt: null,
    inquiryCount: 0,
    locality: { id: 'loc-1', isActive: true },
    landlord: {
      id: landlordId,
      fullName: 'Gul Khan',
      phoneNumber: '03001234567',
      landlordProfile: { whatsappNumber: '03001234567', whatsappEnabled: true },
    },
  };

  const mockFamilyProperty = {
    ...mockProperty,
    id: 'prop-family-1',
    title: 'Hayatabad Phase 2 House',
    eligibility: PropertyEligibility.FAMILIES_ONLY,
  };

  const mockInquiry = {
    id: inquiryId,
    propertyId,
    tenantId,
    landlordId,
    status: InquiryStatus.SUBMITTED,
    message: 'I am an engineering student at UOP interested in this room.',
    proposedRentPkr: 16000,
    proposedMoveInDate: new Date('2026-03-01'),
    preferredContactMethod: 'IN_APP',
    property: mockProperty,
    tenant: {
      id: tenantId,
      fullName: 'Ahmad Jan',
      email: 'ahmad@example.com',
      phoneNumber: '03111234567',
    },
    landlord: mockProperty.landlord,
    conversation: { id: conversationId, isBlocked: false },
  };

  const mockPrismaService = {
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    inquiry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockRateLimiter = {
    enforceRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  };

  const mockConversationService = {
    createForInquiry: jest.fn().mockResolvedValue({ id: conversationId }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
        { provide: ConversationService, useValue: mockConversationService },
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
          { propertyId, message: 'Looking for a hostel room' },
          { tenantType: TenantType.FAMILY },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('enforces segregation: Student tenant cannot inquire on FAMILIES_ONLY property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockFamilyProperty);

      await expect(
        service.createInquiry(
          tenantId,
          { propertyId: 'prop-family-1', message: 'Looking for house' },
          { tenantType: TenantType.STUDENT },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('prevents landlord from inquiring on their own property', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      await expect(
        service.createInquiry(landlordId, {
          propertyId,
          message: 'Inquiring my own house',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('prevents duplicate active inquiries for the same property by the same tenant', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.inquiry.findFirst.mockResolvedValue(mockInquiry);

      await expect(
        service.createInquiry(
          tenantId,
          { propertyId, message: 'Repeated inquiry message' },
          { tenantType: TenantType.STUDENT },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('successfully creates inquiry, conversation, initial message, and notifies landlord', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.inquiry.findFirst.mockResolvedValue(null); // No existing active inquiry
      mockPrismaService.inquiry.create.mockResolvedValue(mockInquiry);
      mockPrismaService.property.update.mockResolvedValue({ ...mockProperty, inquiryCount: 1 });

      const result = await service.createInquiry(
        tenantId,
        {
          propertyId,
          message: 'I am an engineering student at UOP interested in this room.',
          proposedRentPkr: 16000,
        },
        { tenantType: TenantType.STUDENT },
      );

      expect(result.id).toBe(inquiryId);
      expect(result.conversationId).toBe(conversationId);
      expect(mockRateLimiter.enforceRateLimit).toHaveBeenCalledWith(
        'inquiry',
        tenantId,
        10,
        3600,
        expect.any(String),
      );
      expect(mockConversationService.createForInquiry).toHaveBeenCalledWith(
        inquiryId,
        propertyId,
        tenantId,
        landlordId,
      );
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        NotificationType.INQUIRY_RECEIVED,
        'New Property Inquiry',
        expect.any(String),
        expect.objectContaining({ inquiryId, propertyId, conversationId }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: tenantId,
          action: 'inquiry:create',
        }),
      );
    });
  });

  describe('updateStatusByLandlord', () => {
    it('throws ForbiddenException if a user other than property landlord attempts update', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);

      await expect(
        service.updateStatusByLandlord(inquiryId, otherUserId, {
          status: InquiryStatus.ACCEPTED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows landlord to accept inquiry and sends notification to tenant', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue(mockInquiry);
      mockPrismaService.inquiry.update.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.ACCEPTED,
      });

      const updated = await service.updateStatusByLandlord(inquiryId, landlordId, {
        status: InquiryStatus.ACCEPTED,
      });

      expect(updated.status).toBe(InquiryStatus.ACCEPTED);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        tenantId,
        NotificationType.INQUIRY_REPLIED,
        'Inquiry Status Update',
        expect.stringContaining('ACCEPTED'),
        expect.objectContaining({ inquiryId, status: InquiryStatus.ACCEPTED }),
      );
    });
  });

  describe('WhatsApp Contact Revelation Policy', () => {
    it('reveals WhatsApp URL when inquiry status is ACCEPTED', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.ACCEPTED,
      });

      const inquiry = await service.getInquiryById(inquiryId, tenantId, ['TENANT']);
      expect(inquiry.canContactWhatsapp).toBe(true);
      expect(inquiry.whatsappUrl).toContain('https://wa.me/923001234567');
    });

    it('hides WhatsApp URL when inquiry is still SUBMITTED and landlord disabled direct contact', async () => {
      mockPrismaService.inquiry.findUnique.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.SUBMITTED,
        landlord: {
          ...mockProperty.landlord,
          landlordProfile: { whatsappNumber: '03001234567', whatsappEnabled: false },
        },
      });

      const inquiry = await service.getInquiryById(inquiryId, tenantId, ['TENANT']);
      expect(inquiry.canContactWhatsapp).toBe(false);
      expect(inquiry.whatsappUrl).toBeNull();
    });
  });
});
