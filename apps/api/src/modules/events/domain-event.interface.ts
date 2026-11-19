import { DomainEventType } from '@rental-peshawar/shared-types';

export interface DomainEventPayload<T = Record<string, any>> {
  eventId: string;
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  schemaVersion?: number;
  payload: T;
  metadata?: {
    actorId?: string;
    correlationId?: string;
    causationId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  };
  occurredAt?: Date;
}
