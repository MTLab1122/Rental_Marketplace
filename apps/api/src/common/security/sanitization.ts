import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes email address to trimmed lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new BadRequestException('Invalid email address.');
  }
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new BadRequestException('Invalid email format.');
  }
  return normalized;
}

/**
 * Normalizes Pakistani mobile numbers to E.164 format (+923XXXXXXXXX).
 * Accepts:
 *   - 03001234567
 *   - 0300-1234567
 *   - 923001234567
 *   - +923001234567
 */
export function normalizePakistaniPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new BadRequestException('Phone number is required.');
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (/^\+923[0-9]{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^923[0-9]{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^03[0-9]{9}$/.test(cleaned)) {
    return `+92${cleaned.substring(1)}`;
  }

  throw new BadRequestException(
    'Invalid Pakistani phone number. Expected valid format like 03001234567 or +923001234567.',
  );
}

/**
 * Strips script tags and basic HTML injection from text inputs.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Recursively masks sensitive fields in objects for safe logging and audits.
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const SENSITIVE_KEYS = [
    'password',
    'passwordhash',
    'token',
    'refreshtoken',
    'accesstoken',
    'secret',
    'authorization',
    'cookie',
  ];

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
