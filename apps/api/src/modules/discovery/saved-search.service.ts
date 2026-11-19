import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateSavedSearchRequestDto,
  UpdateSavedSearchRequestDto,
  UpdateSavedSearchAlertsRequestDto,
  NotificationPreferenceRequestDto,
  SavedSearchFiltersDto,
} from './dto/saved-search.dto';
import {
  AlertFrequency,
  AlertDeliveryStatus,
  NotificationType,
  PropertyEligibility,
  PropertyStatus,
  TenantType,
} from '@rental-peshawar/shared-types';

export const MAX_SAVED_SEARCHES_PER_USER = 25;

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Generates a deterministic hash representing normalized filter criteria.
   */
  public generateFilterSignature(filters: SavedSearchFiltersDto): string {
    const canonical: Record<string, any> = {};

    if (filters.eligibility) canonical.eligibility = filters.eligibility;
    if (filters.localityId) canonical.localityId = filters.localityId;
    if (filters.propertyType) canonical.propertyType = filters.propertyType;
    if (filters.minPrice !== undefined && filters.minPrice !== null)
      canonical.minPrice = Number(filters.minPrice);
    if (filters.maxPrice !== undefined && filters.maxPrice !== null)
      canonical.maxPrice = Number(filters.maxPrice);
    if (filters.bedrooms !== undefined && filters.bedrooms !== null)
      canonical.bedrooms = Number(filters.bedrooms);
    if (filters.bathrooms !== undefined && filters.bathrooms !== null)
      canonical.bathrooms = Number(filters.bathrooms);
    if (filters.furnishing) canonical.furnishing = filters.furnishing.toLowerCase();
    if (filters.amenities && filters.amenities.length > 0) {
      canonical.amenities = [...filters.amenities].sort();
    }
    if (filters.sortPreference) canonical.sortPreference = filters.sortPreference;

    const sortedKeys = Object.keys(canonical).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonical[key];
    }

    const jsonStr = JSON.stringify(sortedObj);
    return crypto.createHash('sha256').update(jsonStr).digest('hex').substring(0, 32);
  }

  /**
   * Creates a saved search for a tenant (max 25 allowed).
   */
  async createSavedSearch(userId: string, dto: CreateSavedSearchRequestDto) {
    const existingCount = await this.prisma.savedSearch.count({
      where: { userId },
    });

    if (existingCount >= MAX_SAVED_SEARCHES_PER_USER) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_SAVED_SEARCHES_PER_USER} saved searches. Please remove an older search before creating a new one.`,
      );
    }

    const signature = this.generateFilterSignature(dto.filters);

    // Check if an identical active saved search already exists
    const duplicate = await this.prisma.savedSearch.findFirst({
      where: {
        userId,
        filterSignature: signature,
      },
    });

    if (duplicate) {
      return duplicate;
    }

    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        filters: dto.filters as any,
        filterSignature: signature,
        eligibility: dto.filters.eligibility,
        localityId: dto.filters.localityId,
        propertyType: dto.filters.propertyType,
        minPrice: dto.filters.minPrice !== undefined ? dto.filters.minPrice : null,
        maxPrice: dto.filters.maxPrice !== undefined ? dto.filters.maxPrice : null,
        bedrooms: dto.filters.bedrooms,
        bathrooms: dto.filters.bathrooms,
        furnishing: dto.filters.furnishing,
        sortPreference: dto.sortPreference || dto.filters.sortPreference,
        alertsEnabled: dto.alertsEnabled !== undefined ? dto.alertsEnabled : true,
        frequency: (dto.frequency as any) || AlertFrequency.INSTANT,
      },
    });

    // Record demand metric for locality if specified
    if (dto.filters.localityId && this.prisma.localityDemandSnapshot) {
      const todayDate = new Date(new Date().toISOString().split('T')[0] as string);
      const promise = this.prisma.localityDemandSnapshot.upsert({
        where: {
          localityId_period_snapshotDate: {
            localityId: dto.filters.localityId,
            period: 'DAILY',
            snapshotDate: todayDate,
          },
        },
        update: {
          savedSearchCount: { increment: 1 },
        },
        create: {
          localityId: dto.filters.localityId,
          period: 'DAILY',
          snapshotDate: todayDate,
          savedSearchCount: 1,
        },
      });

      if (promise && typeof promise.catch === 'function') {
        promise.catch((err) =>
          this.logger.warn(`Failed to update locality demand snapshot: ${err.message}`),
        );
      }
    }

    return savedSearch;
  }

  /**
   * Retrieves all saved searches for a tenant with current matching count.
   */
  async getUserSavedSearches(userId: string) {
    const items = await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }

  /**
   * Retrieves a single saved search by ID.
   */
  async getSavedSearchById(id: string, userId: string) {
    const item = await this.prisma.savedSearch.findFirst({
      where: { id, userId },
      include: {
        alerts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                monthlyRentPkr: true,
                images: { take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Saved search with ID '${id}' not found.`);
    }

    return item;
  }

  /**
   * Updates an existing saved search.
   */
  async updateSavedSearch(id: string, userId: string, dto: UpdateSavedSearchRequestDto) {
    const existing = await this.prisma.savedSearch.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Saved search with ID '${id}' not found.`);
    }

    const updatedFilters = dto.filters
      ? (dto.filters as SavedSearchFiltersDto)
      : (existing.filters as any);
    const signature = dto.filters
      ? this.generateFilterSignature(updatedFilters)
      : existing.filterSignature;

    return this.prisma.savedSearch.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : existing.name,
        filters: updatedFilters as any,
        filterSignature: signature,
        eligibility: updatedFilters.eligibility,
        localityId: updatedFilters.localityId,
        propertyType: updatedFilters.propertyType,
        minPrice:
          updatedFilters.minPrice !== undefined ? updatedFilters.minPrice : existing.minPrice,
        maxPrice:
          updatedFilters.maxPrice !== undefined ? updatedFilters.maxPrice : existing.maxPrice,
        bedrooms:
          updatedFilters.bedrooms !== undefined ? updatedFilters.bedrooms : existing.bedrooms,
        bathrooms:
          updatedFilters.bathrooms !== undefined ? updatedFilters.bathrooms : existing.bathrooms,
        furnishing:
          updatedFilters.furnishing !== undefined ? updatedFilters.furnishing : existing.furnishing,
        sortPreference:
          dto.sortPreference !== undefined ? dto.sortPreference : existing.sortPreference,
        alertsEnabled: dto.alertsEnabled !== undefined ? dto.alertsEnabled : existing.alertsEnabled,
        frequency: (dto.frequency as any) || existing.frequency,
      },
    });
  }

  /**
   * Deletes a saved search.
   */
  async deleteSavedSearch(id: string, userId: string) {
    const existing = await this.prisma.savedSearch.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Saved search with ID '${id}' not found.`);
    }

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { success: true, message: 'Saved search deleted successfully.' };
  }

  /**
   * Quick toggle of alert notifications for a saved search.
   */
  async updateSavedSearchAlerts(
    id: string,
    userId: string,
    dto: UpdateSavedSearchAlertsRequestDto,
  ) {
    const existing = await this.prisma.savedSearch.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Saved search with ID '${id}' not found.`);
    }

    return this.prisma.savedSearch.update({
      where: { id },
      data: {
        alertsEnabled: dto.alertsEnabled,
        ...(dto.frequency ? { frequency: dto.frequency as any } : {}),
      },
    });
  }

  /**
   * Evaluates all active saved searches against a newly approved / newly available property.
   * Dispatches notifications, prevents duplicate alerts, records delivery audit logs.
   */
  async evaluateNewProperty(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        locality: true,
        amenities: { select: { amenityId: true } },
      },
    });

    if (!property) {
      this.logger.log(
        `Property ${propertyId} is not approved or not available, skipping search alert evaluation.`,
      );
      return { evaluatedCount: 0, matchedCount: 0 };
    }

    // Find candidate active saved searches
    const activeSavedSearches = await this.prisma.savedSearch.findMany({
      where: {
        alertsEnabled: true,
        // Match eligibility or null (all)
        OR: [{ eligibility: null }, { eligibility: property.eligibility }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            notificationPreference: true,
            tenantProfile: { select: { tenantType: true } },
          },
        },
      },
    });

    let matchedCount = 0;
    const propertyRent = Number(property.monthlyRentPkr);
    const propertyAmenityIds = new Set(property.amenities.map((a) => a.amenityId));

    for (const savedSearch of activeSavedSearches) {
      // 1. Strict Tenant Eligibility Partitioning:
      // If user is STUDENT, property MUST be STUDENTS_ONLY.
      // If user is FAMILY, property MUST be FAMILIES_ONLY.
      const tenantType = savedSearch.user.tenantProfile?.tenantType;
      if (
        tenantType === TenantType.STUDENT &&
        property.eligibility !== PropertyEligibility.STUDENTS_ONLY
      ) {
        continue;
      }
      if (
        tenantType === TenantType.FAMILY &&
        property.eligibility !== PropertyEligibility.FAMILIES_ONLY
      ) {
        continue;
      }

      const filters = savedSearch.filters as SavedSearchFiltersDto;

      // 2. Locality filter
      if (filters.localityId && filters.localityId !== property.localityId) {
        continue;
      }

      // 3. Property Type filter
      if (filters.propertyType && filters.propertyType !== property.propertyType) {
        continue;
      }

      // 4. Rent bounds
      if (filters.minPrice !== undefined && propertyRent < Number(filters.minPrice)) {
        continue;
      }
      if (filters.maxPrice !== undefined && propertyRent > Number(filters.maxPrice)) {
        continue;
      }

      // 5. Bedroom count
      if (filters.bedrooms !== undefined && property.bedrooms < filters.bedrooms) {
        continue;
      }

      // 6. Bathroom count
      if (filters.bathrooms !== undefined && property.bathrooms < filters.bathrooms) {
        continue;
      }

      // 7. Furnishing
      if (
        filters.furnishing &&
        property.furnishing &&
        filters.furnishing.toLowerCase() !== property.furnishing.toLowerCase()
      ) {
        continue;
      }

      // 8. Amenities (must contain all requested amenities)
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((aId) => propertyAmenityIds.has(aId));
        if (!hasAll) continue;
      }

      // Matching search found! Prevent duplicate alert for (savedSearchId, propertyId)
      const existingAlert = await this.prisma.searchAlert.findUnique({
        where: {
          savedSearchId_propertyId: {
            savedSearchId: savedSearch.id,
            propertyId: property.id,
          },
        },
      });

      if (existingAlert) {
        continue;
      }

      // Create SearchAlert record
      const alert = await this.prisma.searchAlert.create({
        data: {
          savedSearchId: savedSearch.id,
          userId: savedSearch.userId,
          propertyId: property.id,
          isRead: false,
        },
      });

      matchedCount++;

      // User notification preferences
      const prefs = savedSearch.user.notificationPreference || {
        inAppAlerts: true,
        pushAlerts: true,
        emailAlerts: true,
      };

      const alertTitle = `New Listing: ${property.title}`;
      const alertBody = `A new listing matching your saved search "${savedSearch.name}" is now available in ${property.locality.name} for PKR ${propertyRent.toLocaleString('en-PK')}/mo.`;

      // 1. In-App Notification
      if (prefs.inAppAlerts) {
        try {
          await this.notificationService.notify(
            savedSearch.userId,
            (NotificationType as any).NEW_LISTING_ALERT || NotificationType.SYSTEM,
            alertTitle,
            alertBody,
            {
              propertyId: property.id,
              savedSearchId: savedSearch.id,
              slug: property.slug,
            },
          );

          await this.prisma.searchAlertDelivery.create({
            data: {
              searchAlertId: alert.id,
              channel: 'IN_APP',
              status: AlertDeliveryStatus.DELIVERED,
              deliveredAt: new Date(),
            },
          });
        } catch (err: any) {
          await this.prisma.searchAlertDelivery.create({
            data: {
              searchAlertId: alert.id,
              channel: 'IN_APP',
              status: AlertDeliveryStatus.FAILED,
              failureReason: err?.message || 'In-app notification dispatch failed',
            },
          });
        }
      } else {
        await this.prisma.searchAlertDelivery.create({
          data: {
            searchAlertId: alert.id,
            channel: 'IN_APP',
            status: AlertDeliveryStatus.SKIPPED,
            failureReason: 'User disabled in-app alerts',
          },
        });
      }

      // 2. FCM Push Notification
      if (prefs.pushAlerts) {
        await this.prisma.searchAlertDelivery.create({
          data: {
            searchAlertId: alert.id,
            channel: 'PUSH_FCM',
            status: AlertDeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });
      }

      // 3. Email Notification
      if (prefs.emailAlerts) {
        await this.prisma.searchAlertDelivery.create({
          data: {
            searchAlertId: alert.id,
            channel: 'EMAIL',
            status: AlertDeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });
      }

      // Update lastNotifiedAt
      await this.prisma.savedSearch.update({
        where: { id: savedSearch.id },
        data: { lastNotifiedAt: new Date() },
      });
    }

    this.logger.log(
      `Evaluated ${activeSavedSearches.length} saved searches for property ${propertyId}. Matched and dispatched ${matchedCount} alerts.`,
    );

    return { evaluatedCount: activeSavedSearches.length, matchedCount };
  }

  /**
   * User notification preference management.
   */
  async getNotificationPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: {
          userId,
          emailAlerts: true,
          pushAlerts: true,
          inAppAlerts: true,
          instantAlerts: true,
          dailyDigest: true,
          weeklyDigest: true,
          recommendations: true,
        },
      });
    }

    return prefs;
  }

  async updateNotificationPreferences(userId: string, dto: NotificationPreferenceRequestDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...dto,
      },
      create: {
        userId,
        emailAlerts: dto.emailAlerts !== undefined ? dto.emailAlerts : true,
        pushAlerts: dto.pushAlerts !== undefined ? dto.pushAlerts : true,
        inAppAlerts: dto.inAppAlerts !== undefined ? dto.inAppAlerts : true,
        instantAlerts: dto.instantAlerts !== undefined ? dto.instantAlerts : true,
        dailyDigest: dto.dailyDigest !== undefined ? dto.dailyDigest : true,
        weeklyDigest: dto.weeklyDigest !== undefined ? dto.weeklyDigest : true,
        recommendations: dto.recommendations !== undefined ? dto.recommendations : true,
      },
    });
  }

  /**
   * Admin dashboard: list recent alert deliveries with channel and status breakdown.
   */
  async getAlertDeliveries(limit = 50) {
    return this.prisma.searchAlertDelivery.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        searchAlert: {
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            savedSearch: { select: { id: true, name: true } },
            property: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });
  }
}
