import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { PropertyEligibility, PropertyType, ReferralType } from '@rental-peshawar/shared-types';

export class CreateSavedSearchDto {
  @IsString()
  title!: string;

  @IsEnum(PropertyEligibility)
  eligibility!: PropertyEligibility;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minRentPkr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRentPkr?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  bedrooms?: number;

  @IsOptional()
  alertsEnabled?: boolean;
}

export class CreateLandlordReviewDto {
  @IsString()
  landlordId!: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  accuracyRating?: number;

  @IsString()
  comment!: string;
}

export class RecordRecentlyViewedDto {
  @IsString()
  propertyId!: string;
}

export class ClaimReferralDto {
  @IsString()
  referralCode!: string;

  @IsEnum(ReferralType)
  referralType!: ReferralType;
}
