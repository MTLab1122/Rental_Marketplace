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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
