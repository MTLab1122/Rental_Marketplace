import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { SubmitVerificationRequestDto, ReviewVerificationRequestDto } from './dto/verification.dto';
import { normalizeCnic, maskCnic, hashCnic, encryptCnic } from './cnic.util';
import { VerificationStatus, NotificationType } from '@rental-peshawar/shared-types';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly secretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'peshawar_dev_jwt_access_secret_super_secure_minimum_32_chars';
  }

  /**
   * Landlord submits identity verification documents (CNIC & Selfie)
   */
  async submitVerification(userId: string, dto: SubmitVerificationRequestDto) {
    const normalizedCnic = normalizeCnic(dto.cnicNumber);
    const cnicHash = hashCnic(normalizedCnic);
    const cnicMasked = maskCnic(normalizedCnic);
    const cnicEncrypted = encryptCnic(normalizedCnic, this.secretKey);

    // Verify CNIC is not already taken by another verified user
    const existingVerified = await this.prisma.verificationRecord.findFirst({
      where: {
        cnicNumberHash: cnicHash,
        status: VerificationStatus.VERIFIED,
        userId: { not: userId },
      },
    });

    if (existingVerified) {
      throw new ConflictException('This CNIC is already associated with another verified account.');
    }

    // Upsert verification record for this user
    const existing = await this.prisma.verificationRecord.findFirst({
      where: { userId },
    });

    let record;
    if (existing) {
      record = await this.prisma.verificationRecord.update({
        where: { id: existing.id },
        data: {
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          cnicNumberHash: cnicHash,
          cnicNumberEncrypted: cnicEncrypted,
          cnicNumberMasked: cnicMasked,
          cnicFrontUrl: dto.cnicFrontStorageKey,
          cnicBackUrl: dto.cnicBackStorageKey,
          selfieUrl: dto.selfieStorageKey,
          documentUrl: dto.cnicFrontStorageKey,
          address: dto.address,
          status: VerificationStatus.PENDING,
          reviewNotes: null,
          verifiedById: null,
          verifiedAt: null,
        },
      });
    } else {
      record = await this.prisma.verificationRecord.create({
        data: {
          userId,
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          cnicNumberHash: cnicHash,
          cnicNumberEncrypted: cnicEncrypted,
          cnicNumberMasked: cnicMasked,
          cnicFrontUrl: dto.cnicFrontStorageKey,
          cnicBackUrl: dto.cnicBackStorageKey,
          selfieUrl: dto.selfieStorageKey,
          documentUrl: dto.cnicFrontStorageKey,
          documentType: 'CNIC',
          address: dto.address,
          status: VerificationStatus.PENDING,
        },
      });
    }

    // Update landlord profile
    await this.prisma.landlordProfile.upsert({
      where: { userId },
      update: {
        cnicNumber: cnicMasked,
        isCnicVerified: false,
        officeAddress: dto.address,
      },
      create: {
        userId,
        cnicNumber: cnicMasked,
        isCnicVerified: false,
        officeAddress: dto.address,
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'landlord:submit_verification',
      targetType: 'verification_record',
      targetId: record.id,
      after: { status: VerificationStatus.PENDING, cnicMasked },
    });

    this.logger.log(`Verification submitted by user ${userId} (CNIC: ${cnicMasked})`);

    return {
      id: record.id,
      userId: record.userId,
      fullName: record.fullName,
      phoneNumber: record.phoneNumber,
      cnicNumberMasked: record.cnicNumberMasked,
      status: record.status,
      address: record.address,
      createdAt: record.createdAt,
    };
  }

  /**
   * Landlord retrieves their current verification status
   */
  async getLandlordVerification(userId: string) {
    const record = await this.prisma.verificationRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        userId,
        status: VerificationStatus.UNVERIFIED,
        message: 'No verification request submitted.',
      };
    }

    return {
      id: record.id,
      userId: record.userId,
      fullName: record.fullName,
      phoneNumber: record.phoneNumber,
      cnicNumberMasked: record.cnicNumberMasked,
      status: record.status,
      reviewNotes: record.reviewNotes,
      address: record.address,
      verifiedAt: record.verifiedAt,
      createdAt: record.createdAt,
    };
  }

  /**
   * Admin reviews verification request (Approve, Reject, Expire)
   */
  async reviewVerification(recordId: string, adminId: string, dto: ReviewVerificationRequestDto) {
    const record = await this.prisma.verificationRecord.findUnique({
      where: { id: recordId },
      include: { user: true },
    });

    if (!record) {
      throw new NotFoundException(`Verification record '${recordId}' not found.`);
    }

    const isApproval = dto.status === VerificationStatus.VERIFIED;

    const updated = await this.prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        status: dto.status,
        reviewNotes: dto.reviewNotes || null,
        verifiedById: adminId,
        verifiedAt: isApproval ? new Date() : null,
      },
    });

    // Update User and LandlordProfile verification flags
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: isApproval },
    });

    await this.prisma.landlordProfile.updateMany({
      where: { userId: record.userId },
      data: { isCnicVerified: isApproval },
    });

    // Notify landlord
    const title = isApproval ? 'Landlord Verification Approved' : 'Landlord Verification Decision';
    const body = isApproval
      ? 'Congratulations! Your identity has been verified. You can now publish property listings.'
      : `Your verification request was marked as ${dto.status}. ${dto.reviewNotes || ''}`;

    await this.notificationService.notify(record.userId, NotificationType.SYSTEM, title, body, {
      recordId,
      status: dto.status,
    });

    await this.auditService.log({
      actorId: adminId,
      action: `admin:verification_${dto.status.toLowerCase()}`,
      targetType: 'verification_record',
      targetId: recordId,
      before: { status: record.status },
      after: { status: updated.status, reviewNotes: dto.reviewNotes },
    });

    this.logger.log(`Admin ${adminId} reviewed verification ${recordId}: ${dto.status}`);

    return {
      id: updated.id,
      userId: updated.userId,
      status: updated.status,
      reviewNotes: updated.reviewNotes,
      verifiedAt: updated.verifiedAt,
    };
  }

  /**
   * Admin lists verification records
   */
  async getVerificationsForAdmin(status?: VerificationStatus) {
    return this.prisma.verificationRecord.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phoneNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
