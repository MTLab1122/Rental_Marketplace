import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class FeatureListingPlacementDto {
  @IsString()
  propertyId!: string;

  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}

export class LocalitySponsorshipDto {
  @IsString()
  localityId!: string;

  @IsString()
  sponsorName!: string;

  @IsString()
  bannerText!: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
