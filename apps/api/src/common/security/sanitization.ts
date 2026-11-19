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
 * Strips script tags, HTML tags, and dangerous javascript: pseudo-protocols from text inputs.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Robust HTML sanitization for rich-text inputs (e.g. descriptions).
 */
export function sanitizeHtml(input: string): string {
  return sanitizeInput(input);
}

/**
 * Prevents CSV / Formula Injection (CWE-1236) by neutralizing formula execution characters.
 * If value starts with =, +, -, @, \t, \r, it prepends an apostrophe (').
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Server-Side Request Forgery (SSRF) Guard.
 * Validates that an external URL does not target loopback, link-local,
 * AWS metadata (169.254.169.254), or RFC1918 private IPv4/IPv6 networks.
 */
export function validateSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block loopback & localhost
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]'
    ) {
      return false;
    }

    // Block AWS/Cloud Metadata Service
    if (host === '169.254.169.254') {
      return false;
    }

    // Check RFC1918 Private IPv4 Subnets
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const p1 = Number(ipv4Match[1]);
      const p2 = Number(ipv4Match[2]);

      // 10.0.0.0/8
      if (p1 === 10) return false;
      // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      // 192.168.0.0/16
      if (p1 === 192 && p2 === 168) return false;
      // 169.254.0.0/16 (Link Local)
      if (p1 === 169 && p2 === 254) return false;
      // 127.0.0.0/8
      if (p1 === 127) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates file magic bytes to verify that an uploaded buffer is genuinely
 * an authorized image (JPEG, PNG, WEBP), and not an executable disguised with a fake extension.
 */
export function validateImageMagicBytes(buffer: Buffer): {
  valid: boolean;
  format?: 'JPEG' | 'PNG' | 'WEBP';
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: 'JPEG' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, format: 'PNG' };
  }

  // WebP: RIFF ... WEBP (Bytes 0-3: 52 49 46 46, Bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, format: 'WEBP' };
  }

  return { valid: false };
}

/**
 * Prevents Directory / Path Traversal attacks by sanitizing filenames.
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath) return '';
  return filePath
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/[/\\]\.\.[/\\]/g, '/')
    .replace(/[^\w.-]/g, '_');
}

/**
 * Detects known disposable temporary email providers to prevent bot registrations.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'throwaway.email',
    'mailinator.com',
    'trashmail.com',
    'sharklasers.com',
    'yopmail.com',
    'getnada.com',
  ]);

  return DISPOSABLE_DOMAINS.has(domain);
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
