import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { UserRole } from '@rental-peshawar/shared-types';

export interface AuthenticatedUserContext {
  id: string;
  roles: UserRole[] | string[];
  isVerified?: boolean;
}

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);

  /**
   * Helper to check admin/super-admin privileges.
   */
  public isAdmin(user: AuthenticatedUserContext): boolean {
    return user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.SUPER_ADMIN);
  }

  public isSuperAdmin(user: AuthenticatedUserContext): boolean {
    return user.roles.includes(UserRole.SUPER_ADMIN);
  }

  /**
   * Enforces User Profile Access.
   * Allowed: Owner or Admin.
   * Denied: Another tenant/landlord attempting to inspect private profile.
   */
  public assertCanAccessProfile(user: AuthenticatedUserContext, targetUserId: string): void {
    if (user.id === targetUserId || this.isAdmin(user)) {
      return;
    }
    this.logger.warn(`[Policy] User ${user.id} denied access to profile ${targetUserId}`);
    throw new ForbiddenException('Access denied. You cannot view or modify another user profile.');
  }

  /**
   * Enforces Property Management (Edit, Delete, Analytics).
   * Deny-by-default: Only the landlord owner or authorized Admin can manage.
   */
  public assertCanManageProperty(
    user: AuthenticatedUserContext,
    property: { id: string; landlordId: string } | null,
  ): void {
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.landlordId === user.id || this.isAdmin(user)) {
      return;
    }

    this.logger.warn(
      `[Policy] User ${user.id} denied management access to property ${property.id}`,
    );
    // 404 protects against resource existence enumeration
    throw new NotFoundException('Property not found or access denied');
  }

  /**
   * Enforces Inquiry Access (View, Reply).
   * Allowed: Inquiring tenant, listing landlord, or authorized Support/Admin.
   */
  public assertCanAccessInquiry(
    user: AuthenticatedUserContext,
    inquiry: { id: string; tenantId: string; property?: { landlordId: string } | null } | null,
  ): void {
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const isTenant = inquiry.tenantId === user.id;
    const isLandlord = inquiry.property?.landlordId === user.id;
    const isStaff =
      this.isAdmin(user) ||
      user.roles.includes(UserRole.SUPPORT) ||
      user.roles.includes(UserRole.MODERATOR);

    if (isTenant || isLandlord || isStaff) {
      return;
    }

    this.logger.warn(`[Policy] User ${user.id} denied access to inquiry ${inquiry.id}`);
    throw new NotFoundException('Inquiry not found or access denied');
  }

  /**
   * Enforces Direct Conversation Participation.
   * User must be an active participant in the conversation thread.
   */
  public assertCanMessageInConversation(
    user: AuthenticatedUserContext,
    participantUserIds: string[],
  ): void {
    if (participantUserIds.includes(user.id)) {
      return;
    }

    this.logger.warn(`[Policy] User ${user.id} denied messaging in foreign conversation`);
    throw new ForbiddenException('Access denied. You are not a participant in this conversation.');
  }

  /**
   * Enforces Booking & Transaction Access.
   * Allowed: Booking tenant or listing landlord or Admin.
   */
  public assertCanAccessBooking(
    user: AuthenticatedUserContext,
    booking: { id: string; tenantId: string; landlordId: string } | null,
  ): void {
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.tenantId === user.id || booking.landlordId === user.id || this.isAdmin(user)) {
      return;
    }

    this.logger.warn(`[Policy] User ${user.id} denied access to booking ${booking.id}`);
    throw new NotFoundException('Booking not found or access denied');
  }

  /**
   * Enforces Favorite Modification.
   * Only the owner can remove their own saved favorite.
   */
  public assertCanManageFavorite(user: AuthenticatedUserContext, favoriteOwnerId: string): void {
    if (user.id === favoriteOwnerId) {
      return;
    }

    this.logger.warn(
      `[Policy] User ${user.id} denied removing favorite of user ${favoriteOwnerId}`,
    );
    throw new ForbiddenException('Access denied. You cannot remove another user favorite.');
  }

  /**
   * Enforces Super-Admin Role Change Operations.
   * Strictly denied to Moderator, Support, and regular Admin.
   */
  public assertCanChangeRole(user: AuthenticatedUserContext, targetRole: UserRole | string): void {
    if (!this.isSuperAdmin(user)) {
      this.logger.warn(`[Policy] Non-SuperAdmin ${user.id} attempted to assign role ${targetRole}`);
      throw new ForbiddenException(
        'Privilege escalation denied. Only SUPER_ADMIN can assign roles.',
      );
    }
  }

  /**
   * Non-negotiable Audit Log Immutability.
   * Modifying or deleting audit logs is strictly FORBIDDEN for EVERY role.
   */
  public assertCanModifyAuditLogs(user: AuthenticatedUserContext): never {
    this.logger.error(
      `[CRITICAL SECURITY ALERT] User ${user.id} attempted to alter or delete immutable audit logs!`,
    );
    throw new ForbiddenException(
      'Regulatory compliance violation: Platform audit logs are immutable and cannot be edited or deleted.',
    );
  }
}
