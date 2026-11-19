import { IsString, IsOptional, IsNumber, IsObject, Min } from 'class-validator';

export class PropertyImpressionRequestDto {
  @IsString()
  propertyId!: string;

  @IsString()
  surface!: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PropertyClickRequestDto {
  @IsString()
  propertyId!: string;

  @IsString()
  surface!: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SearchQueryEventRequestDto {
  @IsOptional()
  @IsString()
  queryText?: string;

  @IsObject()
  filters!: Record<string, any>;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  resultsCount?: number;

  @IsOptional()
  @IsNumber()
  executionTimeMs?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class QueryLocalityDemandDto {
  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsString()
  period?: 'HOURLY' | 'DAILY';
}
