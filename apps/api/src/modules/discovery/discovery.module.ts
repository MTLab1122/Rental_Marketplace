import { Module } from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import { RecommendationService } from './recommendation.service';
import { DiscoveryEventsService } from './discovery-events.service';
import { SavedSearchController, NotificationPreferenceController } from './saved-search.controller';
import { RecommendationController } from './recommendation.controller';
import { EventsController } from './events.controller';
import { DiscoveryAdminController } from './discovery-admin.controller';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationModule, AuthModule],
  controllers: [
    SavedSearchController,
    NotificationPreferenceController,
    RecommendationController,
    EventsController,
    DiscoveryAdminController,
  ],
  providers: [SavedSearchService, RecommendationService, DiscoveryEventsService],
  exports: [SavedSearchService, RecommendationService, DiscoveryEventsService],
})
export class DiscoveryModule {}
