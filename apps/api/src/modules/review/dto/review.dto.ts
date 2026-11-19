import { IsString, IsInt, Min, Max, IsOptional, IsArray, IsEnum } from 'class-validator';
import {
  ReviewStatus,
  ReviewReportReason,
  ReviewModerationAction,
} from '@rental-peshawar/shared-types';

export class CreateReviewDto {
  @IsString()
  inquiryId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  accuracyRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  safetyRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoneyRating!: number;

  @IsString()
  comment!: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  accuracyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  safetyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoneyRating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class CreateReviewReplyDto {
  @IsString()
  content!: string;
}

export class ReportReviewDto {
  @IsEnum(ReviewReportReason)
  reason!: ReviewReportReason;

  @IsOptional()
  @IsString()
  details?: string;
}

export class ModerateReviewDto {
  @IsEnum(ReviewModerationAction)
  action!: ReviewModerationAction;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryReviewsDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'highest_rated' | 'lowest_rated';
}
