import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../../database/prisma.service';
import { TicketCategory, TicketPriority, TicketStatus } from '@rental-peshawar/shared-types';
import { PropertyStatus } from '@prisma/client';

describe('SupportService (Phase 10 Support & Trust Operations)', () => {
  let service: SupportService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          fullName: 'Tariq Mehmood',
          email: 'tariq@peshawar.pk',
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      property: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  describe('createTicket', () => {
    it('creates support ticket with OPEN status and SLA message', async () => {
      const res = await service.createTicket('user-1', {
        subject: 'Dispute over security deposit refund',
        category: TicketCategory.DISPUTE,
        priority: TicketPriority.HIGH,
        description: 'Landlord is withholding deposit without justification.',
      });

      expect(res.ticketId).toMatch(/^TICK-/);
      expect(res.status).toBe('OPEN');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('addTicketMessage', () => {
    it('appends message to ticket conversation and updates status', async () => {
      mockPrisma.auditLog.findFirst.mockResolvedValue({
        id: 'log-10',
        after: {
          ticketId: 'TICK-123',
          userId: 'user-1',
          status: 'OPEN',
          messages: [],
        },
      });

      const res = await service.addTicketMessage(
        'TICK-123',
        'admin-1',
        { content: 'We are investigating this with the landlord.' },
        true,
      );

      expect(res.ticketId).toBe('TICK-123');
      expect(res.messagesCount).toBe(1);
      expect(mockPrisma.auditLog.update).toHaveBeenCalled();
    });
  });

  describe('updateTicketStatus', () => {
    it('transitions ticket status to RESOLVED with notes', async () => {
      mockPrisma.auditLog.findFirst.mockResolvedValue({
        id: 'log-10',
        after: { ticketId: 'TICK-123', status: 'IN_PROGRESS' },
      });

      const res = await service.updateTicketStatus('TICK-123', 'admin-1', {
        status: TicketStatus.RESOLVED,
        resolutionNotes: 'Dispute mediated. Security deposit returned in full.',
      });

      expect(res.status).toBe(TicketStatus.RESOLVED);
      expect(res.resolutionNotes).toContain('Security deposit returned');
    });
  });

  describe('submitAppeal', () => {
    it('registers official appeal for ombudsman review', async () => {
      const res = await service.submitAppeal('user-1', {
        targetType: 'LISTING_TAKEDOWN',
        targetId: 'prop-123',
        appealReason: 'Property photos were verified and address is accurate inside Peshawar.',
      });

      expect(res.appealId).toMatch(/^APPL-/);
      expect(res.status).toBe('PENDING_REVIEW');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('takedownListing', () => {
    it('suspends property, alerts landlord, and logs immutable audit trail', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-bad',
        title: 'Misleading House',
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        landlordId: 'll-bad',
      });

      mockPrisma.property.update.mockResolvedValue({
        id: 'prop-bad',
        status: PropertyStatus.SUSPENDED,
        suspensionReason: 'Violated safety guidelines and fake photos.',
      });

      const res = await service.takedownListing('admin-1', {
        propertyId: 'prop-bad',
        reason: 'Violated safety guidelines and fake photos.',
        notifyLandlord: true,
      });

      expect(res.status).toBe(PropertyStatus.SUSPENDED);
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
