import { assertEnvironmentSafety, AppEnvironmentConfig } from '@rental-peshawar/config';
import { S3StorageAdapter } from '../../modules/media/storage/s3-storage.adapter';
import { ConfigService } from '@nestjs/config';
import { PolicyEngineService } from './policy-engine.service';
import { StepUpAuthService, SensitiveAdminAction } from './step-up-auth.service';
import { RedisService } from '../../database/redis.service';
import { UserRole } from '@rental-peshawar/shared-types';

describe('Infrastructure Security & Zero-Trust Operations (Phase 17)', () => {
  describe('Environment Separation & Secret Guards', () => {
    const validDevConfig: AppEnvironmentConfig = {
      NODE_ENV: 'development',
      PORT: 3000,
      API_PREFIX: '/api/v1',
      LOG_LEVEL: 'info',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rental_peshawar_dev',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'dev_jwt_access_secret_min_32_characters_long_12345',
      JWT_REFRESH_SECRET: 'dev_jwt_refresh_secret_min_32_characters_long_12345',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      STORAGE_PROVIDER: 's3',
      S3_BUCKET: 'peshawar-rental-dev',
      S3_REGION: 'us-east-1',
      S3_FORCE_PATH_STYLE: true,
      MAP_PROVIDER: 'osm',
      WEB_URL: 'http://localhost:3000',
      ADMIN_URL: 'http://localhost:3001',
      MOBILE_DEEP_LINK_SCHEME: 'rentalpeshawar',
      ENFORCE_PESHAWAR_BOUNDARY: true,
    };

    const validProdConfig: AppEnvironmentConfig = {
      ...validDevConfig,
      NODE_ENV: 'production',
      DATABASE_URL:
        'postgresql://app_user:SecureProdDbPassword2026!@postgres-cluster.internal:5432/rental_peshawar_prod?sslmode=require',
      JWT_ACCESS_SECRET: 'A_Very_Long_And_Secure_Production_Jwt_Access_Secret_2026_64_Chars!',
      JWT_REFRESH_SECRET: 'A_Very_Long_And_Secure_Production_Jwt_Refresh_Secret_2026_64_Chars!',
      WEB_URL: 'https://rentalpeshawar.pk',
      ADMIN_URL: 'https://admin.rentalpeshawar.pk',
    };

    it('permits compliant development configuration', () => {
      expect(() => assertEnvironmentSafety(validDevConfig)).not.toThrow();
    });

    it('permits compliant production configuration with hardened credentials and HTTPS', () => {
      expect(() => assertEnvironmentSafety(validProdConfig)).not.toThrow();
    });

    it('Production Guard: rejects production launch if JWT_ACCESS_SECRET is a dev placeholder or < 32 chars', () => {
      const insecureProd = {
        ...validProdConfig,
        JWT_ACCESS_SECRET: 'dev_jwt_access_secret_min_32_characters_long_12345',
      };
      expect(() => assertEnvironmentSafety(insecureProd)).toThrow(
        /SECURITY VIOLATION.*JWT_ACCESS_SECRET/,
      );

      const shortSecretProd = {
        ...validProdConfig,
        JWT_ACCESS_SECRET: 'ShortPass123!',
      };
      expect(() => assertEnvironmentSafety(shortSecretProd)).toThrow(
        /SECURITY VIOLATION.*JWT_ACCESS_SECRET/,
      );
    });

    it('Production Guard: rejects production launch if DATABASE_URL uses default localhost credentials', () => {
      const insecureDbProd = {
        ...validProdConfig,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rental_peshawar_prod',
      };
      expect(() => assertEnvironmentSafety(insecureDbProd)).toThrow(/SECURITY VIOLATION.*database/);
    });

    it('Production Guard: rejects production launch if WEB_URL or ADMIN_URL are plain HTTP', () => {
      const plainHttpProd = {
        ...validProdConfig,
        WEB_URL: 'http://rentalpeshawar.pk',
      };
      expect(() => assertEnvironmentSafety(plainHttpProd)).toThrow(/SECURITY VIOLATION.*HTTPS/);
    });

    it('Cross-Environment Guard: blocks non-production (staging/dev) environments from connecting to production database', () => {
      const leakedProdDbInDev = {
        ...validDevConfig,
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rental_peshawar_prod',
      };
      expect(() => assertEnvironmentSafety(leakedProdDbInDev)).toThrow(
        /SECURITY VIOLATION.*production database/,
      );
    });

    it('Cross-Environment Guard: blocks non-production environments from targeting production domains', () => {
      const prodUrlInDev = {
        ...validDevConfig,
        NODE_ENV: 'staging' as const,
        WEB_URL: 'https://rentalpeshawar.pk',
      };
      expect(() => assertEnvironmentSafety(prodUrlInDev)).toThrow(
        /SECURITY VIOLATION.*production URLs/,
      );
    });
  });

  describe('Object Storage Security & Pre-Signed URL Expiration', () => {
    let storageAdapter: S3StorageAdapter;
    let mockConfigService: Partial<ConfigService>;

    beforeEach(() => {
      mockConfigService = {
        get: (key: string) => {
          const map: Record<string, string> = {
            S3_ENDPOINT: 'https://s3.us-east-1.amazonaws.com',
            S3_BUCKET: 'rental-peshawar-media',
            S3_REGION: 'us-east-1',
            S3_ACCESS_KEY_ID: 'MOCK_KEY_ID',
            S3_SECRET_ACCESS_KEY: 'MOCK_SECRET_KEY',
          };
          return map[key] || '';
        },
      };
      storageAdapter = new S3StorageAdapter(mockConfigService as ConfigService);
    });

    it('generates short-lived upload URLs with maximum 15 minutes (900s) TTL', async () => {
      const result = await storageAdapter.getSignedUploadUrl({
        purpose: 'property_image',
        mimeType: 'image/jpeg',
        fileSizeBytes: 2048,
        propertyId: 'prop-123',
        userId: 'landlord-456',
      });

      expect(result.uploadUrl).toBeDefined();
      expect(result.uploadUrl).toContain('X-Amz-Expires=900'); // 15 minutes TTL
      expect(result.expiresInSeconds).toBe(900);
      expect(result.storageKey).toMatch(/^properties\/prop-123\/\d+-[a-f0-9]+\.jpeg$/);
    });

    it('isolates private verification documents under non-public verifications/ prefix', async () => {
      const result = await storageAdapter.getSignedUploadUrl({
        purpose: 'cnic_document',
        mimeType: 'image/png',
        fileSizeBytes: 4096,
        userId: 'user-789',
      });

      expect(result.storageKey).toMatch(
        /^verifications\/user-789\/cnic_document-\d+-[a-f0-9]+\.png$/,
      );
    });
  });

  describe('Zero-Trust Administrative Access & Sudo Verification', () => {
    let stepUpAuth: StepUpAuthService;
    let policyEngine: PolicyEngineService;
    let redisStore: Map<string, string>;

    beforeEach(() => {
      redisStore = new Map<string, string>();
      const mockRedis = {
        getClient: () => ({
          set: async (key: string, val: string) => {
            redisStore.set(key, val);
            return 'OK';
          },
          get: async (key: string) => redisStore.get(key) || null,
          keys: async () => Array.from(redisStore.keys()),
          del: async (...keys: string[]) => keys.forEach((k) => redisStore.delete(k)),
        }),
      };
      stepUpAuth = new StepUpAuthService(mockRedis as unknown as RedisService);
      policyEngine = new PolicyEngineService();
    });

    it('requires valid temporary step-up token for sensitive administrative actions', async () => {
      const adminId = 'super-admin-1';
      const sudoToken = await stepUpAuth.grantStepUpSession(
        adminId,
        SensitiveAdminAction.ROLE_CHANGE,
      );

      expect(sudoToken).toBeDefined();
      await expect(
        stepUpAuth.assertStepUpVerified(adminId, SensitiveAdminAction.ROLE_CHANGE, sudoToken),
      ).resolves.not.toThrow();

      // Expired or wrong token is rejected
      await expect(
        stepUpAuth.assertStepUpVerified(
          adminId,
          SensitiveAdminAction.ROLE_CHANGE,
          'expired_sudo_token',
        ),
      ).rejects.toThrow();
    });

    it('enforces that only SUPER_ADMIN can execute role assignment', () => {
      const regularAdmin = { id: 'admin-1', roles: [UserRole.ADMIN] };
      const superAdmin = { id: 'super-admin-1', roles: [UserRole.SUPER_ADMIN] };

      expect(() => policyEngine.assertCanChangeRole(regularAdmin, UserRole.ADMIN)).toThrow();
      expect(() => policyEngine.assertCanChangeRole(superAdmin, UserRole.ADMIN)).not.toThrow();
    });

    it('Audit Log Immutability: absolutely prohibits altering or purging audit records', () => {
      const superAdmin = { id: 'super-admin-1', roles: [UserRole.SUPER_ADMIN] };
      expect(() => policyEngine.assertCanModifyAuditLogs(superAdmin)).toThrow(
        /immutable and cannot be edited or deleted/,
      );
    });
  });
});
