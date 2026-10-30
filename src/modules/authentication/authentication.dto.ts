import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { trim, trimLower } from '../../utilities/transformers.js';

export class SignInDto {
  @Transform(trimLower)
  @ValidateIf((o: SignInDto) => !o.phone)
  @IsEmail()
  email: string | null;

  @Transform(trim)
  @ValidateIf((o: SignInDto) => !o.email)
  @IsPhoneNumber()
  phone: string | null;
}

export class SignUpDto extends SignInDto {
  @Transform(trim)
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Transform(trim)
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @IsUrl()
  @IsOptional()
  photo?: string | null;
}

export class AuthChallengeDto {
  @IsUUID()
  challengeId: string;

  expiresIn: number;

  resendAfter: number;
}

export class VerifyOtpDto {
  @IsUUID()
  challengeId: string;

  @Transform(trim)
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}

export class AuthSuccessResponseDto {
  refreshToken: string;

  accessToken: string;
}
