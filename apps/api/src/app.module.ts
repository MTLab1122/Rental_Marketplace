import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocalityModule } from './modules/locality/locality.module';
import { PropertyModule } from './modules/property/property.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MediaModule } from './modules/media/media.module';
import { VerificationModule } from './modules/verification/verification.module';
import { ReportModule } from './modules/report/report.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupplyModule } from './modules/supply/supply.module';
import { GrowthModule } from './modules/growth/growth.module';
import { MonetizationModule } from './modules/monetization/monetization.module';
import { SupportModule } from './modules/support/support.module';
import { ReviewModule } from './modules/review/review.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { EventsModule } from './modules/events/events.module';
import { CacheModule } from './modules/cache/cache.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DataPlatformModule } from './modules/data-platform/data-platform.module';
import { ScaleModule } from './modules/scale/scale.module';
import { AiModule } from './modules/ai/ai.module';
import { RequestIdMiddleware, REQUEST_ID_HEADER } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req) => ({
          requestId: req.headers[REQUEST_ID_HEADER],
        }),
        level: process.env['LOG_LEVEL'] || 'info',
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                },
              }
            : undefined,
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    LocalityModule,
    PropertyModule,
    NotificationModule,
    MediaModule,
    VerificationModule,
    ReportModule,
    FavoriteModule,
    InquiryModule,
    ConversationModule,
    AdminModule,
    SupplyModule,
    GrowthModule,
    MonetizationModule,
    SupportModule,
    ReviewModule,
    DiscoveryModule,
    BookingModule,
    PaymentModule,
    EventsModule,
    CacheModule,
    JobsModule,
    DataPlatformModule,
    ScaleModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
