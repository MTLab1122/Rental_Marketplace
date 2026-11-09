import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { ConfigService } from '@nestjs/config';
import { HealthStatusDto, ReadyStatusDto } from '@rental-peshawar/shared-types';

@ApiTags('Health & Diagnostics')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @SwaggerApiResponse({ status: 200, description: 'Service is alive' })
  getHealth(): HealthStatusDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      version: '1.0.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for database and redis' })
  @SwaggerApiResponse({ status: 200, description: 'Service readiness assessment' })
  async getReady(): Promise<ReadyStatusDto> {
    const isDbUp = await this.prisma.isHealthy();
    const isRedisUp = await this.redis.isHealthy();

    const isReady = isDbUp && isRedisUp;

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: isDbUp ? 'up' : 'down',
        redis: isRedisUp ? 'up' : 'down',
      },
    };
  }
}
