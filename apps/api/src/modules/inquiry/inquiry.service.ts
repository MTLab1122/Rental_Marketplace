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
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { ConversationService } from '../conversation/conversation.service';
import { CreateInquiryRequestDto, UpdateInquiryStatusRequestDto } from './dto/inquiry.dto';
import {
  PropertyStatus,
  PropertyEligibility,
  TenantType,
  InquiryStatus,
  NotificationType,
  ErrorCode,
} from '@rental-peshawar/shared-types';
import { generateWhatsAppDeepLink } from '../../common/util/whatsapp.util';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly rateLimiter: RateLimiterService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Tenant submits inquiry for an approved Peshawar property.
   * Strictly enforces:
   * - 10 inquiries per hour per tenant rate limit
   * - Student vs Family eligibility segregation
   * - No self-inquiries by landlord
   * - No duplicate active inquiries for the same property
   * - Automatic conversation and message creation
   */
  async createInquiry(
    tenantId: string,
    dto: CreateInquiryRequestDto,
    currentUser?: { tenantType?: TenantType },
  ) {
    // 1. Rate-limit check: 10 inquiries per hour per tenant
    await this.rateLimiter.enforceRateLimit(
      'inquiry',
      tenantId,
      10,
      3600,
      'Inquiry rate limit exceeded. You can submit up to 10 inquiries per hour.',
    );

    // 2. Property existence and validation
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, deletedAt: null },
      include: {
        landlord: {
          include: {
            landlordProfile: true,
          },
        },
        locality: true,
      },
    });

    if (!property || property.status !== PropertyStatus.APPROVED || !property.isAvailable) {
      throw new NotFoundException(`Property with ID '${dto.propertyId}' not found or unavailable.`);
    }

    if (!property.locality.isActive) {
      throw new UnprocessableEntityException({
        code: ErrorCode.LOCALITY_INACTIVE,
        message: 'Cannot inquire on property in a deactivated locality.',
      });
    }

    // 3. Zero cross-visibility invariant: Tenants cannot inquire on opposite category
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

    // 4. Landlord cannot submit inquiry on their own property
    if (property.landlordId === tenantId) {
      throw new UnprocessableEntityException({
        code: ErrorCode.CANNOT_INQUIRE_OWN_PROPERTY,
        message: 'You cannot submit an inquiry on your own property.',
      });
    }

    // 5. Tenant cannot submit duplicate active inquiry for the same property
    const existingActive = await this.prisma.inquiry.findFirst({
      where: {
        propertyId: dto.propertyId,
        tenantId,
        status: {
          in: [
            InquiryStatus.SUBMITTED,
            InquiryStatus.SEEN,
            InquiryStatus.REPLIED,
            InquiryStatus.ACCEPTED,
          ],
        },
      },
    });

    if (existingActive) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INQUIRY_ALREADY_EXISTS,
        message: 'You already have an active inquiry for this property.',
      });
    }

    // 6. Create inquiry in transaction with property inquiryCount increment
    const [inquiry] = await this.prisma.$transaction([
      this.prisma.inquiry.create({
        data: {
          propertyId: dto.propertyId,
          tenantId,
          landlordId: property.landlordId,
          status: InquiryStatus.SUBMITTED,
          message: dto.message,
          proposedRentPkr: dto.proposedRentPkr,
          proposedMoveInDate: dto.proposedMoveInDate ? new Date(dto.proposedMoveInDate) : null,
          preferredContactMethod: dto.preferredContactMethod || 'IN_APP',
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

    // 7. Automatically create dedicated Conversation for this inquiry
    const conversation = await this.conversationService.createForInquiry(
      inquiry.id,
      property.id,
      tenantId,
      property.landlordId,
    );

    // Seed conversation with initial inquiry message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: tenantId,
        content: dto.message,
      },
    });

    // 8. Dispatch notification to landlord
    await this.notificationService.notify(
      property.landlordId,
      NotificationType.INQUIRY_RECEIVED,
      'New Property Inquiry',
      `You received a new inquiry from ${inquiry.tenant.fullName} for "${property.title}".`,
      { inquiryId: inquiry.id, propertyId: property.id, conversationId: conversation.id },
    );

    await this.auditService.log({
      actorId: tenantId,
      action: 'inquiry:create',
      targetType: 'inquiry',
      targetId: inquiry.id,
      after: {
        propertyId: dto.propertyId,
        status: InquiryStatus.SUBMITTED,
        conversationId: conversation.id,
      },
    });

    this.logger.log(
      `Inquiry ${inquiry.id} created by tenant ${tenantId} for property ${dto.propertyId} with conversation ${conversation.id}`,
    );

    return {
      ...inquiry,
      conversationId: conversation.id,
    };
  }

  /**
   * Retrieves inquiries submitted by the tenant.
   */
  async getMyInquiries(tenantId: string) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { tenantId },
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
        landlord: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            landlordProfile: {
              select: { whatsappNumber: true, whatsappEnabled: true },
            },
          },
        },
        conversation: {
          select: { id: true, isBlocked: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries.map((inq) => {
      let whatsappUrl: string | null = null;
      let canContactWhatsapp = false;

      // WhatsApp deep link authorized only if inquiry is ACCEPTED or explicitly enabled
      const isAccepted = inq.status === InquiryStatus.ACCEPTED;
      const landlord = inq.landlord;
      if (isAccepted || landlord.landlordProfile?.whatsappEnabled) {
        const targetPhone = landlord.landlordProfile?.whatsappNumber || landlord.phoneNumber;
        if (targetPhone) {
          whatsappUrl = generateWhatsAppDeepLink(targetPhone, inq.property?.title);
          canContactWhatsapp = true;
        }
      }

      return {
        ...inq,
        conversationId: inq.conversation?.id || null,
        whatsappUrl,
        canContactWhatsapp,
      };
    });
  }

  /**
   * Retrieves inquiries received by the landlord for their properties.
   */
  async getLandlordInquiries(landlordId: string) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { landlordId },
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
        conversation: {
          select: { id: true, isBlocked: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries.map((inq) => ({
      ...inq,
      conversationId: inq.conversation?.id || null,
    }));
  }

  /**
   * Retrieves single inquiry details with ownership check and WhatsApp auth.
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
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            landlordProfile: {
              select: { whatsappNumber: true, whatsappEnabled: true },
            },
          },
        },
        conversation: {
          select: { id: true, isBlocked: true },
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

    // Determine WhatsApp deep link availability
    let whatsappUrl: string | null = null;
    let canContactWhatsapp = false;
    const isAccepted = inquiry.status === InquiryStatus.ACCEPTED;
    const isTenant = inquiry.tenantId === userId;

    if (isTenant && (isAccepted || inquiry.landlord.landlordProfile?.whatsappEnabled)) {
      const targetPhone =
        inquiry.landlord.landlordProfile?.whatsappNumber || inquiry.landlord.phoneNumber;
      if (targetPhone) {
        whatsappUrl = generateWhatsAppDeepLink(targetPhone, inquiry.property?.title);
        canContactWhatsapp = true;
      }
    }

    return {
      ...inquiry,
      conversationId: inquiry.conversation?.id || null,
      whatsappUrl,
      canContactWhatsapp,
    };
  }

  /**
   * Landlord updates status of an inquiry on their property.
   * Allowed statuses: SEEN, REPLIED, ACCEPTED, DECLINED, CLOSED.
   */
  async updateStatusByLandlord(
    inquiryId: string,
    landlordId: string,
    dto: UpdateInquiryStatusRequestDto,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { property: true, conversation: true },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID '${inquiryId}' not found.`);
    }

    // Landlord can manage only inquiries for own properties
    if (inquiry.landlordId !== landlordId) {
      throw new ForbiddenException('You can manage inquiries only for your own properties.');
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: dto.status },
      include: {
        property: true,
        tenant: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Notify tenant
    const statusMsg =
      dto.status === InquiryStatus.ACCEPTED
        ? `Your inquiry for "${inquiry.property.title}" has been ACCEPTED by the landlord! WhatsApp contact is now revealed.`
        : `Your inquiry for "${inquiry.property.title}" was updated to ${dto.status}.`;

    await this.notificationService.notify(
      inquiry.tenantId,
      NotificationType.INQUIRY_REPLIED,
      'Inquiry Status Update',
      statusMsg,
      { inquiryId, status: dto.status, conversationId: inquiry.conversation?.id },
    );

    await this.auditService.log({
      actorId: landlordId,
      action: `inquiry:landlord_${dto.status.toLowerCase()}`,
      targetType: 'inquiry',
      targetId: inquiryId,
      before: { status: inquiry.status },
      after: { status: updated.status, note: dto.note },
    });

    return updated;
  }

  async updateStatus(inquiryId: string, landlordId: string, dto: UpdateInquiryStatusRequestDto) {
    return this.updateStatusByLandlord(inquiryId, landlordId, dto);
  }

  /**
   * Closes or deletes an inquiry.
   */
  async deleteInquiry(inquiryId: string, userId: string, userRoles: string[] = []) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID '${inquiryId}' not found.`);
    }

    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
    if (inquiry.tenantId !== userId && inquiry.landlordId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to close or delete this inquiry.');
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: InquiryStatus.CLOSED },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'inquiry:close',
      targetType: 'inquiry',
      targetId: inquiryId,
      after: { status: InquiryStatus.CLOSED },
    });

    return { success: true, message: 'Inquiry closed successfully.', inquiry: updated };
  }
}
