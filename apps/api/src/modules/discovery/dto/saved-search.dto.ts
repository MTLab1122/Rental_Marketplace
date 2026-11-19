import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyEligibility, PropertyType, AlertFrequency } from '@rental-peshawar/shared-types';

export class SavedSearchFiltersDto {
  @IsOptional()
  @IsEnum(PropertyEligibility)
  eligibility?: PropertyEligibility;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsString()
  localitySlug?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsNumber()
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  northEastLat?: number;

  @IsOptional()
  @IsNumber()
  northEastLng?: number;

  @IsOptional()
  @IsNumber()
  southWestLat?: number;

  @IsOptional()
  @IsNumber()
  southWestLng?: number;

  @IsOptional()
  @IsString()
  sortPreference?: string;

  @IsOptional()
  @IsString()
  query?: string;
}

export class CreateSavedSearchRequestDto {
  @IsString()
  name!: string;

  @ValidateNested()
  @Type(() => SavedSearchFiltersDto)
  filters!: SavedSearchFiltersDto;

  @IsOptional()
  @IsString()
  sortPreference?: string;

  @IsOptional()
  @IsBoolean()
  alertsEnabled?: boolean;

  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;
}

export class UpdateSavedSearchRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SavedSearchFiltersDto)
  filters?: SavedSearchFiltersDto;

  @IsOptional()
  @IsString()
  sortPreference?: string;

  @IsOptional()
  @IsBoolean()
  alertsEnabled?: boolean;

  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;
}

export class UpdateSavedSearchAlertsRequestDto {
  @IsBoolean()
  alertsEnabled!: boolean;

  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;
}

export class NotificationPreferenceRequestDto {
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  pushAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  instantAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  recommendations?: boolean;
}
