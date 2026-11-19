import { Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
import { RedisService } from '../../database/redis.service';

@Module({
  providers: [CacheManagerService, RedisService],
  exports: [CacheManagerService],
})
export class CacheModule {}
