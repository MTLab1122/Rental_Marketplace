import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  private readonly BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Generates a random Base32 secret string (20 bytes / 160 bits).
   */
  generateSecret(length = 32): string {
    const randomBytes = crypto.randomBytes(length);
    let secret = '';
    for (let i = 0; i < randomBytes.length; i++) {
      secret += this.BASE32_CHARS[randomBytes[i]! % 32];
    }
    return secret;
  }

  /**
   * Constructs standard otpauth:// URI for authenticator apps.
   */
  generateOtpAuthUri(account: string, secret: string, issuer = 'PeshawarRentals'): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(account);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates a 6-digit TOTP token for a given counter/timestep.
   */
  private generateTotp(secret: string, counter: number): string {
    const key = this.base32ToBuffer(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1]! & 0xf;
    const code =
      ((digest[offset]! & 0x7f) << 24) |
      ((digest[offset + 1]! & 0xff) << 16) |
      ((digest[offset + 2]! & 0xff) << 8) |
      (digest[offset + 3]! & 0xff);

    const token = (code % 1000000).toString().padStart(6, '0');
    return token;
  }

  /**
   * Verifies a 6-digit TOTP token with ±1 timestep tolerance (90s window).
   */
  verifyToken(secret: string, token: string, window = 1): boolean {
    if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
      return false;
    }

    const currentStep = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const step = currentStep + i;
      const expectedToken = this.generateTotp(secret, step);
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper to decode Base32 string to Buffer.
   */
  private base32ToBuffer(base32: string): Buffer {
    const clean = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < clean.length; i++) {
      const idx = this.BASE32_CHARS.indexOf(clean[i]!);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }
}
