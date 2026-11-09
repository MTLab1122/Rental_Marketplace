import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  CreatePropertyRequestDto,
  UpdatePropertyRequestDto,
  SearchPropertyQueryDto,
  UpdatePropertyStatusRequestDto,
} from './dto/property.dto';
import {
  validateEligibilityAndPropertyType,
  validatePeshawarCoordinates,
  isCoordinateWithinGeoJsonPolygon,
  calculateHaversineDistanceKm,
} from './property.validator';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  TenantType,
  ErrorCode,
} from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    const base = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  /**
   * Landlord: Create a new property in DRAFT status
   */
  async create(landlordId: string, dto: CreatePropertyRequestDto) {
    // 1. Enforce property eligibility and type rules
    validateEligibilityAndPropertyType(dto.eligibility, dto.propertyType);

    // 2. Enforce Peshawar geographic boundary
    validatePeshawarCoordinates(dto.latitude, dto.longitude);

    // 3. Verify locality is valid and active
    const locality = await this.prisma.locality.findFirst({
      where: {
        id: dto.localityId,
        deletedAt: null,
      },
    });

    if (!locality) {
      throw new NotFoundException(`Locality with ID '${dto.localityId}' not found.`);
    }

    if (!locality.isActive) {
      throw new UnprocessableEntityException({
        code: ErrorCode.LOCALITY_INACTIVE,
        message: `The locality '${locality.name}' is currently deactivated and cannot accept new listings.`,
      });
    }

    // 4. Validate locality polygon if defined
    if (locality.boundaryGeoJson) {
      const isInsideLocality = isCoordinateWithinGeoJsonPolygon(
        dto.latitude,
        dto.longitude,
        locality.boundaryGeoJson as Record<string, unknown>,
      );
      if (!isInsideLocality) {
        throw new UnprocessableEntityException({
          code: ErrorCode.LOCATION_OUTSIDE_PESHAWAR,
          message: `Coordinates (${dto.latitude}, ${dto.longitude}) fall outside the boundary of locality '${locality.name}'.`,
        });
      }
    }

    const slug = this.slugify(dto.title);

    // 5. Create property in Prisma
    const property = await this.prisma.property.create({
      data: {
        landlordId,
        localityId: dto.localityId,
        title: dto.title,
        slug,
        description: dto.description,
        eligibility: dto.eligibility,
        propertyType: dto.propertyType,
        status: PropertyStatus.DRAFT,
        monthlyRentPkr: new Prisma.Decimal(dto.monthlyRentPkr),
        securityDepositPkr: new Prisma.Decimal(dto.securityDepositPkr),
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        areaSqFt: dto.areaSqFt ? new Prisma.Decimal(dto.areaSqFt) : null,
        furnishing: dto.furnishing || null,
        address: dto.address,
        addressNote: dto.addressNote || null,
        latitude: new Prisma.Decimal(dto.latitude),
        longitude: new Prisma.Decimal(dto.longitude),
        isAvailable: true,
        ...(dto.amenityIds && dto.amenityIds.length > 0
          ? {
              amenities: {
                create: dto.amenityIds.map((amenityId) => ({ amenityId })),
              },
            }
          : {}),
        ...(dto.images && dto.images.length > 0
          ? {
              images: {
                create: dto.images.map((img, index) => ({
                  url: img.url,
                  caption: img.caption || null,
                  isPrimary: img.isPrimary ?? index === 0,
                  sortOrder: img.sortOrder ?? index,
                })),
              },
            }
          : {}),
      },
      include: {
        locality: {
          select: { id: true, name: true, slug: true, postalCode: true },
        },
        amenities: {
          include: { amenity: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.auditService.log({
      actorId: landlordId,
      action: 'property:create',
      targetType: 'property',
      targetId: property.id,
      after: {
        title: property.title,
        eligibility: property.eligibility,
        status: property.status,
      },
    });

    this.logger.log(
      `Property created: ${property.title} (${property.id}) by landlord ${landlordId}`,
    );
    return property;
  }

  /**
   * Landlord: List own properties
   */
  async findAllByLandlord(landlordId: string) {
    return this.prisma.property.findMany({
      where: {
        landlordId,
        deletedAt: null,
      },
      include: {
        locality: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        amenities: {
          include: { amenity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Landlord: Get own property by ID
   */
  async findByIdForLandlord(propertyId: string, landlordId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You do not have permission to view or manage this property.');
    }

    return property;
  }

  /**
   * Landlord: Update own property
   */
  async update(propertyId: string, landlordId: string, dto: UpdatePropertyRequestDto) {
    const existing = await this.findByIdForLandlord(propertyId, landlordId);

    const targetEligibility = dto.eligibility ?? existing.eligibility;
    const targetType = dto.propertyType ?? existing.propertyType;
    validateEligibilityAndPropertyType(
      targetEligibility as unknown as PropertyEligibility,
      targetType as unknown as PropertyType,
    );

    const targetLat = dto.latitude ?? Number(existing.latitude);
    const targetLng = dto.longitude ?? Number(existing.longitude);
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      validatePeshawarCoordinates(targetLat, targetLng);
    }

    if (dto.localityId && dto.localityId !== existing.localityId) {
      const locality = await this.prisma.locality.findFirst({
        where: { id: dto.localityId, deletedAt: null },
      });
      if (!locality || !locality.isActive) {
        throw new UnprocessableEntityException({
          code: ErrorCode.LOCALITY_INACTIVE,
          message: 'The selected locality is invalid or inactive.',
        });
      }
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.eligibility && { eligibility: dto.eligibility }),
        ...(dto.propertyType && { propertyType: dto.propertyType }),
        ...(dto.monthlyRentPkr !== undefined && {
          monthlyRentPkr: new Prisma.Decimal(dto.monthlyRentPkr),
        }),
        ...(dto.securityDepositPkr !== undefined && {
          securityDepositPkr: new Prisma.Decimal(dto.securityDepositPkr),
        }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.areaSqFt !== undefined && {
          areaSqFt: dto.areaSqFt ? new Prisma.Decimal(dto.areaSqFt) : null,
        }),
        ...(dto.furnishing !== undefined && { furnishing: dto.furnishing }),
        ...(dto.address && { address: dto.address }),
        ...(dto.addressNote !== undefined && { addressNote: dto.addressNote }),
        ...(dto.latitude !== undefined && {
          latitude: new Prisma.Decimal(dto.latitude),
        }),
        ...(dto.longitude !== undefined && {
          longitude: new Prisma.Decimal(dto.longitude),
        }),
        ...(dto.localityId && { localityId: dto.localityId }),
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });

    await this.auditService.log({
      actorId: landlordId,
      action: 'property:update',
      targetType: 'property',
      targetId: updated.id,
      before: { title: existing.title, monthlyRentPkr: existing.monthlyRentPkr },
      after: { title: updated.title, monthlyRentPkr: updated.monthlyRentPkr },
    });

    return updated;
  }

  /**
   * Landlord: Soft delete own property
   */
  async delete(propertyId: string, landlordId: string) {
    const existing = await this.findByIdForLandlord(propertyId, landlordId);

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        deletedAt: new Date(),
        status: PropertyStatus.DELETED,
        isAvailable: false,
      },
    });

    await this.auditService.log({
      actorId: landlordId,
      action: 'property:delete',
      targetType: 'property',
      targetId: propertyId,
      before: { title: existing.title, status: existing.status },
      after: { status: PropertyStatus.DELETED, isAvailable: false },
    });

    return { success: true, message: `Property '${existing.title}' deleted successfully.` };
  }

  /**
   * Landlord: Update listing status (submit for review, mark rented, mark unavailable)
   */
  async updateStatusByLandlord(
    propertyId: string,
    landlordId: string,
    targetStatus: PropertyStatus,
  ) {
    const property = await this.findByIdForLandlord(propertyId, landlordId);

    if (targetStatus === PropertyStatus.PENDING_REVIEW) {
      // Must have at least 1 image before submission
      const imageCount = await this.prisma.propertyImage.count({
        where: { propertyId },
      });
      if (imageCount === 0) {
        throw new UnprocessableEntityException({
          code: ErrorCode.IMAGE_REQUIRED_FOR_REVIEW,
          message: 'At least one property image is required before submitting listing for review.',
        });
      }

      const updated = await this.prisma.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.PENDING_REVIEW },
      });

      await this.auditService.log({
        actorId: landlordId,
        action: 'property:submit_review',
        targetType: 'property',
        targetId: propertyId,
        before: { status: property.status },
        after: { status: PropertyStatus.PENDING_REVIEW },
      });

      return updated;
    }

    if (targetStatus === PropertyStatus.RENTED) {
      const updated = await this.prisma.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.RENTED, isAvailable: false },
      });

      await this.auditService.log({
        actorId: landlordId,
        action: 'property:mark_rented',
        targetType: 'property',
        targetId: propertyId,
        before: { status: property.status },
        after: { status: PropertyStatus.RENTED, isAvailable: false },
      });

      return updated;
    }

    if (targetStatus === PropertyStatus.UNAVAILABLE) {
      const updated = await this.prisma.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.UNAVAILABLE, isAvailable: false },
      });

      await this.auditService.log({
        actorId: landlordId,
        action: 'property:mark_unavailable',
        targetType: 'property',
        targetId: propertyId,
        before: { status: property.status },
        after: { status: PropertyStatus.UNAVAILABLE, isAvailable: false },
      });

      return updated;
    }

    if (targetStatus === PropertyStatus.APPROVED) {
      // Landlord attempting to restore to available
      if (
        property.status !== PropertyStatus.APPROVED &&
        property.status !== PropertyStatus.UNAVAILABLE
      ) {
        throw new UnprocessableEntityException({
          code: ErrorCode.INVALID_STATUS_TRANSITION,
          message: 'Only approved properties can be restored to available status.',
        });
      }

      const updated = await this.prisma.property.update({
        where: { id: propertyId },
        data: { isAvailable: true, status: PropertyStatus.APPROVED },
      });

      await this.auditService.log({
        actorId: landlordId,
        action: 'property:restore_available',
        targetType: 'property',
        targetId: propertyId,
        before: { isAvailable: property.isAvailable },
        after: { isAvailable: true, status: PropertyStatus.APPROVED },
      });

      return updated;
    }

    throw new UnprocessableEntityException({
      code: ErrorCode.INVALID_STATUS_TRANSITION,
      message: `Unsupported status transition to ${targetStatus} by landlord.`,
    });
  }

  /**
   * Admin: Approve, reject, suspend, or restore property listing
   */
  async updateStatusByAdmin(
    propertyId: string,
    adminId: string,
    dto: UpdatePropertyStatusRequestDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    let updateData: Prisma.PropertyUpdateInput = {};

    switch (dto.status) {
      case PropertyStatus.APPROVED:
        updateData = {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          approvedBy: { connect: { id: adminId } },
          verifiedAt: new Date(),
          rejectionReason: null,
          suspensionReason: null,
        };
        break;

      case PropertyStatus.REJECTED:
        updateData = {
          status: PropertyStatus.REJECTED,
          isAvailable: false,
          rejectionReason: dto.reason || 'Listing rejected by administrator',
        };
        break;

      case PropertyStatus.SUSPENDED:
        updateData = {
          status: PropertyStatus.SUSPENDED,
          isAvailable: false,
          suspensionReason: dto.reason || 'Listing suspended by administrator',
        };
        break;

      default:
        updateData = { status: dto.status };
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: updateData,
    });

    await this.auditService.log({
      actorId: adminId,
      action: `property:admin_${dto.status.toLowerCase()}`,
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: updated.status, isAvailable: updated.isAvailable, reason: dto.reason },
    });

    return updated;
  }

  /**
   * Public Search: Filter, sorting, cursor pagination, and strict tenant segregation
   */
  async searchPublic(
    query: SearchPropertyQueryDto,
    currentUser?: { sub?: string; tenantType?: TenantType; roles?: string[] },
  ) {
    const limit = query.limit ? Math.min(query.limit, 100) : 20;

    // Strict Tenant Segregation:
    // If student tenant -> ONLY STUDENTS_ONLY
    // If family tenant -> ONLY FAMILIES_ONLY
    let enforcedEligibility: PropertyEligibility | undefined = undefined;

    const effectiveTenantType = currentUser?.tenantType ?? query.tenantType;

    if (effectiveTenantType === TenantType.STUDENT) {
      enforcedEligibility = PropertyEligibility.STUDENTS_ONLY;
    } else if (effectiveTenantType === TenantType.FAMILY) {
      enforcedEligibility = PropertyEligibility.FAMILIES_ONLY;
    } else if (query.eligibility) {
      enforcedEligibility = query.eligibility;
    }

    // Build Prisma where clause with hard canonical public invariants
    const whereClause: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED,
      isAvailable: true,
      deletedAt: null,
      locality: {
        isActive: true,
        deletedAt: null,
      },
      ...(enforcedEligibility && { eligibility: enforcedEligibility }),
      ...(query.localityId && { localityId: query.localityId }),
      ...(query.propertyType && { propertyType: query.propertyType }),
      ...((query.minRent !== undefined || query.maxRent !== undefined) && {
        monthlyRentPkr: {
          ...(query.minRent !== undefined && {
            gte: new Prisma.Decimal(query.minRent),
          }),
          ...(query.maxRent !== undefined && {
            lte: new Prisma.Decimal(query.maxRent),
          }),
        },
      }),
      ...((query.minBedrooms !== undefined || query.maxBedrooms !== undefined) && {
        bedrooms: {
          ...(query.minBedrooms !== undefined && { gte: query.minBedrooms }),
          ...(query.maxBedrooms !== undefined && { lte: query.maxBedrooms }),
        },
      }),
      ...(query.minBathrooms !== undefined && {
        bathrooms: { gte: query.minBathrooms },
      }),
      ...(query.furnished !== undefined && {
        furnishing: query.furnished === true || query.furnished === 'true' ? { not: null } : null,
      }),
      ...(query.amenityIds && query.amenityIds.length > 0
        ? {
            amenities: {
              some: {
                amenityId: { in: query.amenityIds },
              },
            },
          }
        : {}),
    };

    // Sort order definition
    let orderBy: Prisma.PropertyOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (query.sort === 'lowest_rent') {
      orderBy = [{ monthlyRentPkr: 'asc' }, { id: 'asc' }];
    } else if (query.sort === 'highest_rent') {
      orderBy = [{ monthlyRentPkr: 'desc' }, { id: 'desc' }];
    } else if (query.sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
    }

    // Handle cursor pagination
    let cursorObj: Prisma.PropertyWhereUniqueInput | undefined = undefined;
    if (query.cursor) {
      try {
        const decoded = Buffer.from(query.cursor, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed.id) {
          cursorObj = { id: parsed.id };
        }
      } catch {
        // Invalid cursor ignored
      }
    }

    // Query limit + 1 to check if more items exist
    const items = await this.prisma.property.findMany({
      where: whereClause,
      include: {
        locality: {
          select: { id: true, name: true, slug: true, postalCode: true },
        },
        images: {
          select: { id: true, url: true, caption: true, isPrimary: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        amenities: {
          include: {
            amenity: {
              select: { id: true, name: true, code: true, category: true, icon: true },
            },
          },
        },
      },
      orderBy,
      take: limit + 1,
      ...(cursorObj && { skip: 1, cursor: cursorObj }),
    });

    let filteredItems = items;

    // Filter by radius if GPS provided
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.radiusKm !== undefined
    ) {
      filteredItems = filteredItems.filter((p) => {
        const dist = calculateHaversineDistanceKm(
          query.latitude!,
          query.longitude!,
          Number(p.latitude),
          Number(p.longitude),
        );
        return dist <= query.radiusKm!;
      });
    }

    // Sort by nearest if requested
    if (query.sort === 'nearest' && query.latitude !== undefined && query.longitude !== undefined) {
      filteredItems.sort((a, b) => {
        const distA = calculateHaversineDistanceKm(
          query.latitude!,
          query.longitude!,
          Number(a.latitude),
          Number(a.longitude),
        );
        const distB = calculateHaversineDistanceKm(
          query.latitude!,
          query.longitude!,
          Number(b.latitude),
          Number(b.longitude),
        );
        return distA - distB;
      });
    }

    const hasMore = filteredItems.length > limit;
    const paginatedItems = hasMore ? filteredItems.slice(0, limit) : filteredItems;

    let nextCursor: string | null = null;
    if (hasMore && paginatedItems.length > 0) {
      const lastItem = paginatedItems[paginatedItems.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({ id: lastItem.id, createdAt: lastItem.createdAt }),
      ).toString('base64');
    }

    // Strip private landlord details for public search
    const publicSafeItems = paginatedItems.map((p) => ({
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
      locality: p.locality,
      coordinates: {
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      },
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      inquiryCount: p.inquiryCount,
      favoriteCount: p.favoriteCount,
      images: p.images,
      amenities: p.amenities.map((a) => a.amenity),
      createdAt: p.createdAt,
    }));

    return {
      items: publicSafeItems,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Public Detail: Retrieve single property by ID or Slug
   */
  async findPublicById(
    idOrSlug: string,
    currentUser?: { sub?: string; tenantType?: TenantType; roles?: string[] },
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const property = await this.prisma.property.findFirst({
      where: {
        OR: isUuid ? [{ id: idOrSlug }, { slug: idOrSlug }] : [{ slug: idOrSlug }],
        deletedAt: null,
      },
      include: {
        locality: true,
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property '${idOrSlug}' not found.`);
    }

    const isOwner = currentUser?.sub && currentUser.sub === property.landlordId;
    const isAdmin =
      currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('SUPER_ADMIN');

    // If not owner or admin, enforce strict public availability checks
    if (!isOwner && !isAdmin) {
      if (property.status !== PropertyStatus.APPROVED || !property.isAvailable) {
        throw new NotFoundException(`Property '${idOrSlug}' not found or unavailable.`);
      }
      if (!property.locality.isActive) {
        throw new NotFoundException(`Property '${idOrSlug}' locality is inactive.`);
      }

      // Check tenant eligibility separation
      if (
        currentUser?.tenantType === TenantType.STUDENT &&
        property.eligibility !== PropertyEligibility.STUDENTS_ONLY
      ) {
        throw new NotFoundException(`Property '${idOrSlug}' not found.`);
      }
      if (
        currentUser?.tenantType === TenantType.FAMILY &&
        property.eligibility !== PropertyEligibility.FAMILIES_ONLY
      ) {
        throw new NotFoundException(`Property '${idOrSlug}' not found.`);
      }
    }

    // Increment view count asynchronously
    this.prisma.property
      .update({
        where: { id: property.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    // Return public safe view
    return {
      id: property.id,
      title: property.title,
      slug: property.slug,
      description: property.description,
      eligibility: property.eligibility,
      propertyType: property.propertyType,
      monthlyRentPkr: Number(property.monthlyRentPkr),
      securityDepositPkr: Number(property.securityDepositPkr),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt ? Number(property.areaSqFt) : null,
      furnishing: property.furnishing,
      addressNote: property.addressNote,
      // Exact address only exposed to owner or admin
      address: isOwner || isAdmin ? property.address : undefined,
      locality: {
        id: property.locality.id,
        name: property.locality.name,
        slug: property.locality.slug,
        postalCode: property.locality.postalCode,
      },
      coordinates: {
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
      },
      isAvailable: property.isAvailable,
      isFeatured: property.isFeatured,
      viewCount: property.viewCount + 1,
      inquiryCount: property.inquiryCount,
      favoriteCount: property.favoriteCount,
      images: property.images,
      amenities: property.amenities.map((a) => a.amenity),
      createdAt: property.createdAt,
    };
  }

  /**
   * Public: Featured properties
   */
  async getFeatured(limit = 10, tenantType?: TenantType) {
    return this.searchPublic({ limit, tenantType }, tenantType ? { tenantType } : undefined);
  }

  /**
   * Public: Recent properties
   */
  async getRecent(limit = 10, tenantType?: TenantType) {
    return this.searchPublic(
      { limit, sort: 'newest', tenantType },
      tenantType ? { tenantType } : undefined,
    );
  }
}
