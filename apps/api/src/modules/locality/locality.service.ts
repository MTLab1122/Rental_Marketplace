import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateLocalityRequestDto, UpdateLocalityRequestDto } from './dto/locality.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocalityService {
  private readonly logger = new Logger(LocalityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAllActive() {
    return this.prisma.locality.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        boundaryGeoJson: true,
        isActive: true,
        sortOrder: true,
        _count: {
          select: {
            properties: {
              where: {
                status: 'APPROVED',
                isAvailable: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllAdmin() {
    return this.prisma.locality.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        boundaryGeoJson: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const locality = await this.prisma.locality.findFirst({
      where: {
        OR: isUuid ? [{ id: idOrSlug }, { slug: idOrSlug }] : [{ slug: idOrSlug }],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        boundaryGeoJson: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: {
              where: {
                status: 'APPROVED',
                isAvailable: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!locality) {
      throw new NotFoundException(`Locality '${idOrSlug}' not found.`);
    }

    return locality;
  }

  async create(dto: CreateLocalityRequestDto, adminId?: string) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    // Check uniqueness of name and slug
    const existing = await this.prisma.locality.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug }],
        deletedAt: null,
      },
    });

    if (existing) {
      if (existing.name.toLowerCase() === dto.name.toLowerCase()) {
        throw new ConflictException(`Locality with name '${dto.name}' already exists.`);
      }
      throw new ConflictException(`Locality with slug '${slug}' already exists.`);
    }

    const locality = await this.prisma.locality.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        boundaryGeoJson: (dto.boundaryGeoJson as Prisma.InputJsonValue) ?? undefined,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.auditService.log({
      actorId: adminId || null,
      action: 'locality:create',
      targetType: 'locality',
      targetId: locality.id,
      after: { name: locality.name, slug: locality.slug, isActive: locality.isActive },
    });

    this.logger.log(
      `Locality created: ${locality.name} (${locality.slug}) by admin ${adminId || 'system'}`,
    );
    return locality;
  }

  async update(id: string, dto: UpdateLocalityRequestDto, adminId?: string) {
    const existing = await this.findByIdOrSlug(id);

    const slug = dto.slug
      ? this.slugify(dto.slug)
      : dto.name
        ? this.slugify(dto.name)
        : existing.slug;

    if (dto.name || dto.slug) {
      const conflict = await this.prisma.locality.findFirst({
        where: {
          id: { not: existing.id },
          OR: [...(dto.name ? [{ name: dto.name }] : []), ...(dto.slug ? [{ slug }] : [])],
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new ConflictException('Locality name or slug conflicts with an existing locality.');
      }
    }

    const updated = await this.prisma.locality.update({
      where: { id: existing.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.postalCode && { postalCode: dto.postalCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.boundaryGeoJson !== undefined && {
          boundaryGeoJson: dto.boundaryGeoJson as Prisma.InputJsonValue,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    await this.auditService.log({
      actorId: adminId || null,
      action: 'locality:update',
      targetType: 'locality',
      targetId: updated.id,
      before: { name: existing.name, slug: existing.slug, isActive: existing.isActive },
      after: { name: updated.name, slug: updated.slug, isActive: updated.isActive },
    });

    return updated;
  }

  async delete(id: string, adminId?: string) {
    const existing = await this.findByIdOrSlug(id);

    const deleted = await this.prisma.locality.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.auditService.log({
      actorId: adminId || null,
      action: 'locality:delete',
      targetType: 'locality',
      targetId: deleted.id,
      before: { name: existing.name, isActive: existing.isActive },
      after: { deletedAt: deleted.deletedAt, isActive: false },
    });

    return { success: true, message: `Locality '${existing.name}' deleted successfully.` };
  }

  async updateStatus(id: string, isActive: boolean, adminId?: string) {
    const existing = await this.findByIdOrSlug(id);

    const updated = await this.prisma.locality.update({
      where: { id: existing.id },
      data: { isActive },
    });

    await this.auditService.log({
      actorId: adminId || null,
      action: isActive ? 'locality:activate' : 'locality:deactivate',
      targetType: 'locality',
      targetId: updated.id,
      before: { isActive: existing.isActive },
      after: { isActive: updated.isActive },
    });

    return updated;
  }
}
