import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, PropertyEligibility, PropertyStatus } from '@rental-peshawar/shared-types';

export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSuspended?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SuspendUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 255)
  reason!: string;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isSuspended!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminMfaVerifyDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class AdminLoginDto {
  @IsNotEmpty()
  @IsString()
  emailOrPhone!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  totpToken?: string;
}

export class AdminAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsEnum(PropertyEligibility)
  eligibility?: PropertyEligibility;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}

export class AdminAuditLogQueryDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}

export class UpdateSystemSettingDto {
  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsString()
  description?: string;
}
