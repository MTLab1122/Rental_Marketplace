import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, TenantType } from '@rental-peshawar/shared-types';

export class RegisterRequestDto {
  @ApiProperty({ example: 'tenant@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Peshawar2026!#' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string;

  @ApiProperty({ example: 'Ahmad Khan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string;

  @ApiProperty({ example: '03001234567' })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT })
  @IsEnum(UserRole, { message: 'role must be TENANT, LANDLORD, or ADMIN.' })
  role!: UserRole;

  @ApiPropertyOptional({ enum: TenantType, example: TenantType.STUDENT })
  @IsOptional()
  @IsEnum(TenantType, { message: 'tenantType must be STUDENT or FAMILY.' })
  tenantType?: TenantType;

  @ApiPropertyOptional({ example: 'University of Peshawar' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  institutionName?: string;

  @ApiPropertyOptional({ example: 'Khyber Estates Management' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  businessName?: string;
}

export class LoginRequestDto {
  @ApiProperty({ example: 'tenant@example.com' })
  @IsString()
  @IsNotEmpty()
  emailOrPhone!: string;

  @ApiProperty({ example: 'Peshawar2026!#' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: 'pixel-8-pro-device-id' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RefreshRequestDto {
  @ApiPropertyOptional({ description: 'Refresh token string if not supplied in HTTP-only cookie' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'pixel-8-pro-device-id' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'tenant@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'e5f6...32_byte_token_hex' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewSecurePassword2026!#' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  newPassword!: string;
}

export class UpdateProfileRequestDto {
  @ApiPropertyOptional({ example: 'Ahmad Khan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'University of Peshawar' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  institutionName?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  familyMembersCount?: number;

  @ApiPropertyOptional({ example: 'Khyber Properties' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Saddar Road, Peshawar Cantt' })
  @IsOptional()
  @IsString()
  officeAddress?: string;
}
