import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocalityRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}$/, { message: 'Postal code must be a 5-digit number' })
  postalCode!: string;

  @IsNumber()
  @Min(33.0)
  @Max(35.5)
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Min(70.0)
  @Max(73.0)
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  boundaryGeoJson?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateLocalityRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Postal code must be a 5-digit number' })
  postalCode?: string;

  @IsNumber()
  @IsOptional()
  @Min(33.0)
  @Max(35.5)
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(70.0)
  @Max(73.0)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  boundaryGeoJson?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateLocalityStatusRequestDto {
  @IsBoolean()
  isActive!: boolean;
}
