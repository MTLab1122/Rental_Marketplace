import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { InquiryStatus } from '@rental-peshawar/shared-types';

export class CreateInquiryRequestDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @MinLength(10, { message: 'Inquiry message must be at least 10 characters long.' })
  @MaxLength(1000, { message: 'Inquiry message must not exceed 1000 characters.' })
  message!: string;

  @IsOptional()
  @IsDateString()
  proposedMoveInDate?: string;

  @IsOptional()
  @IsString()
  preferredContactMethod?: 'PHONE' | 'WHATSAPP' | 'IN_APP';
}

export class UpdateInquiryStatusRequestDto {
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}
