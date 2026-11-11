import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  CreatePropertyRequestDto,
  UpdatePropertyRequestDto,
  SearchPropertyQueryDto,
  UpdatePropertyStatusRequestDto,
  AdminPropertyQueryDto,
  DuplicateCheckRequestDto,
  RecordPropertyViewRequestDto,
} from './dto/property.dto';
import {
  validateEligibilityAndPropertyType,
  validatePeshawarCoordinates,
  isCoordinateWithinGeoJsonPolygon,
  calculateHaversineDistanceKm,
} from './property.validator';
import { isNearDuplicateListing, calculateListingQualityScore } from './property.util';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  TenantType,
  ErrorCode,
  ImageModerationStatus,
  NotificationType,
  ViewSource,
  PropertyAnalyticsDto,
  LandlordDashboardSummaryDto,
  InquiryResponseDto,
} from '@rental-peshawar/shared-types';
import { NotificationService } from '../notification/notification.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
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
   * Check whether a listing is a near-duplicate of an existing listing for this landlord.
   */
  async checkDuplicate(landlordId: string, dto: DuplicateCheckRequestDto) {
    const existingProperties = await this.prisma.property.findMany({
      where: {
        landlordId,
        localityId: dto.localityId,
        propertyType: dto.propertyType,
        deletedAt: null,
      },
      select: {
        id: true,
        landlordId: true,
        localityId: true,
        propertyType: true,
        title: true,
        monthlyRentPkr: true,
        latitude: true,
        longitude: true,
      },
    });

    const candidate = {
      landlordId,
      localityId: dto.localityId,
      propertyType: dto.propertyType,
      title: dto.title,
      monthlyRentPkr: Number(dto.monthlyRentPkr),
      latitude: Number(dto.latitude),
      longitude: Number(dto.longitude),
    };

    for (const existing of existingProperties) {
      const isDup = isNearDuplicateListing(candidate, {
        id: existing.id,
        landlordId: existing.landlordId,
        localityId: existing.localityId,
        propertyType: existing.propertyType as unknown as PropertyType,
        title: existing.title,
        monthlyRentPkr: Number(existing.monthlyRentPkr),
        latitude: Number(existing.latitude),
        longitude: Number(existing.longitude),
      });

      if (isDup) {
        return {
          isDuplicate: true,
          matchedPropertyId: existing.id,
          matchedPropertyTitle: existing.title,
          warningMessage: `A near-duplicate listing '${existing.title}' already exists at this location with similar rent.`,
        };
      }
    }

    return {
      isDuplicate: false,
    };
  }

  /**
   * Landlord: Create a new property in DRAFT status
   */
  async create(landlordId: string, dto: CreatePropertyRequestDto) {
    // 0. Enforce landlord identity verification
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
      include: { landlordProfile: true },
    });

    const isVerified =
      landlord?.isVerified === true || landlord?.landlordProfile?.isCnicVerified === true;

    if (!isVerified) {
      throw new UnprocessableEntityException({
        code: ErrorCode.LANDLORD_NOT_VERIFIED,
        message: 'Landlord identity verification is required before creating a property listing.',
      });
    }

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

    // 5. Check for near-duplicate listing
    const duplicateCheck = await this.checkDuplicate(landlordId, {
      localityId: dto.localityId,
      propertyType: dto.propertyType,
      monthlyRentPkr: dto.monthlyRentPkr,
      latitude: dto.latitude,
      longitude: dto.longitude,
      title: dto.title,
    });

    let isDuplicateWarning = false;
    let duplicateOfPropertyId: string | null = null;

    if (duplicateCheck.isDuplicate) {
      if (!dto.allowDuplicateBypass) {
        throw new UnprocessableEntityException({
          code: ErrorCode.DUPLICATE_LISTING_EXISTS,
          message:
            duplicateCheck.warningMessage ||
            'A near-duplicate listing already exists for this landlord.',
          matchedPropertyId: duplicateCheck.matchedPropertyId,
        });
      }
      isDuplicateWarning = true;
      duplicateOfPropertyId = duplicateCheck.matchedPropertyId || null;
    }

    const slug = this.slugify(dto.title);

    // 6. Create property in Prisma
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
        availableFromDate: dto.availableFromDate ? new Date(dto.availableFromDate) : null,
        isDuplicateWarning,
        duplicateOfPropertyId,
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
      // 1. Enforce landlord identity verification
      const landlord = await this.prisma.user.findUnique({
        where: { id: landlordId },
        include: { landlordProfile: true },
      });

      const isVerified =
        landlord?.isVerified === true || landlord?.landlordProfile?.isCnicVerified === true;

      if (!isVerified) {
        throw new UnprocessableEntityException({
          code: ErrorCode.LANDLORD_NOT_VERIFIED,
          message:
            'Landlord identity verification is required before submitting listing for review.',
        });
      }

      // 2. Must have at least 1 image before submission
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
        property.status === PropertyStatus.REJECTED ||
        property.status === PropertyStatus.SUSPENDED
      ) {
        throw new UnprocessableEntityException({
          code: ErrorCode.CANNOT_ACTIVATE_REJECTED_PROPERTY,
          message:
            'Landlord cannot make rejected or suspended property publicly available. Admin review required.',
        });
      }

      if (
        property.status !== PropertyStatus.APPROVED &&
        property.status !== PropertyStatus.RENTED &&
        property.status !== PropertyStatus.UNAVAILABLE
      ) {
        throw new UnprocessableEntityException({
          code: ErrorCode.INVALID_STATUS_TRANSITION,
          message:
            'Only approved, rented, or unavailable properties can be restored to available status.',
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
        before: { isAvailable: property.isAvailable, status: property.status },
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
   * Admin: List properties for moderation with filtering and pagination
   */
  async findAllAdmin(query: AdminPropertyQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.localityId && { localityId: query.localityId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          locality: true,
          landlord: {
            select: { id: true, email: true, fullName: true, phoneNumber: true, isVerified: true },
          },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: {
            select: { inquiries: true, favorites: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Inspect full property details
   */
  async findByIdForAdmin(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId },
      include: {
        locality: true,
        landlord: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            isVerified: true,
            landlordProfile: true,
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    return property;
  }

  /**
   * Admin: Approve listing
   */
  async approveByAdmin(propertyId: string, adminId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      include: { locality: true, landlord: { include: { landlordProfile: true } }, images: true },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    if (!property.locality.isActive) {
      throw new UnprocessableEntityException({
        code: ErrorCode.LOCALITY_INACTIVE,
        message: 'Cannot approve property: Selected locality is deactivated.',
      });
    }

    validatePeshawarCoordinates(Number(property.latitude), Number(property.longitude));

    // Ensure at least 1 image is approved; auto-approve pending images if needed
    const approvedImages = property.images.filter(
      (img) => img.moderationStatus === ImageModerationStatus.APPROVED,
    );
    if (approvedImages.length === 0 && property.images.length > 0) {
      await this.prisma.propertyImage.update({
        where: { id: property.images[0]!.id },
        data: {
          moderationStatus: ImageModerationStatus.APPROVED,
          moderatedById: adminId,
          moderatedAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        approvedBy: { connect: { id: adminId } },
        verifiedAt: new Date(),
        rejectionReason: null,
        suspensionReason: null,
      },
      include: { locality: true, images: true },
    });

    await this.notificationService.notify(
      property.landlordId,
      NotificationType.LISTING_APPROVED,
      'Listing Approved',
      `Your property "${property.title}" has been approved and is now live on the Peshawar marketplace.`,
      { propertyId: property.id },
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'property:admin_approve',
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: PropertyStatus.APPROVED, isAvailable: true },
    });

    return updated;
  }

  /**
   * Admin: Reject listing
   */
  async rejectByAdmin(propertyId: string, adminId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Rejection reason is required.',
      });
    }

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.REJECTED,
        isAvailable: false,
        rejectionReason: reason,
      },
    });

    await this.notificationService.notify(
      property.landlordId,
      NotificationType.LISTING_REJECTED,
      'Listing Rejected',
      `Your property "${property.title}" was rejected: ${reason}`,
      { propertyId: property.id, reason },
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'property:admin_reject',
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: PropertyStatus.REJECTED, isAvailable: false, rejectionReason: reason },
    });

    return updated;
  }

  /**
   * Admin: Suspend listing
   */
  async suspendByAdmin(propertyId: string, adminId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Suspension reason is required.',
      });
    }

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.SUSPENDED,
        isAvailable: false,
        suspensionReason: reason,
      },
    });

    await this.notificationService.notify(
      property.landlordId,
      NotificationType.LISTING_SUSPENDED,
      'Listing Suspended',
      `Your property "${property.title}" has been suspended: ${reason}`,
      { propertyId: property.id, reason },
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'property:admin_suspend',
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: PropertyStatus.SUSPENDED, isAvailable: false, suspensionReason: reason },
    });

    return updated;
  }

  /**
   * Admin: Restore listing
   */
  async restoreByAdmin(propertyId: string, adminId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        suspensionReason: null,
        rejectionReason: null,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'property:admin_restore',
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: PropertyStatus.APPROVED, isAvailable: true },
    });

    return updated;
  }

  /**
   * Admin: Soft delete listing
   */
  async deleteByAdmin(propertyId: string, adminId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        deletedAt: new Date(),
        status: PropertyStatus.DELETED,
        isAvailable: false,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'property:admin_delete',
      targetType: 'property',
      targetId: propertyId,
      before: { status: property.status },
      after: { status: PropertyStatus.DELETED, isAvailable: false },
    });

    return { success: true, message: `Property '${property.title}' deleted successfully.` };
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
          where: { moderationStatus: ImageModerationStatus.APPROVED },
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
      images:
        isOwner || isAdmin
          ? property.images
          : property.images.filter(
              (img) => img.moderationStatus === ImageModerationStatus.APPROVED,
            ),
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

  /**
   * Record real view event for analytics and increment property viewCount
   */
  async recordView(
    propertyId: string,
    dto: RecordPropertyViewRequestDto,
    viewerId?: string,
    clientIp?: string,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, localityId: true, deletedAt: true },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found.`);
    }

    const ipHash = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex') : null;

    const sourceEnum = dto.source ? (dto.source as unknown as ViewSource) : ViewSource.WEB;

    await this.prisma.propertyViewEvent.create({
      data: {
        propertyId,
        viewerId: viewerId || null,
        ipHash,
        source: sourceEnum,
        localityId: dto.localityId || property.localityId || null,
      },
    });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { viewCount: { increment: 1 } },
    });

    return { success: true };
  }

  /**
   * Landlord: Get comprehensive real listing analytics for own property
   */
  async getPropertyAnalytics(
    propertyId: string,
    landlordId: string,
  ): Promise<PropertyAnalyticsDto> {
    const property = await this.findByIdForLandlord(propertyId, landlordId);

    // 1. Total views
    const totalViews = await this.prisma.propertyViewEvent.count({
      where: { propertyId },
    });

    // 2. Unique views (distinct viewerIds + distinct ipHashes for anonymous)
    const distinctUsers = await this.prisma.propertyViewEvent.findMany({
      where: { propertyId, viewerId: { not: null } },
      distinct: ['viewerId'],
      select: { viewerId: true },
    });
    const distinctIps = await this.prisma.propertyViewEvent.findMany({
      where: { propertyId, viewerId: null, ipHash: { not: null } },
      distinct: ['ipHash'],
      select: { ipHash: true },
    });
    const uniqueViews = distinctUsers.length + distinctIps.length;

    // 3. Favorites count
    const favoritesCount = await this.prisma.favorite.count({
      where: { propertyId },
    });

    // 4. Inquiries & response analytics
    const inquiries = await this.prisma.inquiry.findMany({
      where: { propertyId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        conversation: { select: { id: true } },
      },
    });
    const inquiriesCount = inquiries.length;

    const respondedInquiries = inquiries.filter((inq) =>
      ['REPLIED', 'ACCEPTED', 'DECLINED', 'CLOSED'].includes(inq.status),
    );

    const responseRatePercent =
      inquiriesCount > 0 ? Math.round((respondedInquiries.length / inquiriesCount) * 100) : null;

    // Calculate average response time in minutes from conversation messages
    let totalResponseMinutes = 0;
    let timedInquiriesCount = 0;

    for (const inq of respondedInquiries) {
      const convId = inq.conversation?.id;
      if (convId) {
        const firstReply = await this.prisma.message.findFirst({
          where: {
            conversationId: convId,
            senderId: landlordId,
          },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        });

        if (firstReply) {
          const diffMs = firstReply.createdAt.getTime() - inq.createdAt.getTime();
          if (diffMs > 0) {
            totalResponseMinutes += diffMs / (1000 * 60);
            timedInquiriesCount++;
          }
        }
      }
    }

    const averageResponseTimeMinutes =
      timedInquiriesCount > 0 ? Math.round(totalResponseMinutes / timedInquiriesCount) : null;

    // 5. Listing quality score (0 - 100)
    const qualityScore = calculateListingQualityScore(property);

    // 6. Views by source
    const sourceGroups = await this.prisma.propertyViewEvent.groupBy({
      by: ['source'],
      where: { propertyId },
      _count: { id: true },
    });

    const viewsBySource = {
      mobile: 0,
      web: 0,
      adminReferral: 0,
    };
    for (const sg of sourceGroups) {
      if (sg.source === ViewSource.MOBILE) viewsBySource.mobile = sg._count.id;
      else if (sg.source === ViewSource.WEB) viewsBySource.web = sg._count.id;
      else if (sg.source === ViewSource.ADMIN_REFERRAL) viewsBySource.adminReferral = sg._count.id;
    }

    // 7. Views by locality
    const localityGroups = await this.prisma.propertyViewEvent.groupBy({
      by: ['localityId'],
      where: { propertyId, localityId: { not: null } },
      _count: { id: true },
    });

    const viewsByLocality: Record<string, number> = {};
    for (const lg of localityGroups) {
      if (lg.localityId) {
        viewsByLocality[lg.localityId] = lg._count.id;
      }
    }

    return {
      propertyId,
      propertyTitle: property.title,
      totalViews,
      uniqueViews,
      favoritesCount,
      inquiriesCount,
      responseRatePercent,
      averageResponseTimeMinutes,
      qualityScore,
      viewsBySource,
      viewsByLocality,
    };
  }

  /**
   * Landlord: Get aggregate overview metrics and recent activity for dashboard
   */
  async getLandlordDashboard(landlordId: string): Promise<LandlordDashboardSummaryDto> {
    // 1. Property counts
    const [totalProperties, activeListings, pendingReview, rentedCount, unavailableCount] =
      await Promise.all([
        this.prisma.property.count({ where: { landlordId, deletedAt: null } }),
        this.prisma.property.count({
          where: {
            landlordId,
            deletedAt: null,
            status: PropertyStatus.APPROVED,
            isAvailable: true,
          },
        }),
        this.prisma.property.count({
          where: {
            landlordId,
            deletedAt: null,
            status: PropertyStatus.PENDING_REVIEW,
          },
        }),
        this.prisma.property.count({
          where: { landlordId, deletedAt: null, status: PropertyStatus.RENTED },
        }),
        this.prisma.property.count({
          where: { landlordId, deletedAt: null, status: PropertyStatus.UNAVAILABLE },
        }),
      ]);

    // 2. Inquiries
    const landlordProperties = await this.prisma.property.findMany({
      where: { landlordId, deletedAt: null },
      select: { id: true },
    });
    const propertyIds = landlordProperties.map((p) => p.id);

    const totalInquiries = await this.prisma.inquiry.count({
      where: { propertyId: { in: propertyIds } },
    });

    const unreadInquiries = await this.prisma.inquiry.count({
      where: { propertyId: { in: propertyIds }, status: 'SUBMITTED' },
    });

    // 3. Unread messages for landlord
    const unreadMessagesCount = await this.prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: landlordId },
        conversation: {
          participants: {
            some: { userId: landlordId },
          },
        },
      },
    });

    // 4. Total views across all properties
    const totalViews = await this.prisma.propertyViewEvent.count({
      where: { propertyId: { in: propertyIds } },
    });

    // 5. Response rate & response time across all inquiries
    const allInquiries = await this.prisma.inquiry.findMany({
      where: { propertyId: { in: propertyIds } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        conversation: { select: { id: true } },
      },
    });

    const responded = allInquiries.filter((inq) =>
      ['REPLIED', 'ACCEPTED', 'DECLINED', 'CLOSED'].includes(inq.status),
    );

    const responseRatePercent =
      allInquiries.length > 0 ? Math.round((responded.length / allInquiries.length) * 100) : null;

    let totalResponseMinutes = 0;
    let timedCount = 0;

    for (const inq of responded) {
      const convId = inq.conversation?.id;
      if (convId) {
        const firstReply = await this.prisma.message.findFirst({
          where: {
            conversationId: convId,
            senderId: landlordId,
          },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        });
        if (firstReply) {
          const diffMs = firstReply.createdAt.getTime() - inq.createdAt.getTime();
          if (diffMs > 0) {
            totalResponseMinutes += diffMs / (1000 * 60);
            timedCount++;
          }
        }
      }
    }

    const averageResponseTimeMinutes =
      timedCount > 0 ? Math.round(totalResponseMinutes / timedCount) : null;

    // 6. Recent inquiries (latest 5)
    const recentInquiriesRaw = await this.prisma.inquiry.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        conversation: { select: { id: true } },
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            monthlyRentPkr: true,
            locality: { select: { id: true, name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    const recentInquiries = recentInquiriesRaw.map((inq) => ({
      id: inq.id,
      propertyId: inq.propertyId,
      tenantId: inq.tenantId,
      landlordId: inq.landlordId,
      status: inq.status,
      message: inq.message,
      proposedRentPkr: inq.proposedRentPkr ? Number(inq.proposedRentPkr) : null,
      proposedMoveInDate: inq.proposedMoveInDate ? inq.proposedMoveInDate.toISOString() : null,
      preferredContactMethod: inq.preferredContactMethod,
      conversationId: inq.conversation?.id || null,
      createdAt: inq.createdAt.toISOString(),
      updatedAt: inq.updatedAt.toISOString(),
      property: inq.property
        ? {
            id: inq.property.id,
            title: inq.property.title,
            slug: inq.property.slug,
            monthlyRentPkr: Number(inq.property.monthlyRentPkr),
            localityName: inq.property.locality.name,
            imageUrl: inq.property.images[0]?.url || null,
          }
        : undefined,
      tenant: inq.tenant
        ? {
            id: inq.tenant.id,
            fullName: inq.tenant.fullName,
            email: inq.tenant.email,
            phoneNumber: inq.tenant.phoneNumber,
          }
        : undefined,
    })) as unknown as InquiryResponseDto[];

    // 7. Verification info
    const user = await this.prisma.user.findUnique({
      where: { id: landlordId },
      include: { landlordProfile: true },
    });

    const isVerified = user?.isVerified === true || user?.landlordProfile?.isCnicVerified === true;
    const cnicNumber = user?.landlordProfile?.cnicNumber;
    const cnicMasked = cnicNumber
      ? `${cnicNumber.slice(0, 5)}-*******-${cnicNumber.slice(-1)}`
      : null;

    return {
      totalProperties,
      activeListings,
      pendingReview,
      rentedCount,
      unavailableCount,
      totalInquiries,
      unreadInquiries,
      unreadMessagesCount,
      totalViews,
      averageResponseTimeMinutes,
      responseRatePercent,
      recentInquiries,
      verification: {
        isVerified,
        status: isVerified ? 'VERIFIED' : user?.landlordProfile ? 'PENDING' : 'UNVERIFIED',
        cnicMasked,
      },
    };
  }

  /**
   * Landlord: Reorder images or update primary cover
   */
  async updateImages(
    propertyId: string,
    landlordId: string,
    images: { id: string; sortOrder?: number; isPrimary?: boolean }[],
  ) {
    await this.findByIdForLandlord(propertyId, landlordId);

    const updates = images.map((img) =>
      this.prisma.propertyImage.update({
        where: { id: img.id, propertyId },
        data: {
          ...(img.sortOrder !== undefined && { sortOrder: img.sortOrder }),
          ...(img.isPrimary !== undefined && { isPrimary: img.isPrimary }),
        },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
