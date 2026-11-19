import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { BackgroundJobName, QueueMetricsDto } from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface JobOptions {
  idempotencyKey?: string;
  delayMs?: number;
  maxAttempts?: number;
  priority?: number;
}

export interface EnqueuedJob<T = Record<string, any>> {
  id: string;
  name: BackgroundJobName;
  data: T;
  idempotencyKey?: string;
  attemptsMade: number;
  maxAttempts: number;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  failedReason?: string;
  createdAt: number;
  processedAt?: number;
  runAt: number;
}

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly queuePrefix = 'peshawar:queue:';
  private readonly memoryQueue: Map<string, EnqueuedJob> = new Map();
  private readonly processedIdempotencyKeys: Set<string> = new Set();

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Enqueues a background job with idempotency and retry parameters.
   */
  async addJob<T = Record<string, any>>(
    name: BackgroundJobName,
    data: T,
    options?: JobOptions,
  ): Promise<EnqueuedJob<T> | null> {
    const idempotencyKey = options?.idempotencyKey;

    // 1. Idempotency Check: prevent duplicate job scheduling
    if (idempotencyKey) {
      const isDuplicate = await this.checkIdempotency(idempotencyKey);
      if (isDuplicate) {
        this.logger.log(`[Queue] Duplicate job suppressed for idempotency key: ${idempotencyKey}`);
        return null;
      }
    }

    const jobId = `job_${crypto.randomUUID()}`;
    const delay = options?.delayMs || 0;
    const now = Date.now();

    const job: EnqueuedJob<T> = {
      id: jobId,
      name,
      data,
      idempotencyKey,
      attemptsMade: 0,
      maxAttempts: options?.maxAttempts || 3,
      state: delay > 0 ? 'delayed' : 'waiting',
      createdAt: now,
      runAt: now + delay,
    };

    const redis = this.redisService.getClient();
    if (redis && (await this.redisService.isHealthy())) {
      try {
        const serialized = JSON.stringify(job);
        if (delay > 0) {
          // Delayed zset
          await redis.zadd(`${this.queuePrefix}delayed`, job.runAt, serialized);
        } else {
          // Standard FIFO queue
          await redis.rpush(`${this.queuePrefix}waiting`, serialized);
        }
        if (idempotencyKey) {
          await redis.set(`idemp:${idempotencyKey}`, '1', 'EX', 86400); // 24h retention
        }
      } catch (err) {
        this.logger.warn(
          `[Queue] Redis write failed; failing over to memory queue: ${(err as Error).message}`,
        );
        this.memoryQueue.set(jobId, job as EnqueuedJob);
      }
    } else {
      // Memory fallback when Redis is degraded
      this.memoryQueue.set(jobId, job as EnqueuedJob);
      if (idempotencyKey) {
        this.processedIdempotencyKeys.add(idempotencyKey);
      }
    }

    this.logger.log(`[Queue] Enqueued job ${name} (ID: ${jobId}) with state: ${job.state}`);
    return job;
  }

  /**
   * Fetches the next available job for worker execution.
   */
  async getNextJob(): Promise<EnqueuedJob | null> {
    const now = Date.now();
    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        // Move ready delayed jobs to waiting
        const readyDelayed = await redis.zrangebyscore(`${this.queuePrefix}delayed`, 0, now);
        for (const raw of readyDelayed) {
          await redis.zrem(`${this.queuePrefix}delayed`, raw);
          const job = JSON.parse(raw);
          job.state = 'waiting';
          await redis.rpush(`${this.queuePrefix}waiting`, JSON.stringify(job));
        }

        const rawJob = await redis.lpop(`${this.queuePrefix}waiting`);
        if (rawJob) {
          const job: EnqueuedJob = JSON.parse(rawJob);
          job.state = 'active';
          job.processedAt = Date.now();
          return job;
        }
      } catch (err) {
        this.logger.warn(
          `[Queue] Redis poll failed; falling back to memory queue: ${(err as Error).message}`,
        );
      }
    }

    // Memory queue fallback
    for (const [id, job] of this.memoryQueue.entries()) {
      if ((job.state === 'waiting' || job.state === 'delayed') && job.runAt <= now) {
        job.state = 'active';
        job.processedAt = now;
        this.memoryQueue.delete(id);
        return job;
      }
    }

    return null;
  }

  /**
   * Handles job failure, exponential backoff, and dead-letter queue escalation.
   */
  async handleJobFailure(job: EnqueuedJob, error: Error): Promise<void> {
    job.attemptsMade += 1;
    job.failedReason = error.message;

    if (job.attemptsMade >= job.maxAttempts) {
      job.state = 'failed';
      this.logger.error(
        `[Queue] Job ${job.name} (ID: ${job.id}) exhausted ${job.maxAttempts} attempts. Escalating to Dead-Letter Queue.`,
      );

      // Record to dead_letter_jobs table
      await this.prisma.deadLetterJob.create({
        data: {
          jobId: job.id,
          queueName: 'peshawar-jobs',
          jobName: job.name,
          payload: job.data as Prisma.InputJsonValue,
          errorReason: error.message,
          attempts: job.attemptsMade,
        },
      });
    } else {
      // Exponential backoff delay: 2s, 4s, 8s...
      const backoffMs = Math.pow(2, job.attemptsMade) * 1000;
      job.runAt = Date.now() + backoffMs;
      job.state = 'delayed';

      this.logger.warn(
        `[Queue] Job ${job.name} (ID: ${job.id}) failed: ${error.message}. Retrying in ${backoffMs}ms (attempt ${job.attemptsMade}/${job.maxAttempts})`,
      );

      const redis = this.redisService.getClient();
      if (redis && (await this.redisService.isHealthy())) {
        try {
          await redis.zadd(`${this.queuePrefix}delayed`, job.runAt, JSON.stringify(job));
          return;
        } catch {
          // Fall through to memory queue
        }
      }

      this.memoryQueue.set(job.id, job);
    }
  }

  /**
   * Checks idempotency key in Redis or memory.
   */
  private async checkIdempotency(key: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    if (redis && (await this.redisService.isHealthy())) {
      try {
        const exists = await redis.exists(`idemp:${key}`);
        return exists === 1;
      } catch {
        return this.processedIdempotencyKeys.has(key);
      }
    }
    return this.processedIdempotencyKeys.has(key);
  }

  /**
   * Computes real-time queue health and backlog metrics.
   */
  async getQueueMetrics(): Promise<QueueMetricsDto> {
    let waiting = 0;
    let delayed = 0;
    const active = 0;
    const completed = 0;
    const failed = 0;

    const redis = this.redisService.getClient();
    if (redis && (await this.redisService.isHealthy())) {
      try {
        waiting = await redis.llen(`${this.queuePrefix}waiting`);
        delayed = await redis.zcard(`${this.queuePrefix}delayed`);
      } catch {
        // Fall back to memory counts
      }
    }

    if (waiting === 0 && delayed === 0) {
      for (const job of this.memoryQueue.values()) {
        if (job.state === 'waiting') waiting++;
        if (job.state === 'delayed') delayed++;
      }
    }

    const deadLetter = await this.prisma.deadLetterJob.count({
      where: { isResolved: false },
    });

    const backlogAlert = waiting > 100 || deadLetter > 20;

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      deadLetter,
      backlogAlert,
    };
  }
}
