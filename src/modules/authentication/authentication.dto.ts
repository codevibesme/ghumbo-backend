import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
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
  @IsNotEmpty()
  name: string;
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

export class AuthRefreshReqDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
