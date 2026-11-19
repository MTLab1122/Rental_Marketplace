import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReputationService } from './reputation.service';
import { ReviewController } from './review.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReputationService],
  exports: [ReviewService, ReputationService],
})
export class ReviewModule {}
