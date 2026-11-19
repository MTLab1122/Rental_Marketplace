import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { AgreementStatus, NotificationType, SignAgreementDto } from '@rental-peshawar/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class AgreementService {
  private readonly logger = new Logger(AgreementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Generates or fetches rental agreement for a booking.
   */
  async getOrCreateAgreementForBooking(bookingId: string) {
    const existing = await this.prisma.rentalAgreement.findUnique({
      where: { bookingId },
      include: { signatures: true },
    });

    if (existing) {
      return existing;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: { include: { locality: true } },
        tenant: true,
        landlord: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Generate Peshawar rental agreement terms HTML
    const termsHtml = `
      <div class="rental-agreement">
        <h1>RESIDENTIAL TENANCY AGREEMENT (PESHAWAR)</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}</p>
        <hr/>
        <h2>1. PARTIES</h2>
        <p><strong>Landlord:</strong> ${booking.landlord.fullName} (User ID: ${booking.landlordId})</p>
        <p><strong>Tenant:</strong> ${booking.tenant.fullName} (User ID: ${booking.tenantId})</p>
        
        <h2>2. PREMISES & ELIGIBILITY</h2>
        <p><strong>Property:</strong> ${booking.property.title}</p>
        <p><strong>Locality:</strong> ${booking.property.locality.name}, Peshawar, Khyber Pakhtunkhwa</p>
        <p><strong>Eligibility Rule:</strong> ${booking.property.eligibility}</p>

        <h2>3. DURATION & FINANCIAL TERMS</h2>
        <p><strong>Commencement Date:</strong> ${booking.startDate.toISOString().split('T')[0]}</p>
        <p><strong>Termination Date:</strong> ${booking.endDate.toISOString().split('T')[0]}</p>
        <p><strong>Monthly Rent:</strong> PKR ${Number(booking.monthlyRentPkr).toLocaleString()} payable in advance by the 5th of each calendar month.</p>
        <p><strong>Security Deposit:</strong> PKR ${Number(booking.securityDepositPkr).toLocaleString()} held in trust until vacancy.</p>
        
        <h2>4. RULES & COMPLIANCE</h2>
        <ul>
          <li>The tenant shall maintain the premises in good condition and not make unauthorized alterations.</li>
          <li>For Student rentals, student conduct policies and Peshawar security regulations apply.</li>
          <li>For Family rentals, quiet residential hours must be respected.</li>
          <li>Subletting is strictly prohibited without explicit written consent of the Landlord.</li>
          <li>Standard notice period for termination is 30 days written notice by either party.</li>
          <li>Governed by the Khyber Pakhtunkhwa Tenancy Laws and Peshawar Rental Regulations.</li>
        </ul>
      </div>
    `.trim();

    const agreement = await this.prisma.rentalAgreement.create({
      data: {
        bookingId: booking.id,
        title: `Rental Agreement - ${booking.property.title}`,
        termsHtml,
        version: 1,
        status: AgreementStatus.SENT,
      },
      include: { signatures: true },
    });

    this.logger.log(`Created rental agreement ${agreement.id} for booking ${bookingId}`);
    return agreement;
  }

  /**
   * Electronically signs an agreement with full audit trail (IP, User-Agent, SHA-256 hash).
   */
  async signAgreement(
    agreementId: string,
    userId: string,
    dto: SignAgreementDto,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const agreement = await this.prisma.rentalAgreement.findUnique({
      where: { id: agreementId },
      include: {
        booking: {
          include: { tenant: true, landlord: true },
        },
        signatures: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException(`Rental agreement ${agreementId} not found`);
    }

    const isTenant = agreement.booking.tenantId === userId;
    const isLandlord = agreement.booking.landlordId === userId;

    if (!isTenant && !isLandlord) {
      throw new ForbiddenException('Only the booking tenant or landlord may sign this agreement');
    }

    const signerRole = isTenant ? 'TENANT' : 'LANDLORD';
    const signer = isTenant ? agreement.booking.tenant : agreement.booking.landlord;

    // Check if user has already signed
    const alreadySigned = agreement.signatures.some((s) => s.signerId === userId);
    if (alreadySigned) {
      throw new BadRequestException(`Agreement has already been signed by ${signerRole}`);
    }

    const timestamp = new Date().toISOString();
    // SHA-256 audit hash
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${agreementId}:${userId}:${signerRole}:${timestamp}:${agreement.termsHtml}`)
      .digest('hex');

    // Create signature record
    await this.prisma.agreementSignature.create({
      data: {
        agreementId,
        signerId: userId,
        signerRole,
        signerName: signer.fullName,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        signatureHash,
        signatureData: dto.signatureData,
      },
    });

    // Determine new status
    let newStatus = agreement.status;
    let signedByTenantAt = agreement.signedByTenantAt;
    let signedByLandlordAt = agreement.signedByLandlordAt;

    if (isTenant) {
      signedByTenantAt = new Date();
      newStatus = signedByLandlordAt ? AgreementStatus.ACTIVE : AgreementStatus.SIGNED_BY_TENANT;
    } else {
      signedByLandlordAt = new Date();
      newStatus = signedByTenantAt ? AgreementStatus.ACTIVE : AgreementStatus.SIGNED_BY_LANDLORD;
    }

    const updated = await this.prisma.rentalAgreement.update({
      where: { id: agreementId },
      data: {
        status: newStatus,
        signedByTenantAt,
        signedByLandlordAt,
      },
      include: { signatures: true },
    });

    // Notify the other party
    const counterPartyId = isTenant ? agreement.booking.landlordId : agreement.booking.tenantId;
    await this.notificationService.notify(
      counterPartyId,
      NotificationType.AGREEMENT_READY,
      'Rental Agreement Signed',
      `${signer.fullName} has signed the rental agreement for ${agreement.booking.propertyId}.`,
      { agreementId, bookingId: agreement.bookingId, status: newStatus },
    );

    await this.auditService.log({
      actorId: userId,
      action: 'RENTAL_AGREEMENT_SIGNED',
      targetType: 'RENTAL_AGREEMENT',
      targetId: agreementId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      after: {
        signerRole,
        signatureHash,
        newStatus,
      },
    });

    return updated;
  }

  /**
   * Fetches agreement details by ID with permission checks.
   */
  async getAgreementById(agreementId: string, userId: string, roles: string[] = []) {
    const agreement = await this.prisma.rentalAgreement.findUnique({
      where: { id: agreementId },
      include: {
        booking: {
          include: {
            property: { select: { id: true, title: true, address: true, localityId: true } },
            tenant: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
            landlord: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          },
        },
        signatures: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException(`Rental agreement ${agreementId} not found`);
    }

    const isAdmin = roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(r));
    const isParticipant =
      agreement.booking.tenantId === userId || agreement.booking.landlordId === userId;

    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Not authorized to view this agreement');
    }

    return agreement;
  }
}
