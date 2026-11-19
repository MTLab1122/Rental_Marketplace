import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AiServiceImpl } from './ai.service';
import { ListingQualityService } from './listing-quality.service';
import { SemanticSearchService } from './semantic-search.service';
import { FraudDetectionService } from './fraud-detection.service';
import { ContentModerationService } from './content-moderation.service';
import { PricingIntelligenceService } from './pricing-intelligence.service';
import { MarketplaceIntelligenceService } from './marketplace-intelligence.service';
import { LandlordAiController } from './landlord-ai.controller';
import { SemanticSearchController } from './semantic-search.controller';
import { AdminRiskController } from './admin-risk.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [LandlordAiController, SemanticSearchController, AdminRiskController],
  providers: [
    AiServiceImpl,
    ListingQualityService,
    SemanticSearchService,
    FraudDetectionService,
    ContentModerationService,
    PricingIntelligenceService,
    MarketplaceIntelligenceService,
  ],
  exports: [
    AiServiceImpl,
    ListingQualityService,
    SemanticSearchService,
    FraudDetectionService,
    ContentModerationService,
    PricingIntelligenceService,
    MarketplaceIntelligenceService,
  ],
})
export class AiModule {}
