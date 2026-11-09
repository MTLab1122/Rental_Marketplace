import { PasswordService } from './password.service';
import { BadRequestException } from '@nestjs/common';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should validate strong password successfully', () => {
    expect(() => service.validatePasswordStrength('Peshawar2026!#')).not.toThrow();
  });

  it('should reject passwords shorter than 8 characters', () => {
    expect(() => service.validatePasswordStrength('Psh1!#')).toThrow(BadRequestException);
  });

  it('should reject passwords missing uppercase characters', () => {
    expect(() => service.validatePasswordStrength('peshawar2026!#')).toThrow(BadRequestException);
  });

  it('should reject passwords missing special characters', () => {
    expect(() => service.validatePasswordStrength('Peshawar202612')).toThrow(BadRequestException);
  });

  it('should hash password and verify matching hash', async () => {
    const raw = 'StrongPass2026!#';
    const hash = await service.hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);

    const matches = await service.comparePassword(raw, hash);
    expect(matches).toBe(true);

    const wrongMatches = await service.comparePassword('WrongPassword123!', hash);
    expect(wrongMatches).toBe(false);
  });
});
