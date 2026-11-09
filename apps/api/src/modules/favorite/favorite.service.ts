import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { PropertyStatus, PropertyEligibility, TenantType } from '@rental-peshawar/shared-types';

@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Adds a property to the user's favorites list.
   * Strictly enforces Peshawar student/family eligibility segregation.
   */
  async addFavorite(userId: string, propertyId: string, currentUser?: { tenantType?: TenantType }) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property || property.status !== PropertyStatus.APPROVED) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found or unavailable.`);
    }

    // Zero cross-visibility invariant: Tenants cannot favorite properties of opposite category
    if (
      currentUser?.tenantType === TenantType.STUDENT &&
      property.eligibility === PropertyEligibility.FAMILIES_ONLY
    ) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }
    if (
      currentUser?.tenantType === TenantType.FAMILY &&
      property.eligibility === PropertyEligibility.STUDENTS_ONLY
    ) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });

    if (existing) {
      return { id: existing.id, userId, propertyId, isFavorite: true };
    }

    const [favorite] = await this.prisma.$transaction([
      this.prisma.favorite.create({
        data: { userId, propertyId },
      }),
      this.prisma.property.update({
        where: { id: propertyId },
        data: { favoriteCount: { increment: 1 } },
      }),
    ]);

    await this.auditService.log({
      actorId: userId,
      action: 'favorite:add',
      targetType: 'property',
      targetId: propertyId,
    });

    this.logger.log(`User ${userId} favorited property ${propertyId}`);
    return { id: favorite.id, userId, propertyId, isFavorite: true };
  }

  /**
   * Removes a property from user's favorites.
   */
  async removeFavorite(userId: string, propertyId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });

    if (!existing) {
      return { success: true, message: 'Property is not in favorites.' };
    }

    await this.prisma.$transaction([
      this.prisma.favorite.delete({
        where: { id: existing.id },
      }),
      this.prisma.property.update({
        where: { id: propertyId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);

    await this.auditService.log({
      actorId: userId,
      action: 'favorite:remove',
      targetType: 'property',
      targetId: propertyId,
    });

    this.logger.log(`User ${userId} unfavorited property ${propertyId}`);
    return { success: true, message: 'Property removed from favorites.' };
  }

  /**
   * Retrieves all favorite properties for the user with full details.
   */
  async getUserFavorites(userId: string, currentUser?: { tenantType?: TenantType }) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            locality: true,
            images: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { sortOrder: 'asc' },
              take: 5,
            },
            amenities: { include: { amenity: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter strictly by tenant eligibility if specified
    return favorites
      .filter((fav) => {
        if (!fav.property || fav.property.deletedAt !== null) return false;
        if (currentUser?.tenantType === TenantType.STUDENT) {
          return fav.property.eligibility === PropertyEligibility.STUDENTS_ONLY;
        }
        if (currentUser?.tenantType === TenantType.FAMILY) {
          return fav.property.eligibility === PropertyEligibility.FAMILIES_ONLY;
        }
        return true;
      })
      .map((fav) => ({
        id: fav.id,
        propertyId: fav.propertyId,
        createdAt: fav.createdAt,
        property: {
          id: fav.property.id,
          title: fav.property.title,
          slug: fav.property.slug,
          description: fav.property.description,
          eligibility: fav.property.eligibility,
          propertyType: fav.property.propertyType,
          status: fav.property.status,
          monthlyRentPkr: Number(fav.property.monthlyRentPkr),
          securityDepositPkr: fav.property.securityDepositPkr
            ? Number(fav.property.securityDepositPkr)
            : null,
          bedrooms: fav.property.bedrooms,
          bathrooms: fav.property.bathrooms,
          areaSqFt: fav.property.areaSqFt ? Number(fav.property.areaSqFt) : null,
          furnishing: fav.property.furnishing,
          addressNote: fav.property.addressNote,
          isAvailable: fav.property.isAvailable,
          isFeatured: fav.property.isFeatured,
          locality: {
            id: fav.property.locality.id,
            name: fav.property.locality.name,
            slug: fav.property.locality.slug,
            postalCode: fav.property.locality.postalCode,
          },
          images: fav.property.images.map((img) => ({
            id: img.id,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            isPrimary: img.isPrimary,
          })),
          amenities: fav.property.amenities.map((a) => ({
            id: a.amenity.id,
            name: a.amenity.name,
            code: a.amenity.code,
          })),
        },
      }));
  }

  /**
   * Retrieves array of property IDs favorited by this user for instant client lookups.
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    return favorites.map((f) => f.propertyId);
  }
}
