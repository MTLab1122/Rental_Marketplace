import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PasswordService } from './password.service';
import { TokenHashService } from './token-hash.service';
import { PolicyEngineService } from './policy-engine.service';
import { StepUpAuthService } from './step-up-auth.service';
import { AbusePreventionService } from './abuse-prevention.service';
import { SecurityEventService } from './security-event.service';
import { SecurityDetectionService } from './security-detection.service';
import { IncidentResponseService } from './incident-response.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    PasswordService,
    TokenHashService,
    PolicyEngineService,
    StepUpAuthService,
    AbusePreventionService,
    SecurityEventService,
    SecurityDetectionService,
    IncidentResponseService,
  ],
  exports: [
    PasswordService,
    TokenHashService,
    PolicyEngineService,
    StepUpAuthService,
    AbusePreventionService,
    SecurityEventService,
    SecurityDetectionService,
    IncidentResponseService,
  ],
})
export class SecurityModule {}
