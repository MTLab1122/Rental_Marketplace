import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AdminAuditLogQueryDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAuditLogs(@Query() query: AdminAuditLogQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actorName: l.actor?.fullName || 'SYSTEM',
        actorEmail: l.actor?.email,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        before: l.before,
        after: l.after,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
