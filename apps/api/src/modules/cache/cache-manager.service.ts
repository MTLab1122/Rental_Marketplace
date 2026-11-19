import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';

export interface CacheTTLConfig {
  localities: number; // 24 hours
  amenities: number; // 24 hours
  featuredProperties: number; // 5 minutes
  propertyDetails: number; // 60 seconds
  searchResults: number; // 30 seconds
  localityBoundary: number; // 24 hours
  publicConfig: number; // 10 minutes
}

export const CACHE_TTLS: CacheTTLConfig = {
  localities: 86400, // 24h
  amenities: 86400, // 24h
  localityBoundary: 86400, // 24h
  publicConfig: 600, // 10m
  featuredProperties: 300, // 5m
  propertyDetails: 60, // 60s
  searchResults: 30, // 30s
};

@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name);
  private readonly prefix = 'peshawar:cache:';
  private readonly memoryStore: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Retrieves an item from Redis or memory fallback.
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}${key}`;
    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        const raw = await redis.get(fullKey);
        if (raw) {
          return JSON.parse(raw) as T;
        }
      } catch (err) {
        this.logger.warn(`[Cache] Redis read failed for ${key}: ${(err as Error).message}`);
      }
    }

    // Memory store fallback
    const memEntry = this.memoryStore.get(fullKey);
    if (memEntry) {
      if (memEntry.expiresAt > Date.now()) {
        return JSON.parse(memEntry.value) as T;
      }
      this.memoryStore.delete(fullKey);
    }

    return null;
  }

  /**
   * Sets an item with TTL in seconds.
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    const serialized = JSON.stringify(value);
    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        await redis.set(fullKey, serialized, 'EX', ttlSeconds);
        return;
      } catch (err) {
        this.logger.warn(`[Cache] Redis write failed for ${key}: ${(err as Error).message}`);
      }
    }

    // Memory store fallback
    this.memoryStore.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidates a single key.
   */
  async del(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        await redis.del(fullKey);
      } catch {
        // Ignored
      }
    }
    this.memoryStore.delete(fullKey);
  }

  /**
   * Invalidates all keys matching a prefix or wildcard.
   */
  async delPattern(pattern: string): Promise<void> {
    const fullPattern = `${this.prefix}${pattern}`;
    const redis = this.redisService.getClient();

    if (redis && (await this.redisService.isHealthy())) {
      try {
        const keys = await redis.keys(fullPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Ignored
      }
    }

    // Memory fallback
    for (const k of this.memoryStore.keys()) {
      if (k.startsWith(this.prefix + pattern.replace('*', ''))) {
        this.memoryStore.delete(k);
      }
    }
  }

  // ==========================================
  // BUSINESS INVALIDATION TRIGGERS
  // ==========================================

  /**
   * Triggered on property update, status change, or approval.
   */
  async invalidateProperty(propertyId: string): Promise<void> {
    await this.del(`property-details:${propertyId}`);
    await this.del('featured-properties');
    await this.delPattern('search-results:*');
    this.logger.log(`[Cache] Invalidated cache for property ${propertyId}`);
  }

  /**
   * Triggered on locality boundary or locality change.
   */
  async invalidateLocality(localityId?: string): Promise<void> {
    await this.del('localities');
    if (localityId) {
      await this.del(`locality-boundary:${localityId}`);
    }
    await this.delPattern('search-results:*');
    this.logger.log(`[Cache] Invalidated locality caches (Locality: ${localityId || 'ALL'})`);
  }

  /**
   * Triggered on amenity update.
   */
  async invalidateAmenities(): Promise<void> {
    await this.del('amenities');
    this.logger.log('[Cache] Invalidated amenities cache');
  }

  /**
   * Complete flush for admin emergency or test teardown.
   */
  async flushAll(): Promise<void> {
    await this.delPattern('*');
    this.memoryStore.clear();
    this.logger.log('[Cache] Flushed all application cache entries');
  }
}
