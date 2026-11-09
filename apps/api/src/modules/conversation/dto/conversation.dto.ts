import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportReason } from '@rental-peshawar/shared-types';

export class SendMessageRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty.' })
  @MinLength(1, { message: 'Message content must be at least 1 character long.' })
  @MaxLength(2000, { message: 'Message content must not exceed 2000 characters.' })
  content!: string;
}

export class BlockConversationRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReportConversationRequestDto {
  @IsEnum(ReportReason, { message: 'Invalid report reason.' })
  reason!: ReportReason;

  @IsString()
  @MinLength(5, { message: 'Report details must be at least 5 characters long.' })
  @MaxLength(1000, { message: 'Report details must not exceed 1000 characters.' })
  details!: string;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}
