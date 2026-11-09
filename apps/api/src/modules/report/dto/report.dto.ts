import { IsString, IsNotEmpty, IsOptional, IsEnum, IsIn } from 'class-validator';
import { ReportReason, ReportStatus } from '@rental-peshawar/shared-types';

export class CreateReportRequestDto {
  @IsString()
  @IsIn(['PROPERTY', 'USER'], {
    message: 'targetType must be either PROPERTY or USER',
  })
  targetType!: 'PROPERTY' | 'USER';

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsEnum(ReportReason, {
    message:
      'reason must be one of: FAKE_LISTING, WRONG_LOCATION, MISLEADING_INFORMATION, DISCRIMINATION, HARASSMENT, DUPLICATE_LISTING, UNSAFE_PROPERTY, OTHER',
  })
  reason!: ReportReason;

  @IsString()
  @IsOptional()
  details?: string;
}

export class ReviewReportRequestDto {
  @IsEnum(ReportStatus, {
    message: 'status must be OPEN, IN_REVIEW, RESOLVED, or DISMISSED',
  })
  status!: ReportStatus;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
