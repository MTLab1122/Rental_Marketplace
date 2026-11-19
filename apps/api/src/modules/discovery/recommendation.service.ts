import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PropertyEligibility,
  PropertyStatus,
  TenantType,
  RecommendationReason,
  RecommendationType,
} from '@rental-peshawar/shared-types';

export interface RecommendationResult {
  property: any;
  type: RecommendationType;
  reason: RecommendationReason;
  reasonLabel: string;
  score: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe mapping of Prisma property entity to client-ready summary.
   */
  private mapPropertyToPublicSummary(p: any) {
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      eligibility: p.eligibility,
      propertyType: p.propertyType,
      monthlyRentPkr: Number(p.monthlyRentPkr),
      securityDepositPkr: Number(p.securityDepositPkr),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqFt: p.areaSqFt ? Number(p.areaSqFt) : null,
      furnishing: p.furnishing,
      addressNote: p.addressNote,
      locality: p.locality
        ? {
            id: p.locality.id,
            name: p.locality.name,
            slug: p.locality.slug,
            postalCode: p.locality.postalCode,
          }
        : undefined,
      coordinates: {
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      },
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      inquiryCount: p.inquiryCount,
      favoriteCount: p.favoriteCount,
      images: p.images || [],
      amenities: p.amenities ? p.amenities.map((a: any) => a.amenity || a) : [],
      createdAt: p.createdAt,
      landlordId: p.landlordId,
      landlord: p.landlord
        ? {
            id: p.landlord.id,
            name: p.landlord.fullName,
            isVerified: p.landlord.isVerified,
            createdAt: p.landlord.createdAt,
          }
        : undefined,
    };
  }

  /**
   * Personalized "For You" recommendation feed.
   * Strictly enforces Student vs Family segregation.
   * Leverages saved searches, recently viewed properties, favorites, and quality scores.
   */
  async getForYou(
    userId?: string,
    tenantType?: TenantType,
    limit = 10,
    sessionId?: string,
  ): Promise<RecommendationResult[]> {
    // Determine strict eligibility requirement
    let requiredEligibility: PropertyEligibility | undefined;
    if (tenantType === TenantType.STUDENT) {
      requiredEligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (tenantType === TenantType.FAMILY) {
      requiredEligibility = PropertyEligibility.FAMILIES_ONLY;
    }

    // 1. Collect user preference signals if userId is present
    const favoredLocalityIds = new Set<string>();
    const favoredPropertyTypes = new Set<string>();
    const recentlyViewedPropertyIds = new Set<string>();
    const inquiredPropertyIds = new Set<string>();
    let avgTargetPrice = 0;
    let priceSamples = 0;

    if (userId) {
      // User tenant profile check
      if (!requiredEligibility) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { tenantProfile: true },
        });
        if (user?.tenantProfile?.tenantType === TenantType.STUDENT) {
          requiredEligibility = PropertyEligibility.STUDENTS_ONLY;
        } else if (user?.tenantProfile?.tenantType === TenantType.FAMILY) {
          requiredEligibility = PropertyEligibility.FAMILIES_ONLY;
        }
      }

      // User favorites
      const favorites = await this.prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              localityId: true,
              propertyType: true,
              monthlyRentPkr: true,
            },
          },
        },
        take: 20,
      });
      for (const fav of favorites) {
        if (fav.property) {
          favoredLocalityIds.add(fav.property.localityId);
          favoredPropertyTypes.add(fav.property.propertyType);
          avgTargetPrice += Number(fav.property.monthlyRentPkr);
          priceSamples++;
        }
      }

      // User recently viewed
      const views = await this.prisma.recentlyViewedProperty.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              localityId: true,
              propertyType: true,
              monthlyRentPkr: true,
            },
          },
        },
        orderBy: { viewedAt: 'desc' },
        take: 20,
      });
      for (const v of views) {
        recentlyViewedPropertyIds.add(v.propertyId);
        favoredLocalityIds.add(v.property.localityId);
        favoredPropertyTypes.add(v.property.propertyType);
        avgTargetPrice += Number(v.property.monthlyRentPkr);
        priceSamples++;
      }

      // User saved searches
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: { userId },
        take: 10,
      });
      for (const s of savedSearches) {
        if (s.localityId) favoredLocalityIds.add(s.localityId);
        if (s.propertyType) favoredPropertyTypes.add(s.propertyType);
        if (s.minPrice && s.maxPrice) {
          avgTargetPrice += (Number(s.minPrice) + Number(s.maxPrice)) / 2;
          priceSamples++;
        }
      }

      // Exclude already inquired properties where inquiry is active
      const inquiries = await this.prisma.inquiry.findMany({
        where: { tenantId: userId },
        select: { propertyId: true },
      });
      for (const inq of inquiries) {
        inquiredPropertyIds.add(inq.propertyId);
      }
    } else if (sessionId) {
      // Guest session views
      const views = await this.prisma.recentlyViewedProperty.findMany({
        where: { sessionId },
        include: {
          property: {
            select: {
              id: true,
              localityId: true,
              propertyType: true,
              monthlyRentPkr: true,
            },
          },
        },
        orderBy: { viewedAt: 'desc' },
        take: 10,
      });
      for (const v of views) {
        recentlyViewedPropertyIds.add(v.propertyId);
        favoredLocalityIds.add(v.property.localityId);
        favoredPropertyTypes.add(v.property.propertyType);
      }
    }

    const targetPrice = priceSamples > 0 ? avgTargetPrice / priceSamples : null;

    // 2. Query available, approved properties satisfying eligibility
    const candidateProperties = await this.prisma.property.findMany({
      where: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        locality: { isActive: true },
        ...(requiredEligibility ? { eligibility: requiredEligibility } : {}),
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        qualitySnapshots: {
          take: 1,
          orderBy: { snapshotDate: 'desc' },
          select: { overallQualityScore: true },
        },
        landlord: {
          select: { id: true, fullName: true, isVerified: true, createdAt: true },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const results: RecommendationResult[] = [];
    const now = Date.now();

    for (const prop of candidateProperties) {
      // Exclude already inquired active properties
      if (inquiredPropertyIds.has(prop.id)) {
        continue;
      }

      let score = 50; // base score
      let reason: RecommendationReason = RecommendationReason.POPULAR_IN_LOCALITY;
      let reasonLabel = `Popular in ${prop.locality.name}`;

      // Signal A: Locality Affinity (+25)
      if (favoredLocalityIds.has(prop.localityId)) {
        score += 25;
        reason = RecommendationReason.POPULAR_IN_LOCALITY;
        reasonLabel = `Recommended based on your interest in ${prop.locality.name}`;
      }

      // Signal B: Property Type Affinity (+15)
      if (favoredPropertyTypes.has(prop.propertyType)) {
        score += 15;
      }

      // Signal C: Budget / Rent Affinity (+20)
      const rent = Number(prop.monthlyRentPkr);
      if (targetPrice && Math.abs(rent - targetPrice) / targetPrice <= 0.25) {
        score += 20;
        reason = RecommendationReason.WITHIN_BUDGET;
        reasonLabel = 'Matches your target budget';
      }

      // Signal D: Quality Score Bonus (up to +20)
      const qualityScore = prop.qualitySnapshots?.[0]?.overallQualityScore
        ? Number(prop.qualitySnapshots[0].overallQualityScore)
        : 70;
      score += (qualityScore / 100) * 20;

      // Signal E: Freshness / New in Area (+15 if < 5 days old)
      const ageDays = (now - prop.createdAt.getTime()) / (1000 * 3600 * 24);
      if (ageDays <= 5) {
        score += 15;
        if (reason === RecommendationReason.POPULAR_IN_LOCALITY) {
          reason = RecommendationReason.NEW_IN_AREA;
          reasonLabel = `New listing in ${prop.locality.name}`;
        }
      }

      // Signal F: Similar to Favorites
      if (
        userId &&
        favoredLocalityIds.has(prop.localityId) &&
        favoredPropertyTypes.has(prop.propertyType)
      ) {
        reason = RecommendationReason.SIMILAR_TO_FAVORITES;
        reasonLabel = 'Similar to your saved favorites';
      }

      // Signal G: Because You Viewed
      if (recentlyViewedPropertyIds.size > 0 && favoredLocalityIds.has(prop.localityId)) {
        reason = RecommendationReason.BECAUSE_YOU_VIEWED;
        reasonLabel = `Because you viewed listings in ${prop.locality.name}`;
      }

      results.push({
        property: this.mapPropertyToPublicSummary(prop),
        type: RecommendationType.FOR_YOU,
        reason,
        reasonLabel,
        score: Math.min(100, Math.round(score)),
        metadata: {
          localityName: prop.locality.name,
          ageDays: Math.round(ageDays),
          qualityScore,
        },
      });
    }

    // Sort by recommendation score descending
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    // Asynchronously log served recommendations
    if (userId || sessionId) {
      const logs = topResults.map((r) => ({
        userId: userId || null,
        sessionId: sessionId || null,
        propertyId: r.property.id,
        recommendationType: r.type,
        reason: r.reason,
        score: r.score,
        action: 'SERVED',
        metadata: r.metadata as any,
      }));

      this.prisma.recommendationEvent
        .createMany({ data: logs })
        .catch((err) => this.logger.warn(`Failed to log recommendation events: ${err.message}`));
    }

    return topResults;
  }

  /**
   * Similar properties suggestion (e.g. for property detail page carousel).
   * Strict eligibility enforcement (Students -> Students, Family -> Family).
   */
  async getSimilar(
    propertyId: string,
    currentUser?: { sub?: string; tenantType?: TenantType },
    limit = 6,
  ): Promise<RecommendationResult[]> {
    const target = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { locality: true },
    });

    if (!target) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    // Determine eligibility requirement
    let eligibility = target.eligibility;
    if (currentUser?.tenantType === TenantType.STUDENT) {
      eligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (currentUser?.tenantType === TenantType.FAMILY) {
      eligibility = PropertyEligibility.FAMILIES_ONLY;
    }

    const targetRent = Number(target.monthlyRentPkr);
    const minRent = targetRent * 0.7;
    const maxRent = targetRent * 1.3;

    // Find similar properties: same eligibility, same locality or price range
    const similar = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId },
        eligibility,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        locality: { isActive: true },
        monthlyRentPkr: { gte: minRent, lte: maxRent },
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        landlord: {
          select: { id: true, fullName: true, isVerified: true, createdAt: true },
        },
      },
      take: limit * 2,
      orderBy: { createdAt: 'desc' },
    });

    const results: RecommendationResult[] = similar.map((p) => {
      let score = 70;
      let reason: RecommendationReason = RecommendationReason.SIMILAR_TO_FAVORITES;
      let reasonLabel = 'Similar price and specifications';

      if (p.localityId === target.localityId) {
        score += 20;
        reason = RecommendationReason.POPULAR_IN_LOCALITY;
        reasonLabel = `Also located in ${target.locality.name}`;
      }
      if (p.propertyType === target.propertyType) {
        score += 10;
      }

      return {
        property: this.mapPropertyToPublicSummary(p),
        type: RecommendationType.SIMILAR,
        reason,
        reasonLabel,
        score: Math.min(100, score),
        metadata: {
          targetPropertyId: propertyId,
          priceDeltaPkr: Math.abs(Number(p.monthlyRentPkr) - targetRent),
        },
      };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Nearby properties based on locality or geographic coordinates.
   */
  async getNearby(
    localityId?: string,
    _latitude?: number,
    _longitude?: number,
    currentUser?: { sub?: string; tenantType?: TenantType },
    limit = 6,
  ): Promise<RecommendationResult[]> {
    let eligibility: PropertyEligibility | undefined;
    if (currentUser?.tenantType === TenantType.STUDENT) {
      eligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (currentUser?.tenantType === TenantType.FAMILY) {
      eligibility = PropertyEligibility.FAMILIES_ONLY;
    }

    const where: any = {
      status: PropertyStatus.APPROVED,
      isAvailable: true,
      deletedAt: null,
      locality: { isActive: true },
      ...(eligibility ? { eligibility } : {}),
      ...(localityId ? { localityId } : {}),
    };

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        landlord: {
          select: { id: true, fullName: true, isVerified: true, createdAt: true },
        },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
    });

    return properties.map((p) => ({
      property: this.mapPropertyToPublicSummary(p),
      type: RecommendationType.NEARBY,
      reason: RecommendationReason.POPULAR_IN_LOCALITY,
      reasonLabel: `Top rated in ${p.locality.name}`,
      score: 85,
      metadata: { localityId: p.localityId, localityName: p.locality.name },
    }));
  }

  /**
   * Trending properties (highest engagement in Peshawar within current period).
   */
  async getTrending(
    currentUser?: { sub?: string; tenantType?: TenantType },
    localityId?: string,
    limit = 6,
  ): Promise<RecommendationResult[]> {
    let eligibility: PropertyEligibility | undefined;
    if (currentUser?.tenantType === TenantType.STUDENT) {
      eligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (currentUser?.tenantType === TenantType.FAMILY) {
      eligibility = PropertyEligibility.FAMILIES_ONLY;
    }

    const properties = await this.prisma.property.findMany({
      where: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        locality: { isActive: true },
        ...(eligibility ? { eligibility } : {}),
        ...(localityId ? { localityId } : {}),
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        landlord: {
          select: { id: true, fullName: true, isVerified: true, createdAt: true },
        },
      },
      take: limit,
      orderBy: [{ favoriteCount: 'desc' }, { viewCount: 'desc' }],
    });

    return properties.map((p) => ({
      property: this.mapPropertyToPublicSummary(p),
      type: RecommendationType.TRENDING,
      reason: RecommendationReason.POPULAR_IN_LOCALITY,
      reasonLabel: `Trending now in ${p.locality.name}`,
      score: 92,
      metadata: {
        favorites: p.favoriteCount,
        views: p.viewCount,
      },
    }));
  }

  /**
   * Recently viewed properties feed.
   */
  async getRecentlyViewed(
    userId?: string,
    sessionId?: string,
    currentUser?: { sub?: string; tenantType?: TenantType },
    limit = 10,
  ) {
    if (!userId && !sessionId) {
      return [];
    }

    let eligibility: PropertyEligibility | undefined;
    if (currentUser?.tenantType === TenantType.STUDENT) {
      eligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (currentUser?.tenantType === TenantType.FAMILY) {
      eligibility = PropertyEligibility.FAMILIES_ONLY;
    }

    const views = await this.prisma.recentlyViewedProperty.findMany({
      where: {
        ...(userId ? { userId } : { sessionId }),
        property: {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          deletedAt: null,
          locality: { isActive: true },
          ...(eligibility ? { eligibility } : {}),
        },
      },
      include: {
        property: {
          include: {
            locality: true,
            images: { orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
            landlord: {
              select: { id: true, fullName: true, isVerified: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    // Deduplicate by propertyId
    const seen = new Set<string>();
    const uniqueList: any[] = [];
    for (const v of views) {
      if (!seen.has(v.propertyId)) {
        seen.add(v.propertyId);
        uniqueList.push(this.mapPropertyToPublicSummary(v.property));
      }
    }

    return uniqueList;
  }
}
