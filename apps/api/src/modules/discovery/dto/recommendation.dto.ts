import { IsOptional, IsEnum, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TenantType, PropertyEligibility } from '@rental-peshawar/shared-types';

export class QueryRecommendationsDto {
  @IsOptional()
  @IsEnum(TenantType)
  tenantType?: TenantType;

  @IsOptional()
  @IsEnum(PropertyEligibility)
  eligibility?: PropertyEligibility;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class QuerySimilarDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class QueryNearbyDto {
  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  radiusKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @IsEnum(TenantType)
  tenantType?: TenantType;
}

export class QueryTrendingDto {
  @IsOptional()
  @IsEnum(TenantType)
  tenantType?: TenantType;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}
