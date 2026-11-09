import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: jest.Mocked<Partial<PrismaService>>;
  let redisService: jest.Mocked<Partial<RedisService>>;

  beforeEach(async () => {
    prismaService = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    redisService = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return health status with ok and uptime', () => {
    const health = controller.getHealth();
    expect(health.status).toBe('ok');
    expect(typeof health.uptime).toBe('number');
    expect(health.environment).toBe('test');
    expect(health.version).toBe('1.0.0');
    expect(health.timestamp).toBeDefined();
  });

  it('should return ready status when both db and redis are up', async () => {
    const ready = await controller.getReady();
    expect(ready.status).toBe('ready');
    expect(ready.checks.database).toBe('up');
    expect(ready.checks.redis).toBe('up');
  });

  it('should return not_ready if database is down', async () => {
    prismaService.isHealthy = jest.fn().mockResolvedValue(false);
    const ready = await controller.getReady();
    expect(ready.status).toBe('not_ready');
    expect(ready.checks.database).toBe('down');
    expect(ready.checks.redis).toBe('up');
  });
});
