import * as crypto from 'crypto';

export function normalizeCnic(cnic: string): string {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length !== 13) {
    throw new Error('CNIC must be exactly 13 digits.');
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function maskCnic(normalizedCnic: string): string {
  const parts = normalizedCnic.split('-');
  if (parts.length === 3 && parts[0] && parts[2]) {
    return `${parts[0]}-*******-${parts[2]}`;
  }
  return '*****-*******-*';
}

export function hashCnic(normalizedCnic: string): string {
  return crypto.createHash('sha256').update(normalizedCnic).digest('hex');
}

export function encryptCnic(normalizedCnic: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest(); // 32 bytes
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(normalizedCnic, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptCnic(encryptedPayload: string, secretKey: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(':');
  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error('Invalid encrypted payload format');
  }
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
