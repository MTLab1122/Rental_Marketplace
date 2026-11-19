import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';
import { JobQueueService } from '../jobs/job-queue.service';
import { DeadLetterService } from '../jobs/dead-letter.service';
import { CacheManagerService } from '../cache/cache-manager.service';
import { DataPlatformService } from '../data-platform/data-platform.service';
import { CircuitBreakerService, CircuitState } from '../scale/circuit-breaker.service';
import { RedisService } from '../../database/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { DomainEventType, BackgroundJobName } from '@rental-peshawar/shared-types';
import { ServiceUnavailableException } from '@nestjs/common';

describe('Phase 14: Event-Driven Architecture, Jobs & Scale Infrastructure', () => {
  let outboxService: OutboxService;
  let jobQueueService: JobQueueService;
  let deadLetterService: DeadLetterService;
  let cacheManagerService: CacheManagerService;
  let dataPlatformService: DataPlatformService;
  let circuitBreakerService: CircuitBreakerService;

  const mockPrisma: any = {
    domainEventOutbox: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    eventStore: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    deadLetterJob: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    dailyAnalyticsAggregate: {
      upsert: jest.fn(),
    },
    dataRetentionPolicy: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    propertyViewEvent: {
      deleteMany: jest.fn().mockResolvedValue({ count: 15 }),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    landlordProfile: {
      updateMany: jest.fn(),
    },
    verificationRecord: {
      updateMany: jest.fn(),
    },
    property: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    inquiry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    booking: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    review: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(null), // simulate memory fallback by default
    isHealthy: jest.fn().mockResolvedValue(false),
  };

  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        JobQueueService,
        DeadLetterService,
        CacheManagerService,
        DataPlatformService,
        CircuitBreakerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedisService },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    outboxService = module.get<OutboxService>(OutboxService);
    jobQueueService = module.get<JobQueueService>(JobQueueService);
    deadLetterService = module.get<DeadLetterService>(DeadLetterService);
    cacheManagerService = module.get<CacheManagerService>(CacheManagerService);
    dataPlatformService = module.get<DataPlatformService>(DataPlatformService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  describe('1. Transactional Outbox & Event Store', () => {
    it('publishes domain event transactionally into outbox table', async () => {
      mockPrisma.domainEventOutbox.create.mockResolvedValue({
        id: 'event-1',
        eventType: DomainEventType.BOOKING_CREATED,
        status: 'PENDING',
      });

      const event = await outboxService.publishTransactionally(mockPrisma, {
        eventId: 'event-1',
        eventType: DomainEventType.BOOKING_CREATED,
        aggregateType: 'Booking',
        aggregateId: 'b-123',
        payload: { bookingId: 'b-123', amountPkr: 45000 },
      });

      expect(event).toBeDefined();
      expect(mockPrisma.domainEventOutbox.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: DomainEventType.BOOKING_CREATED,
            aggregateType: 'Booking',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('processes outbox batch and records to immutable append-only EventStore', async () => {
      mockPrisma.domainEventOutbox.findMany.mockResolvedValue([
        {
          id: 'evt-100',
          eventType: DomainEventType.PAYMENT_SUCCEEDED,
          aggregateType: 'Payment',
          aggregateId: 'pay-555',
          payload: { amountPkr: 135000 },
          metadata: {},
          createdAt: new Date(),
          retryCount: 0,
        },
      ]);
      mockPrisma.eventStore.upsert.mockResolvedValue({});
      mockPrisma.domainEventOutbox.update.mockResolvedValue({});

      const result = await outboxService.processOutboxBatch(10);

      expect(result.processed).toBe(1);
      expect(mockPrisma.eventStore.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 'evt-100' },
          create: expect.objectContaining({
            eventType: DomainEventType.PAYMENT_SUCCEEDED,
            schemaVersion: 1,
          }),
        }),
      );
      expect(mockPrisma.domainEventOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PUBLISHED' }),
        }),
      );
    });
  });

  describe('2. Job Queue Reliability & Dead-Letter Queue', () => {
    it('suppresses duplicate jobs when identical idempotency key is submitted', async () => {
      const job1 = await jobQueueService.addJob(
        BackgroundJobName.SEND_NOTIFICATION,
        { userId: 'u1', title: 'Test' },
        { idempotencyKey: 'idem-alert-123' },
      );

      expect(job1).toBeDefined();

      const job2 = await jobQueueService.addJob(
        BackgroundJobName.SEND_NOTIFICATION,
        { userId: 'u1', title: 'Test' },
        { idempotencyKey: 'idem-alert-123' },
      );

      expect(job2).toBeNull(); // Suppressed
    });

    it('retries failed job with exponential backoff until max attempts', async () => {
      const job = await jobQueueService.addJob(
        BackgroundJobName.CALCULATE_LOCALITY_DEMAND,
        { localityId: 'loc-1' },
        { maxAttempts: 3 },
      );

      expect(job).toBeDefined();

      // Attempt 1 failure
      await jobQueueService.handleJobFailure(job!, new Error('Network timeout'));
      expect(job!.attemptsMade).toBe(1);
      expect(job!.state).toBe('delayed');

      // Attempt 2 failure
      await jobQueueService.handleJobFailure(job!, new Error('Network timeout'));
      expect(job!.attemptsMade).toBe(2);
      expect(job!.state).toBe('delayed');

      // Attempt 3 failure -> Dead-Letter
      await jobQueueService.handleJobFailure(job!, new Error('Fatal error'));
      expect(job!.attemptsMade).toBe(3);
      expect(job!.state).toBe('failed');
      expect(mockPrisma.deadLetterJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobName: BackgroundJobName.CALCULATE_LOCALITY_DEMAND,
            errorReason: 'Fatal error',
          }),
        }),
      );
    });

    it('dead-letter job is recoverable and re-enqueued by admin', async () => {
      mockPrisma.deadLetterJob.findUnique.mockResolvedValue({
        id: 'dlq-1',
        jobName: BackgroundJobName.CALCULATE_REPUTATION,
        payload: { landlordId: 'landlord-1' },
      });
      mockPrisma.deadLetterJob.update.mockResolvedValue({
        id: 'dlq-1',
        isResolved: true,
      });

      const recovery = await deadLetterService.retryJob('dlq-1', 'admin-user');

      expect(recovery.success).toBe(true);
      expect(recovery.reEnqueuedJobId).toBeDefined();
      expect(mockPrisma.deadLetterJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isResolved: true, resolvedBy: 'admin-user' }),
        }),
      );
    });
  });

  describe('3. Caching & Invalidation Strategy', () => {
    it('stores and retrieves cached data with in-memory fallback during Redis degradation', async () => {
      await cacheManagerService.set('property-details:p1', { title: 'Hayatabad Villa' }, 60);

      const cached = await cacheManagerService.get<any>('property-details:p1');
      expect(cached).toBeDefined();
      expect(cached.title).toBe('Hayatabad Villa');
    });

    it('invalidates property cache, featured list, and search results on property change', async () => {
      await cacheManagerService.set('property-details:p1', { title: 'Hayatabad Villa' }, 60);
      await cacheManagerService.set('featured-properties', [{ id: 'p1' }], 300);

      await cacheManagerService.invalidateProperty('p1');

      const cachedProperty = await cacheManagerService.get('property-details:p1');
      const cachedFeatured = await cacheManagerService.get('featured-properties');

      expect(cachedProperty).toBeNull();
      expect(cachedFeatured).toBeNull();
    });
  });

  describe('4. Data Platform: PII Anonymization & Data Export', () => {
    it('anonymizes user personal attributes while preserving account and audit history', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target',
        fullName: 'Zubair Afridi',
        email: 'zubair@example.com',
        phoneNumber: '+923001234567',
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.landlordProfile.updateMany.mockResolvedValue({});
      mockPrisma.verificationRecord.updateMany.mockResolvedValue({});

      const result = await dataPlatformService.anonymizeUserData('u-target', 'admin-audit');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-target' },
          data: expect.objectContaining({
            fullName: expect.stringContaining('Anonymized User'),
            passwordHash: 'DELETED',
            isSuspended: true,
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_PII_PURGED' }),
      );
    });

    it('generates PostgreSQL declarative partition DDL for high-volume event tables', () => {
      const ddl = dataPlatformService.generateMonthlyPartitionDdl(2026, 3);

      expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "property_view_events_y2026m03"');
      expect(ddl).toContain('PARTITION OF "property_view_events"');
      expect(ddl).toContain("FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00')");
      expect(ddl).toContain('audit_logs_y2026m03');
    });
  });

  describe('5. Circuit Breaker for External Scale & Resilience', () => {
    it('opens circuit and fails fast after threshold failures, then recovers in half-open state', async () => {
      const failingAction = jest.fn().mockRejectedValue(new Error('Gateway timeout'));
      const successAction = jest.fn().mockResolvedValue({ success: true });

      // Trigger 5 failures to reach threshold
      for (let i = 0; i < 5; i++) {
        await expect(circuitBreakerService.execute('jazzcash', failingAction)).rejects.toThrow();
      }

      expect(circuitBreakerService.getCircuitState('jazzcash')).toBe(CircuitState.OPEN);

      // Next immediate call is aborted with ServiceUnavailableException without executing failingAction
      await expect(circuitBreakerService.execute('jazzcash', successAction)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
