import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TokenHashService {
  /**
   * Computes SHA-256 cryptographic hash of a refresh token.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Constant-time comparison to prevent timing attacks.
   */
  compareToken(token: string, storedHash: string): boolean {
    const computedHash = this.hashToken(token);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedHash, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
