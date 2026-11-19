import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { UserRole } from '@rental-peshawar/shared-types';
import { PolicyEngineService, AuthenticatedUserContext } from './policy-engine.service';
import { PasswordService } from './password.service';
import {
  sanitizeHtml,
  escapeCsvCell,
  validateSafeExternalUrl,
  validateImageMagicBytes,
  sanitizeFilePath,
  isDisposableEmail,
} from './sanitization';
import { AbusePreventionService, VelocityAction } from './abuse-prevention.service';
import { StepUpAuthService, SensitiveAdminAction } from './step-up-auth.service';

describe('Security Hardening Test Suite (Phase 16)', () => {
  describe('PolicyEngineService (IDOR Defense & Denial-by-Default)', () => {
    let policyEngine: PolicyEngineService;

    const tenantUser: AuthenticatedUserContext = {
      id: 'tenant-user-123',
      roles: [UserRole.TENANT],
    };

    const landlordUser: AuthenticatedUserContext = {
      id: 'landlord-user-456',
      roles: [UserRole.LANDLORD],
    };

    const adminUser: AuthenticatedUserContext = {
      id: 'admin-user-789',
      roles: [UserRole.ADMIN],
    };

    const superAdminUser: AuthenticatedUserContext = {
      id: 'super-admin-001',
      roles: [UserRole.SUPER_ADMIN],
    };

    const unrelatedUser: AuthenticatedUserContext = {
      id: 'unrelated-user-999',
      roles: [UserRole.TENANT],
    };

    beforeEach(() => {
      policyEngine = new PolicyEngineService();
    });

    it('Profile Access: allows user to access own profile and admin to access any, rejects IDOR attempts', () => {
      expect(() =>
        policyEngine.assertCanAccessProfile(tenantUser, 'tenant-user-123'),
      ).not.toThrow();
      expect(() => policyEngine.assertCanAccessProfile(adminUser, 'tenant-user-123')).not.toThrow();
      expect(() => policyEngine.assertCanAccessProfile(unrelatedUser, 'tenant-user-123')).toThrow(
        ForbiddenException,
      );
    });

    it('Property Management: allows landlord owner or admin, throws NotFoundException (obscuring IDOR) for others', () => {
      const property = { id: 'prop-1', landlordId: 'landlord-user-456' };

      expect(() => policyEngine.assertCanManageProperty(landlordUser, property)).not.toThrow();
      expect(() => policyEngine.assertCanManageProperty(adminUser, property)).not.toThrow();
      expect(() => policyEngine.assertCanManageProperty(unrelatedUser, property)).toThrow(
        NotFoundException,
      );
      expect(() => policyEngine.assertCanManageProperty(landlordUser, null)).toThrow(
        NotFoundException,
      );
    });

    it('Inquiry Access: permits tenant author, listing landlord, or staff; rejects others', () => {
      const inquiry = {
        id: 'inq-1',
        tenantId: 'tenant-user-123',
        property: { landlordId: 'landlord-user-456' },
      };

      expect(() => policyEngine.assertCanAccessInquiry(tenantUser, inquiry)).not.toThrow();
      expect(() => policyEngine.assertCanAccessInquiry(landlordUser, inquiry)).not.toThrow();
      expect(() => policyEngine.assertCanAccessInquiry(adminUser, inquiry)).not.toThrow();
      expect(() => policyEngine.assertCanAccessInquiry(unrelatedUser, inquiry)).toThrow(
        NotFoundException,
      );
    });

    it('Booking Access: permits booking tenant, listing landlord, or admin; rejects unrelated tenant', () => {
      const booking = {
        id: 'book-1',
        tenantId: 'tenant-user-123',
        landlordId: 'landlord-user-456',
      };

      expect(() => policyEngine.assertCanAccessBooking(tenantUser, booking)).not.toThrow();
      expect(() => policyEngine.assertCanAccessBooking(landlordUser, booking)).not.toThrow();
      expect(() => policyEngine.assertCanAccessBooking(adminUser, booking)).not.toThrow();
      expect(() => policyEngine.assertCanAccessBooking(unrelatedUser, booking)).toThrow(
        NotFoundException,
      );
    });

    it('Conversation Access: requires caller to be an active participant', () => {
      const participants = ['tenant-user-123', 'landlord-user-456'];

      expect(() =>
        policyEngine.assertCanMessageInConversation(tenantUser, participants),
      ).not.toThrow();
      expect(() =>
        policyEngine.assertCanMessageInConversation(landlordUser, participants),
      ).not.toThrow();
      expect(() =>
        policyEngine.assertCanMessageInConversation(unrelatedUser, participants),
      ).toThrow(ForbiddenException);
    });

    it('Favorite Access: enforces strict tenant ownership of saved listings', () => {
      expect(() =>
        policyEngine.assertCanManageFavorite(tenantUser, 'tenant-user-123'),
      ).not.toThrow();
      expect(() => policyEngine.assertCanManageFavorite(unrelatedUser, 'tenant-user-123')).toThrow(
        ForbiddenException,
      );
    });

    it('Privilege Escalation: only SUPER_ADMIN can assign SUPER_ADMIN or other roles', () => {
      // Normal admin cannot assign roles
      expect(() => policyEngine.assertCanChangeRole(adminUser, UserRole.SUPER_ADMIN)).toThrow(
        ForbiddenException,
      );

      // Super admin can assign roles
      expect(() =>
        policyEngine.assertCanChangeRole(superAdminUser, UserRole.SUPER_ADMIN),
      ).not.toThrow();
    });

    it('Audit Log Immutability: assertCanModifyAuditLogs unconditionally denies all roles', () => {
      expect(() => policyEngine.assertCanModifyAuditLogs(adminUser)).toThrow(ForbiddenException);
      expect(() => policyEngine.assertCanModifyAuditLogs(superAdminUser)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Password Policy Enforcement', () => {
    let passwordService: PasswordService;

    beforeEach(() => {
      passwordService = new PasswordService();
    });

    it('accepts compliant passwords >= 12 characters with full complexity', () => {
      expect(() => passwordService.validatePasswordStrength('PeshawarSecure2026!')).not.toThrow();
      expect(() =>
        passwordService.validatePasswordStrength('Complex_Pass_2026#Valid'),
      ).not.toThrow();
    });

    it('accepts Unicode passwords >= 12 characters', () => {
      expect(() =>
        passwordService.validatePasswordStrength('PeshawarPass_2026_پښتو!'),
      ).not.toThrow();
    });

    it('rejects passwords shorter than 12 characters', () => {
      expect(() => passwordService.validatePasswordStrength('Short123!Aa')).toThrow(
        BadRequestException,
      );
      expect(() => passwordService.validatePasswordStrength('Pass1!')).toThrow(BadRequestException);
    });

    it('rejects passwords exceeding 128 characters (DoS prevention)', () => {
      const longPass = 'A1!'.repeat(50); // 150 chars
      expect(() => passwordService.validatePasswordStrength(longPass)).toThrow(BadRequestException);
    });

    it('rejects passwords missing digits, uppercase, or special characters', () => {
      expect(() => passwordService.validatePasswordStrength('NoSpecialChars12345')).toThrow(
        BadRequestException,
      );
      expect(() => passwordService.validatePasswordStrength('nouppercasechars123!@')).toThrow(
        BadRequestException,
      );
      expect(() => passwordService.validatePasswordStrength('NOLOWERCASECHARS123!@')).toThrow(
        BadRequestException,
      );
      expect(() => passwordService.validatePasswordStrength('NoDigitsInThisPassword!@')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('Sanitization & Injection Prevention', () => {
    it('HTML sanitization: strips executable script and javascript: URIs', () => {
      const malicious =
        '<p>Clean text <script>alert("XSS")</script><a href="javascript:steal()">link</a></p>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("XSS")');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toBe('Clean text link');
    });

    it('CSV Formula Injection: prefixes dangerous leading characters (=, +, -, @) with single quote', () => {
      expect(escapeCsvCell('=1+1')).toBe("'=1+1");
      expect(escapeCsvCell('+cmd|/c calc')).toBe("'+cmd|/c calc");
      expect(escapeCsvCell('-SUM(A1:A10)')).toBe("'-SUM(A1:A10)");
      expect(escapeCsvCell('@eval(dangerous)')).toBe("'@eval(dangerous)");
      expect(escapeCsvCell('Normal Locality Name')).toBe('Normal Locality Name');
    });

    it('SSRF Validator: blocks loopback, link-local, RFC1918 private ranges, and non-HTTP protocols', () => {
      expect(validateSafeExternalUrl('http://127.0.0.1/admin')).toBe(false);
      expect(validateSafeExternalUrl('http://localhost:3000')).toBe(false);
      expect(validateSafeExternalUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(validateSafeExternalUrl('http://10.0.0.1/internal')).toBe(false);
      expect(validateSafeExternalUrl('http://192.168.1.1/router')).toBe(false);
      expect(validateSafeExternalUrl('http://172.16.0.1/private')).toBe(false);
      expect(validateSafeExternalUrl('file:///etc/passwd')).toBe(false);
      expect(validateSafeExternalUrl('gopher://internal-service')).toBe(false);

      // Allows legitimate public web resources
      expect(validateSafeExternalUrl('https://images.unsplash.com/photo-123')).toBe(true);
      expect(validateSafeExternalUrl('https://api.peshawarrentals.pk/public-data')).toBe(true);
    });

    it('Magic Bytes Validation: verifies authentic image headers and rejects executables', () => {
      const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(12)]);
      const pngBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(8),
      ]);
      const webpBuffer = Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP'),
        Buffer.alloc(4),
      ]);
      const exeBuffer = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(12)]); // DOS MZ executable header

      expect(validateImageMagicBytes(jpegBuffer).valid).toBe(true);
      expect(validateImageMagicBytes(jpegBuffer).format).toBe('JPEG');
      expect(validateImageMagicBytes(pngBuffer).valid).toBe(true);
      expect(validateImageMagicBytes(pngBuffer).format).toBe('PNG');
      expect(validateImageMagicBytes(webpBuffer).valid).toBe(true);
      expect(validateImageMagicBytes(webpBuffer).format).toBe('WEBP');
      expect(validateImageMagicBytes(exeBuffer).valid).toBe(false);
      expect(
        validateImageMagicBytes(Buffer.from('plaintext script that is at least 12 bytes long'))
          .valid,
      ).toBe(false);
    });

    it('File Path Traversal Sanitization: eliminates directory traversing dots and separators', () => {
      expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc_passwd');
      expect(sanitizeFilePath('..\\..\\windows\\system32')).toBe('windows_system32');
      expect(sanitizeFilePath('safe-file_123.jpg')).toBe('safe-file_123.jpg');
    });

    it('Disposable Email Filter: detects and rejects temporary mailbox domains', () => {
      expect(isDisposableEmail('attacker@mailinator.com')).toBe(true);
      expect(isDisposableEmail('test@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('fraudster@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('legitimate.tenant@gmail.com')).toBe(false);
      expect(isDisposableEmail('student@uop.edu.pk')).toBe(false);
    });
  });

  describe('Abuse Prevention & Velocity Limiting', () => {
    let abuseService: AbusePreventionService;
    let mockRedis: any;
    let store: Map<string, number>;

    beforeEach(() => {
      store = new Map<string, number>();
      mockRedis = {
        getClient: () => ({
          incr: async (key: string) => {
            const val = (store.get(key) || 0) + 1;
            store.set(key, val);
            return val;
          },
          expire: async () => 1,
          get: async (key: string) => store.get(key)?.toString() || null,
        }),
      };
      abuseService = new AbusePreventionService(mockRedis as any);
    });

    it('allows requests within velocity thresholds and blocks exceeding requests with 429', async () => {
      const userId = 'tenant-bot-1';

      // SEND_MESSAGE limit is 30/min
      for (let i = 0; i < 30; i++) {
        await expect(
          abuseService.checkVelocity(VelocityAction.SEND_MESSAGE, userId),
        ).resolves.not.toThrow();
      }

      // 31st request triggers rate limit exception
      await expect(abuseService.checkVelocity(VelocityAction.SEND_MESSAGE, userId)).rejects.toThrow(
        HttpException,
      );
    });

    it('validateRegistrationEmail rejects disposable emails with BAD_REQUEST', () => {
      expect(() => abuseService.validateRegistrationEmail('bot@tempmail.com')).toThrow(
        HttpException,
      );
      expect(() => abuseService.validateRegistrationEmail('tenant@gmail.com')).not.toThrow();
    });
  });

  describe('Step-Up Authentication & Elevated Admin Grants', () => {
    let stepUpService: StepUpAuthService;
    let redisStore: Map<string, string>;
    let mockRedis: any;

    beforeEach(() => {
      redisStore = new Map<string, string>();
      mockRedis = {
        getClient: () => ({
          set: async (key: string, val: string) => {
            redisStore.set(key, val);
            return 'OK';
          },
          get: async (key: string) => redisStore.get(key) || null,
          keys: async (_pattern: string) => Array.from(redisStore.keys()),
          del: async (...keys: string[]) => keys.forEach((k) => redisStore.delete(k)),
        }),
      };
      stepUpService = new StepUpAuthService(mockRedis as any);
    });

    it('grants and verifies sudo tokens for sensitive operations', async () => {
      const adminId = 'admin-42';
      const token = await stepUpService.grantStepUpSession(
        adminId,
        SensitiveAdminAction.ROLE_CHANGE,
      );

      expect(token).toMatch(/^sudo_\d+_/);
      await expect(
        stepUpService.assertStepUpVerified(adminId, SensitiveAdminAction.ROLE_CHANGE, token),
      ).resolves.not.toThrow();
    });

    it('rejects missing or invalid step-up tokens', async () => {
      const adminId = 'admin-42';

      await expect(
        stepUpService.assertStepUpVerified(adminId, SensitiveAdminAction.USER_DELETION, undefined),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        stepUpService.assertStepUpVerified(
          adminId,
          SensitiveAdminAction.USER_DELETION,
          'invalid_sudo_token',
        ),
      ).rejects.toThrow();
    });
  });
});
