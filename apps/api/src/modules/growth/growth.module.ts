import { Module } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
