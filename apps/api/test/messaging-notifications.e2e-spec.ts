import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { TokenService } from '../src/modules/auth/token.service';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { InquiryService } from '../src/modules/inquiry/inquiry.service';
import { ConversationService } from '../src/modules/conversation/conversation.service';
import { NotificationService } from '../src/modules/notification/notification.service';
import {
  UserRole,
  TenantType,
  InquiryStatus,
  ReportReason,
  NotificationType,
} from '@rental-peshawar/shared-types';

describe('Messaging, Inquiries, and Notifications E2E Tests', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  jest.setTimeout(30000);

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const landlordId = '00000000-0000-0000-0000-000000000002';
  const strangerId = '00000000-0000-0000-0000-000000000003';
  const propertyId = '11111111-1111-1111-1111-111111111111';
  const inquiryId = '22222222-2222-2222-2222-222222222222';
  const conversationId = '33333333-3333-3333-3333-333333333333';
  const messageId = '44444444-4444-4444-4444-444444444444';
  const notificationId = '55555555-5555-5555-5555-555555555555';
  const deviceId = '66666666-6666-6666-6666-666666666666';

  let tenantToken: string;
  let landlordToken: string;
  let strangerToken: string;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockResolvedValue(true),
  };

  const mockRedisService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    getClient: jest.fn().mockReturnValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };

  const mockInquiryService = {
    createInquiry: jest.fn().mockImplementation((tId, dto) => {
      return Promise.resolve({
        id: inquiryId,
        propertyId: dto.propertyId,
        tenantId: tId,
        landlordId,
        status: InquiryStatus.SUBMITTED,
        message: dto.message,
        proposedRentPkr: dto.proposedRentPkr || 20000,
        conversationId,
        createdAt: new Date().toISOString(),
      });
    }),
    getMyInquiries: jest.fn().mockResolvedValue([
      {
        id: inquiryId,
        propertyId,
        tenantId,
        landlordId,
        status: InquiryStatus.SUBMITTED,
        message: 'Interested in room',
        conversationId,
        canContactWhatsapp: false,
        whatsappUrl: null,
      },
    ]),
    getLandlordInquiries: jest.fn().mockResolvedValue([
      {
        id: inquiryId,
        propertyId,
        tenantId,
        landlordId,
        status: InquiryStatus.SUBMITTED,
        message: 'Interested in room',
        conversationId,
      },
    ]),
    getInquiryById: jest.fn().mockImplementation((id) => {
      return Promise.resolve({
        id,
        propertyId,
        tenantId,
        landlordId,
        status: InquiryStatus.ACCEPTED,
        message: 'Interested in room',
        conversationId,
        canContactWhatsapp: true,
        whatsappUrl: 'https://wa.me/923001234567?text=Assalam-o-Alaikum',
      });
    }),
    updateStatusByLandlord: jest.fn().mockImplementation((id, _lId, dto) => {
      return Promise.resolve({
        id,
        status: dto.status,
      });
    }),
    deleteInquiry: jest.fn().mockResolvedValue({
      success: true,
      message: 'Inquiry closed successfully.',
    }),
  };

  const mockConversationService = {
    getUserConversations: jest.fn().mockResolvedValue([
      {
        id: conversationId,
        inquiryId,
        propertyId,
        isBlocked: false,
        unreadCount: 0,
        canContactWhatsapp: true,
        whatsappUrl: 'https://wa.me/923001234567?text=Assalam-o-Alaikum',
        participants: [
          { id: 'part-1', userId: tenantId, fullName: 'Ahmad Tenant' },
          { id: 'part-2', userId: landlordId, fullName: 'Gul Landlord' },
        ],
        lastMessage: {
          id: messageId,
          content: 'Hello, when can I visit?',
          createdAt: new Date().toISOString(),
        },
      },
    ]),
    getMessages: jest.fn().mockImplementation((cId, uId) => {
      if (uId === strangerId) {
        throw new Error('Forbidden');
      }
      return Promise.resolve([
        {
          id: messageId,
          conversationId: cId,
          senderId: tenantId,
          content: 'Hello, when can I visit?',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }),
    sendMessage: jest.fn().mockImplementation((cId, sId, content) => {
      if (sId === strangerId) {
        throw new Error('Forbidden');
      }
      return Promise.resolve({
        id: messageId,
        conversationId: cId,
        senderId: sId,
        content,
        isRead: false,
        createdAt: new Date(),
        sender: { id: sId, fullName: 'Sender Name' },
      });
    }),
    markAsRead: jest.fn().mockResolvedValue({
      success: true,
      updatedCount: 1,
      readAt: new Date().toISOString(),
    }),
    blockConversation: jest.fn().mockResolvedValue({
      id: conversationId,
      isBlocked: true,
      blockedById: tenantId,
    }),
    reportConversation: jest.fn().mockResolvedValue({
      id: 'report-1',
      targetType: 'CONVERSATION',
      targetId: conversationId,
      reason: ReportReason.HARASSMENT,
    }),
  };

  const mockNotificationService = {
    getUserNotifications: jest.fn().mockResolvedValue([
      {
        id: notificationId,
        userId: tenantId,
        type: NotificationType.INQUIRY_REPLIED,
        title: 'Inquiry Accepted',
        body: 'Your inquiry has been accepted by the landlord.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]),
    markAsRead: jest.fn().mockResolvedValue({
      id: notificationId,
      isRead: true,
    }),
    markAllAsRead: jest.fn().mockResolvedValue({
      success: true,
      updatedCount: 3,
    }),
    registerDevice: jest.fn().mockResolvedValue({
      id: deviceId,
      userId: tenantId,
      fcmToken: 'fcm-token-12345',
      platform: 'ANDROID',
    }),
    deleteDevice: jest.fn().mockResolvedValue({
      success: true,
      message: 'Device token removed successfully.',
    }),
    getUserDevices: jest
      .fn()
      .mockResolvedValue([{ id: deviceId, fcmToken: 'fcm-token-12345', platform: 'ANDROID' }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(InquiryService)
      .useValue(mockInquiryService)
      .overrideProvider(ConversationService)
      .useValue(mockConversationService)
      .overrideProvider(NotificationService)
      .useValue(mockNotificationService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'ready', 'docs', 'docs-json'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    tokenService = moduleFixture.get<TokenService>(TokenService);

    tenantToken = (
      await tokenService.generateTokens(
        tenantId,
        'tenant@peshawar.pk',
        [UserRole.TENANT],
        TenantType.STUDENT,
      )
    ).accessToken;

    landlordToken = (
      await tokenService.generateTokens(landlordId, 'landlord@peshawar.pk', [UserRole.LANDLORD])
    ).accessToken;

    strangerToken = (
      await tokenService.generateTokens(
        strangerId,
        'stranger@peshawar.pk',
        [UserRole.TENANT],
        TenantType.STUDENT,
      )
    ).accessToken;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Inquiries Endpoints', () => {
    it('POST /api/v1/inquiries creates inquiry and returns conversationId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inquiries')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId,
          message: 'Hello, I am interested in renting this single room.',
          proposedRentPkr: 18000,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(inquiryId);
      expect(res.body.data.conversationId).toBe(conversationId);
    });

    it('GET /api/v1/inquiries/my lists tenant inquiries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inquiries/my')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/landlord/inquiries lists landlord inquiries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/landlord/inquiries')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PATCH /api/v1/landlord/inquiries/:id/status updates status to ACCEPTED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/landlord/inquiries/${inquiryId}/status`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    it('GET /api/v1/inquiries/:id reveals WhatsApp deep link when accepted', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.canContactWhatsapp).toBe(true);
      expect(res.body.data.whatsappUrl).toContain('https://wa.me');
    });
  });

  describe('Conversations & Messaging Endpoints', () => {
    it('GET /api/v1/conversations returns list of conversations with WhatsApp availability', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(conversationId);
      expect(res.body.data[0].canContactWhatsapp).toBe(true);
    });

    it('GET /api/v1/conversations/:id/messages returns conversation messages', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].content).toBe('Hello, when can I visit?');
    });

    it('POST /api/v1/conversations/:id/messages posts a new message', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ content: 'I can visit tomorrow at 2 PM.' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('I can visit tomorrow at 2 PM.');
    });

    it('rejects message attempt by stranger or unauthorized user', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ content: 'Intruding on conversation' })
        .expect(500);
    });

    it('PATCH /api/v1/conversations/:id/read acknowledges read receipt', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('POST /api/v1/conversations/:id/block blocks the conversation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/block`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ reason: 'Unsolicited messages' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isBlocked).toBe(true);
    });

    it('POST /api/v1/conversations/:id/report files an abuse report', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/report`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          reason: ReportReason.HARASSMENT,
          details: 'Used inappropriate language in direct chat.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.targetType).toBe('CONVERSATION');
    });
  });

  describe('Notifications and Device Tokens Endpoints', () => {
    it('GET /api/v1/notifications lists user notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe(NotificationType.INQUIRY_REPLIED);
    });

    it('PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('PATCH /api/v1/notifications/read-all marks all notifications read', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(3);
    });

    it('POST /api/v1/devices registers FCM device token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          fcmToken: 'fcm-token-12345',
          platform: 'ANDROID',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.platform).toBe('ANDROID');
    });

    it('DELETE /api/v1/devices/:id removes registered device token', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
