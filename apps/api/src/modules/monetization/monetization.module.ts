import { Module } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { MonetizationController } from './monetization.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MonetizationController],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
