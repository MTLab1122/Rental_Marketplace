import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TicketCategory, TicketPriority, TicketStatus } from '@rental-peshawar/shared-types';

export class CreateTicketDto {
  @IsString()
  subject!: string;

  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}

export class AddTicketMessageDto {
  @IsString()
  content!: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class SubmitAppealDto {
  @IsString()
  targetType!: 'USER_SUSPENSION' | 'LISTING_TAKEDOWN' | 'VERIFICATION_REJECTION';

  @IsString()
  targetId!: string;

  @IsString()
  appealReason!: string;

  @IsOptional()
  @IsString()
  supportingEvidence?: string;
}

export class TakedownListingDto {
  @IsString()
  propertyId!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsBoolean()
  notifyLandlord?: boolean;
}
