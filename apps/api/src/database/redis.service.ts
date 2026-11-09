import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) return null; // stop retry in local dev/test if redis not present
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected successfully.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.connect().catch((err) => {
        this.logger.warn(`Initial Redis connection failed: ${(err as Error).message}`);
      });
    } catch (err) {
      this.logger.warn(`Failed to initialize Redis client: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis client disconnected.');
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
