import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { LandlordPropertyController } from './landlord-property.controller';
import { PublicPropertyController } from './public-property.controller';
import { AdminPropertyController } from './admin-property.controller';
import { LocalityModule } from '../locality/locality.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [LocalityModule, NotificationModule],
  controllers: [PublicPropertyController, LandlordPropertyController, AdminPropertyController],
  providers: [PropertyService, AuditService, TokenService],
  exports: [PropertyService],
})
export class PropertyModule {}
