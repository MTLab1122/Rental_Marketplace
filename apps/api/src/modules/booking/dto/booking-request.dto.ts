import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import {
  BookingStatus,
  PaymentMethodType,
  DisputeCategory,
  DisputeStatus,
} from '@rental-peshawar/shared-types';

export class CreateBookingRequestDto {
  @IsString()
  @IsNotEmpty()
  inquiryId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tenantCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingStatusRequestDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelBookingRequestDto {
  @IsString()
  @IsNotEmpty()
  cancellationReason!: string;
}

export class CreatePaymentIntentRequestDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amountPkr?: number;

  @IsEnum(PaymentMethodType)
  paymentMethodType!: PaymentMethodType;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class SubmitManualSlipRequestDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  transactionReference!: string;

  @IsString()
  @IsNotEmpty()
  slipUrl!: string;

  @IsNumber()
  @Min(1)
  amountPkr!: number;

  @IsOptional()
  @IsString()
  accountTitle?: string;
}

export class VerifyManualPaymentRequestDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class SignAgreementRequestDto {
  @IsOptional()
  @IsString()
  signatureData?: string;
}

export class CreateDisputeRequestDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsEnum(DisputeCategory)
  category!: DisputeCategory;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsNumber()
  amountDisputedPkr?: number;

  @IsOptional()
  @IsArray()
  evidenceUrls?: string[];
}

export class DisputeMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class ResolveDisputeRequestDto {
  @IsEnum(DisputeStatus)
  status!: DisputeStatus;

  @IsString()
  @IsNotEmpty()
  resolution!: string;
}

export class RefundRequestDto {
  @IsNumber()
  @Min(1)
  amountPkr!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
