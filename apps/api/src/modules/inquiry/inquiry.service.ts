import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { CreateInquiryRequestDto, UpdateInquiryStatusRequestDto } from './dto/inquiry.dto';
import {
  PropertyStatus,
  PropertyEligibility,
  TenantType,
  InquiryStatus,
  NotificationType,
  ErrorCode,
} from '@rental-peshawar/shared-types';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Tenant submits inquiry for an approved Peshawar property.
   * Strictly enforces student/family eligibility segregation.
   */
  async createInquiry(
    tenantId: string,
    dto: CreateInquiryRequestDto,
    currentUser?: { tenantType?: TenantType },
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, deletedAt: null },
      include: { landlord: true },
    });

    if (!property || property.status !== PropertyStatus.APPROVED) {
      throw new NotFoundException(`Property with ID '${dto.propertyId}' not found or unavailable.`);
    }

    // Zero cross-visibility invariant: Tenants cannot inquire on opposite category
    if (
      currentUser?.tenantType === TenantType.STUDENT &&
      property.eligibility === PropertyEligibility.FAMILIES_ONLY
    ) {
      throw new NotFoundException(`Property with ID '${dto.propertyId}' not found.`);
    }
    if (
      currentUser?.tenantType === TenantType.FAMILY &&
      property.eligibility === PropertyEligibility.STUDENTS_ONLY
    ) {
      throw new NotFoundException(`Property with ID '${dto.propertyId}' not found.`);
    }

    // Landlord cannot submit inquiry on their own property
    if (property.landlordId === tenantId) {
      throw new UnprocessableEntityException({
        code: ErrorCode.CANNOT_INQUIRE_OWN_PROPERTY,
        message: 'You cannot submit an inquiry on your own property.',
      });
    }

    const [inquiry] = await this.prisma.$transaction([
      this.prisma.inquiry.create({
        data: {
          propertyId: dto.propertyId,
          tenantId,
          landlordId: property.landlordId,
          status: InquiryStatus.SUBMITTED,
          message: dto.message,
          proposedMoveInDate: dto.proposedMoveInDate ? new Date(dto.proposedMoveInDate) : null,
        },
        include: {
          property: {
            select: { id: true, title: true, slug: true, monthlyRentPkr: true },
          },
          tenant: {
            select: { id: true, fullName: true, email: true, phoneNumber: true },
          },
        },
      }),
      this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { inquiryCount: { increment: 1 } },
      }),
    ]);

    // Dispatch notification to landlord
    await this.notificationService.notify(
      property.landlordId,
      NotificationType.INQUIRY_RECEIVED,
      'New Property Inquiry',
      `You received a new inquiry from ${inquiry.tenant.fullName} for "${property.title}".`,
      { inquiryId: inquiry.id, propertyId: property.id },
    );

    await this.auditService.log({
      actorId: tenantId,
      action: 'inquiry:create',
      targetType: 'inquiry',
      targetId: inquiry.id,
      after: { propertyId: dto.propertyId, status: InquiryStatus.SUBMITTED },
    });

    this.logger.log(
      `Inquiry ${inquiry.id} created by tenant ${tenantId} for property ${dto.propertyId}`,
    );
    return inquiry;
  }

  /**
   * Retrieves inquiries for the calling user.
   */
  async getMyInquiries(userId: string, userRoles: string[] = []) {
    const isLandlord = userRoles.includes('LANDLORD');

    const where = isLandlord ? { landlordId: userId } : { tenantId: userId };

    return this.prisma.inquiry.findMany({
      where,
      include: {
        property: {
          include: {
            locality: true,
            images: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
        tenant: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
        landlord: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves single inquiry details with ownership check.
   */
  async getInquiryById(inquiryId: string, userId: string, userRoles: string[] = []) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        property: {
          include: {
            locality: true,
            images: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { sortOrder: 'asc' },
              take: 3,
            },
          },
        },
        tenant: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
        landlord: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID '${inquiryId}' not found.`);
    }

    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
    if (inquiry.tenantId !== userId && inquiry.landlordId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this inquiry.');
    }

    return inquiry;
  }

  /**
   * Updates inquiry status (e.g., landlord marks SEEN, REPLIED, ACCEPTED, or DECLINED).
   */
  async updateStatus(
    inquiryId: string,
    userId: string,
    dto: UpdateInquiryStatusRequestDto,
    userRoles: string[] = [],
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { property: true },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID '${inquiryId}' not found.`);
    }

    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
    if (inquiry.tenantId !== userId && inquiry.landlordId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this inquiry.');
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: dto.status },
    });

    // Notify the other party
    const recipientId = userId === inquiry.landlordId ? inquiry.tenantId : inquiry.landlordId;
    await this.notificationService.notify(
      recipientId,
      NotificationType.INQUIRY_REPLIED,
      'Inquiry Update',
      `Inquiry for "${inquiry.property.title}" status changed to ${dto.status}.`,
      { inquiryId, status: dto.status },
    );

    await this.auditService.log({
      actorId: userId,
      action: `inquiry:status_${dto.status.toLowerCase()}`,
      targetType: 'inquiry',
      targetId: inquiryId,
      before: { status: inquiry.status },
      after: { status: updated.status },
    });

    return updated;
  }
}
