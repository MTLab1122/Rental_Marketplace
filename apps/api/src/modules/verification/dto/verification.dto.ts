import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';
import { VerificationStatus } from '@rental-peshawar/shared-types';

export class SubmitVerificationRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+923\d{9}$/, {
    message: 'Phone number must be a valid Pakistani mobile number in E.164 format (+923xxxxxxxxx)',
  })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-?\d{7}-?\d{1}$/, {
    message: 'CNIC must be in format 12345-1234567-1 or 13 consecutive digits',
  })
  cnicNumber!: string;

  @IsString()
  @IsNotEmpty()
  cnicFrontStorageKey!: string;

  @IsString()
  @IsNotEmpty()
  cnicBackStorageKey!: string;

  @IsString()
  @IsNotEmpty()
  selfieStorageKey!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;
}

export class ReviewVerificationRequestDto {
  @IsEnum(VerificationStatus, {
    message: 'status must be VERIFIED, REJECTED, or EXPIRED',
  })
  status!: VerificationStatus;

  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
