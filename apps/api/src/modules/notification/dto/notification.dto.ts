import { IsString, IsNotEmpty, IsIn, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDeviceRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'FCM token cannot be empty.' })
  fcmToken!: string;

  @IsString()
  @IsIn(['ANDROID', 'IOS', 'WEB'], { message: 'Platform must be ANDROID, IOS, or WEB.' })
  platform!: 'ANDROID' | 'IOS' | 'WEB';
}

export class GetNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
