import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyEligibility, PropertyType } from '@rental-peshawar/shared-types';

export class InviteLandlordDto {
  @IsString()
  emailOrPhone!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  targetLocality?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkPropertyImportItemDto {
  @IsString()
  title!: string;

  @IsEnum(PropertyEligibility)
  eligibility!: PropertyEligibility;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsNumber()
  @Min(1000)
  monthlyRentPkr!: number;

  @IsNumber()
  @Min(0)
  securityDepositPkr!: number;

  @IsNumber()
  @Min(1)
  bedrooms!: number;

  @IsNumber()
  @Min(1)
  bathrooms!: number;

  @IsOptional()
  @IsNumber()
  areaSqFt?: number;

  @IsString()
  address!: string;

  @IsString()
  localityName!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsString()
  description!: string;

  @IsString()
  landlordEmailOrPhone!: string;
}

export class ImportPropertiesBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPropertyImportItemDto)
  properties!: BulkPropertyImportItemDto[];

  @IsOptional()
  @IsString()
  operatorNotes?: string;
}

export class QualityCheckResponseDto {
  propertyId!: string;
  qualityScore!: number; // 0 - 100
  isPublishReady!: boolean;
  checks!: {
    titleLengthValid: boolean;
    descriptionDetailed: boolean;
    pricingRealistic: boolean;
    imagesCountSufficient: boolean;
    locationInsidePeshawar: boolean;
    eligibilityMatched: boolean;
    amenitiesSpecified: boolean;
  };
  recommendations!: string[];
}
