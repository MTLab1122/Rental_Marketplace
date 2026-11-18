import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MfaService } from './services/mfa.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminAuthController,
    AdminUserController,
    AdminAnalyticsController,
    AdminAuditController,
    AdminSettingsController,
  ],
  providers: [MfaService, AdminUserService, AdminAnalyticsService, AdminSettingsService],
  exports: [MfaService, AdminUserService, AdminAnalyticsService, AdminSettingsService],
})
export class AdminModule {}
