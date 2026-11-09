import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PasswordService } from '../../common/security/password.service';
import { TokenHashService } from '../../common/security/token-hash.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { AuditService } from '../../common/audit/audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') ||
          'dev_jwt_access_secret_min_32_characters_long_12345',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    TokenHashService,
    RateLimiterService,
    AuditService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    OwnershipGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    TokenHashService,
    RateLimiterService,
    AuditService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    OwnershipGuard,
    JwtModule,
  ],
})
export class AuthModule {}
