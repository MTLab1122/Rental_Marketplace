import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import { ErrorCode } from '@rental-peshawar/shared-types';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  // In-memory sliding window fallback for local development & unit testing when Redis is offline
  private readonly inMemoryStore = new Map<string, number[]>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Enforces sliding window rate limit.
   */
  async checkRateLimit(
    keyPrefix: string,
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        // Redis Multi Transaction:
        // 1. Remove entries older than windowStart
        // 2. Count current entries in window
        // 3. Add current timestamp
        // 4. Set TTL
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zcard(key);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.expire(key, windowSeconds);

        const results = await pipeline.exec();
        const currentCount = (results?.[1]?.[1] as number) || 0;

        if (currentCount >= limit) {
          return {
            allowed: false,
            limit,
            remaining: 0,
            retryAfterSeconds: windowSeconds,
          };
        }

        return {
          allowed: true,
          limit,
          remaining: Math.max(0, limit - currentCount - 1),
          retryAfterSeconds: 0,
        };
      } catch (err) {
        this.logger.warn(
          `Redis rate limit error, using in-memory fallback: ${(err as Error).message}`,
        );
      }
    }

    // In-memory fallback
    let timestamps = this.inMemoryStore.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= limit) {
      const oldestInWindow = timestamps[0] || now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    timestamps.push(now);
    this.inMemoryStore.set(key, timestamps);

    return {
      allowed: true,
      limit,
      remaining: limit - timestamps.length,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Helper that throws standard 429 HttpException if limit exceeded.
   */
  async enforceRateLimit(
    keyPrefix: string,
    identifier: string,
    limit: number,
    windowSeconds: number,
    customMessage?: string,
  ): Promise<RateLimitResult> {
    const result = await this.checkRateLimit(keyPrefix, identifier, limit, windowSeconds);
    if (!result.allowed) {
      throw new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message:
            customMessage ||
            `Too many requests. Rate limit of ${limit} requests per ${windowSeconds}s exceeded. Please try again in ${result.retryAfterSeconds} seconds.`,
          details: [
            {
              field: keyPrefix,
              message: `Retry after ${result.retryAfterSeconds} seconds.`,
            },
          ],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return result;
  }
}
