import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Enforces hardened OWASP password policy:
   * - Minimum 12 characters (prevent brute force & credential stuffing)
   * - Maximum 128 characters without truncation
   * - Unicode character support
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one digit
   * - At least one special/symbol character
   */
  validatePasswordStrength(password: string): void {
    if (!password || password.length < 12) {
      throw new BadRequestException('Password must be at least 12 characters long.');
    }
    if (password.length > 128) {
      throw new BadRequestException('Password cannot exceed 128 characters.');
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    // Unicode symbol & ASCII special character match
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    }
  }

  async hashPassword(password: string): Promise<string> {
    this.validatePasswordStrength(password);
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }
}
