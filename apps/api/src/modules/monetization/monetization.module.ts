import { Module } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { MonetizationController } from './monetization.controller';
import { MarketingAutomationService } from './marketing-automation.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MonetizationController],
  providers: [MonetizationService, MarketingAutomationService],
  exports: [MonetizationService, MarketingAutomationService],
})
export class MonetizationModule {}
