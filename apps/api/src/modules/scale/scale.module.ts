import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ReliabilityService } from './reliability.service';
import { ExperimentationService } from './experimentation.service';
import { ScaleController } from './scale.controller';

@Module({
  controllers: [ScaleController],
  providers: [CircuitBreakerService, ReliabilityService, ExperimentationService],
  exports: [CircuitBreakerService, ReliabilityService, ExperimentationService],
})
export class ScaleModule {}
