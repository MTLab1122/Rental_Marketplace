import { Module } from '@nestjs/common';
import { SupplyService } from './supply.service';
import { SupplyController } from './supply.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplyController],
  providers: [SupplyService],
  exports: [SupplyService],
})
export class SupplyModule {}
