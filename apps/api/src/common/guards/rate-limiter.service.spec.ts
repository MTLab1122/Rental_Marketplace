import { RateLimiterService } from './rate-limiter.service';
import { RedisService } from '../../database/redis.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;
  let mockRedisService: Partial<RedisService>;

  beforeEach(() => {
    mockRedisService = {
      getClient: jest.fn().mockReturnValue(null),
      isHealthy: jest.fn().mockResolvedValue(false),
    };
    rateLimiter = new RateLimiterService(mockRedisService as RedisService);
  });

  it('should allow requests within limit', async () => {
    const key = 'test:login';
    const identifier = 'user-1';

    for (let i = 0; i < 4; i++) {
      const result = await rateLimiter.checkRateLimit(key, identifier, 5, 60);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - (i + 1));
    }
  });

  it('should block requests that exceed limit and throw 429 HttpException', async () => {
    const key = 'test:register';
    const identifier = 'ip-127-0-0-1';

    // Limit of 3
    await rateLimiter.enforceRateLimit(key, identifier, 3, 60);
    await rateLimiter.enforceRateLimit(key, identifier, 3, 60);
    await rateLimiter.enforceRateLimit(key, identifier, 3, 60);

    // 4th request must throw 429
    await expect(rateLimiter.enforceRateLimit(key, identifier, 3, 60)).rejects.toThrow(
      HttpException,
    );

    try {
      await rateLimiter.enforceRateLimit(key, identifier, 3, 60);
    } catch (err) {
      const httpErr = err as HttpException;
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});
