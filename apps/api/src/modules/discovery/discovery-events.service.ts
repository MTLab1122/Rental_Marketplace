import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PropertyImpressionRequestDto,
  PropertyClickRequestDto,
  SearchQueryEventRequestDto,
} from './dto/events.dto';

@Injectable()
export class DiscoveryEventsService {
  private readonly logger = new Logger(DiscoveryEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a property impression event.
   */
  async recordImpression(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: PropertyImpressionRequestDto,
  ) {
    const impression = await this.prisma.propertyImpression.create({
      data: {
        propertyId: dto.propertyId,
        userId: userId || null,
        sessionId: dto.sessionId || sessionId || null,
        surface: dto.surface,
        position: dto.position,
        metadata: dto.metadata as any,
      },
    });

    // Increment locality demand impression metric asynchronously
    this.updateLocalityDemandMetric(dto.propertyId, 'impression').catch(() => {});

    return { success: true, id: impression.id };
  }

  /**
   * Records a property click event.
   */
  async recordClick(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: PropertyClickRequestDto,
  ) {
    const click = await this.prisma.propertyClick.create({
      data: {
        propertyId: dto.propertyId,
        userId: userId || null,
        sessionId: dto.sessionId || sessionId || null,
        surface: dto.surface,
        position: dto.position,
        metadata: dto.metadata as any,
      },
    });

    // Also record recently viewed property
    this.prisma.recentlyViewedProperty
      .create({
        data: {
          propertyId: dto.propertyId,
          userId: userId || null,
          sessionId: dto.sessionId || sessionId || null,
          source: dto.surface,
        },
      })
      .catch((err) =>
        this.logger.warn(`Failed to record recently viewed property: ${err.message}`),
      );

    // Increment locality demand click metric asynchronously
    this.updateLocalityDemandMetric(dto.propertyId, 'click').catch(() => {});

    return { success: true, id: click.id };
  }

  /**
   * Records a search query log.
   */
  async recordSearchQuery(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: SearchQueryEventRequestDto,
  ) {
    const log = await this.prisma.searchQueryLog.create({
      data: {
        userId: userId || null,
        sessionId: dto.sessionId || sessionId || null,
        queryText: dto.queryText || null,
        filters: dto.filters as any,
        localityId: dto.localityId || null,
        resultsCount: dto.resultsCount || 0,
        executionTimeMs: dto.executionTimeMs,
      },
    });

    // Increment locality demand search metric
    if (dto.localityId) {
      const today = new Date(new Date().toISOString().split('T')[0] as string);
      this.prisma.localityDemandSnapshot
        .upsert({
          where: {
            localityId_period_snapshotDate: {
              localityId: dto.localityId,
              period: 'DAILY',
              snapshotDate: today,
            },
          },
          update: {
            searchCount: { increment: 1 },
          },
          create: {
            localityId: dto.localityId,
            period: 'DAILY',
            snapshotDate: today,
            searchCount: 1,
          },
        })
        .catch((err) =>
          this.logger.warn(`Failed to update locality demand snapshot: ${err.message}`),
        );
    }

    return { success: true, id: log.id };
  }

  /**
   * Helper to increment impression or click counter on LocalityDemandSnapshot.
   */
  private async updateLocalityDemandMetric(propertyId: string, metric: 'impression' | 'click') {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { localityId: true },
    });

    if (!prop?.localityId) return;

    const today = new Date(new Date().toISOString().split('T')[0] as string);
    await this.prisma.localityDemandSnapshot.upsert({
      where: {
        localityId_period_snapshotDate: {
          localityId: prop.localityId,
          period: 'DAILY',
          snapshotDate: today,
        },
      },
      update: {
        ...(metric === 'impression'
          ? { impressionCount: { increment: 1 } }
          : { clickCount: { increment: 1 } }),
      },
      create: {
        localityId: prop.localityId,
        period: 'DAILY',
        snapshotDate: today,
        ...(metric === 'impression' ? { impressionCount: 1 } : { clickCount: 1 }),
      },
    });
  }

  /**
   * Locality demand heatmap and snapshots.
   */
  async getLocalityDemand(localityId?: string, period = 'DAILY') {
    const where: any = { period };
    if (localityId) where.localityId = localityId;

    const snapshots = await this.prisma.localityDemandSnapshot.findMany({
      where,
      orderBy: { snapshotDate: 'desc' },
      take: 30,
      include: {
        locality: { select: { id: true, name: true, slug: true } },
      },
    });

    return snapshots;
  }

  /**
   * Comprehensive analytics summary for Admin dashboard.
   */
  async getAnalyticsSummary() {
    const totalImpressions = await this.prisma.propertyImpression.count();
    const totalClicks = await this.prisma.propertyClick.count();
    const totalSearches = await this.prisma.searchQueryLog.count();
    const totalSavedSearches = await this.prisma.savedSearch.count();
    const totalAlertsDelivered = await this.prisma.searchAlertDelivery.count({
      where: { status: 'DELIVERED' },
    });

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    // Top searched localities
    const topSearches = await this.prisma.searchQueryLog.groupBy({
      by: ['localityId'],
      where: { localityId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Locality names
    const localityDetails = await this.prisma.locality.findMany({
      where: { id: { in: topSearches.map((s) => s.localityId!).filter(Boolean) } },
      select: { id: true, name: true },
    });
    const localityMap = new Map(localityDetails.map((l) => [l.id, l.name]));

    const popularLocalities = topSearches.map((s) => ({
      localityId: s.localityId,
      localityName: localityMap.get(s.localityId!) || 'Unknown',
      searches: s._count.id,
    }));

    return {
      totalImpressions,
      totalClicks,
      ctrPercent: Number(ctr),
      totalSearches,
      totalSavedSearches,
      totalAlertsDelivered,
      popularLocalities,
    };
  }
}
