import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  TenantType,
} from '@rental-peshawar/shared-types';

export class PropertyImageInputDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class CreatePropertyRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(PropertyEligibility, {
    message: 'eligibility must be either STUDENTS_ONLY or FAMILIES_ONLY',
  })
  eligibility!: PropertyEligibility;

  @IsEnum(PropertyType, {
    message: 'propertyType must be a valid PropertyType enum',
  })
  propertyType!: PropertyType;

  @IsNumber()
  @Min(500, { message: 'Monthly rent must be at least PKR 500' })
  @Type(() => Number)
  monthlyRentPkr!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  securityDepositPkr!: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bedrooms!: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bathrooms!: number;

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Type(() => Number)
  areaSqFt?: number;

  @IsString()
  @IsOptional()
  furnishing?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  addressNote?: string;

  @IsNumber()
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Type(() => Number)
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  localityId!: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  amenityIds?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PropertyImageInputDto)
  images?: PropertyImageInputDto[];
}

export class UpdatePropertyRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyEligibility)
  @IsOptional()
  eligibility?: PropertyEligibility;

  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @IsNumber()
  @IsOptional()
  @Min(500)
  @Type(() => Number)
  monthlyRentPkr?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  securityDepositPkr?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Type(() => Number)
  areaSqFt?: number;

  @IsString()
  @IsOptional()
  furnishing?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  addressNote?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  localityId?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  amenityIds?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PropertyImageInputDto)
  images?: PropertyImageInputDto[];
}

export class UpdatePropertyStatusRequestDto {
  @IsEnum(PropertyStatus)
  status!: PropertyStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SearchPropertyQueryDto {
  @IsEnum(PropertyEligibility)
  @IsOptional()
  eligibility?: PropertyEligibility;

  @IsEnum(TenantType)
  @IsOptional()
  tenantType?: TenantType;

  @IsString()
  @IsOptional()
  localityId?: string;

  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minRent?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxRent?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minBedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxBedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minBathrooms?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  furnished?: boolean | string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  amenityIds?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  radiusKm?: number;

  @IsString()
  @IsOptional()
  boundingBox?: string;

  @IsString()
  @IsOptional()
  sort?: 'newest' | 'lowest_rent' | 'highest_rent' | 'nearest';

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class AdminReasonDto {
  @IsString()
  @IsNotEmpty({ message: 'A reason is required for this moderation action' })
  reason!: string;
}

export class AdminPropertyQueryDto {
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsString()
  @IsOptional()
  localityId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
