import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventPayload } from './domain-event.interface';
import { DomainEventType } from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly maxRetries = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publishes a domain event transactionally within an existing Prisma transaction.
   * Guarantees that business changes and domain events commit atomically (Transactional Outbox Pattern).
   */
  async publishTransactionally(tx: Prisma.TransactionClient, event: DomainEventPayload) {
    const eventId = event.eventId || crypto.randomUUID();
    const outboxRecord = await tx.domainEventOutbox.create({
      data: {
        id: eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
        metadata: (event.metadata || {}) as Prisma.InputJsonValue,
        status: 'PENDING',
        retryCount: 0,
      },
    });

    this.logger.log(
      `[Outbox] Staged event ${event.eventType} for aggregate ${event.aggregateType}:${event.aggregateId} (Event ID: ${eventId})`,
    );

    return outboxRecord;
  }

  /**
   * Direct outbox publishing when not in an existing transaction.
   */
  async publish(event: DomainEventPayload) {
    return this.publishTransactionally(this.prisma, event);
  }

  /**
   * Processes a batch of pending outbox events:
   * 1. Fetches PENDING or retryable FAILED events
   * 2. Persists to immutable EventStore
   * 3. Marks outbox record as PUBLISHED
   * 4. Enforces exponential backoff and dead-letter queueing on failure
   */
  async processOutboxBatch(
    batchSize = 50,
  ): Promise<{ processed: number; failed: number; deadLettered: number }> {
    const now = new Date();
    const pendingEvents = await this.prisma.domainEventOutbox.findMany({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'FAILED', nextRetryAt: { lte: now } }],
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const record of pendingEvents) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Record to durable, append-only event_store with schema versioning
          await tx.eventStore.upsert({
            where: { eventId: record.id },
            update: {},
            create: {
              eventId: record.id,
              eventType: record.eventType,
              aggregateType: record.aggregateType,
              aggregateId: record.aggregateId,
              schemaVersion: 1,
              payload: record.payload as Prisma.InputJsonValue,
              metadata: record.metadata as Prisma.InputJsonValue,
              occurredAt: record.createdAt,
            },
          });

          // 2. Mark outbox entry as PUBLISHED
          await tx.domainEventOutbox.update({
            where: { id: record.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
          });
        });

        processed++;
      } catch (err: any) {
        failed++;
        const nextAttempts = record.retryCount + 1;
        const errorMessage = err?.message || 'Event dispatch failure';

        if (nextAttempts >= this.maxRetries) {
          // Escalate to Dead-Letter Queue
          await this.prisma.$transaction(async (tx) => {
            await tx.domainEventOutbox.update({
              where: { id: record.id },
              data: {
                status: 'DEAD_LETTER',
                retryCount: nextAttempts,
                lastError: errorMessage,
              },
            });

            await tx.deadLetterJob.create({
              data: {
                jobId: record.id,
                queueName: 'outbox-events',
                jobName: record.eventType,
                payload: record.payload as Prisma.InputJsonValue,
                errorReason: errorMessage,
                attempts: nextAttempts,
              },
            });
          });

          deadLettered++;
          this.logger.error(
            `[Outbox] Event ${record.id} (${record.eventType}) exceeded max retries. Moved to DEAD_LETTER queue. Error: ${errorMessage}`,
          );
        } else {
          // Exponential backoff: 5s, 10s, 20s, 40s...
          const backoffDelaySeconds = Math.pow(2, nextAttempts) * 5;
          const nextRetryAt = new Date(Date.now() + backoffDelaySeconds * 1000);

          await this.prisma.domainEventOutbox.update({
            where: { id: record.id },
            data: {
              status: 'FAILED',
              retryCount: nextAttempts,
              nextRetryAt,
              lastError: errorMessage,
            },
          });

          this.logger.warn(
            `[Outbox] Event ${record.id} failed (attempt ${nextAttempts}/${this.maxRetries}). Retrying at ${nextRetryAt.toISOString()}`,
          );
        }
      }
    }

    return { processed, failed, deadLettered };
  }

  /**
   * Replays events from the append-only event store from a given timestamp.
   * Enables state rebuilding, cache warm-up, and audit verification.
   */
  async replayEvents(
    fromTimestamp: Date,
    eventTypes?: DomainEventType[],
  ): Promise<{ replayedCount: number }> {
    const whereClause: Prisma.EventStoreWhereInput = {
      occurredAt: { gte: fromTimestamp },
    };

    if (eventTypes && eventTypes.length > 0) {
      whereClause.eventType = { in: eventTypes };
    }

    const events = await this.prisma.eventStore.findMany({
      where: whereClause,
      orderBy: { occurredAt: 'asc' },
    });

    this.logger.log(
      `[EventStore] Replaying ${events.length} domain events from ${fromTimestamp.toISOString()}`,
    );

    for (const event of events) {
      // Re-stage into outbox for reprocessing
      await this.prisma.domainEventOutbox.create({
        data: {
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload as Prisma.InputJsonValue,
          metadata: {
            ...((event.metadata as Record<string, any>) || {}),
            isReplay: true,
            originalEventId: event.eventId,
            replayedAt: new Date().toISOString(),
          },
          status: 'PENDING',
        },
      });
    }

    return { replayedCount: events.length };
  }
}
