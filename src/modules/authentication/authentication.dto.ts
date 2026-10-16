import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsUUID,
  Matches,
  ValidateIf
} from 'class-validator';
import { trim, trimLower } from '../../utilities/transformers.js';

export class SignInDto {
  @ApiProperty({ nullable: true })
  @Transform(trimLower)
  @ValidateIf((o: SignInDto) => !o.phone)
  @IsEmail()
  email: string | null;

  @ApiProperty({ nullable: true })
  @Transform(trim)
  @ValidateIf((o: SignInDto) => !o.email)
  @IsPhoneNumber()
  phone: string | null;
}

export class SignUpDto extends SignInDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}

export class AuthChallengeDto {
  @ApiProperty()
  @IsUUID()
  challengeId: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  resendAfter: number;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsUUID()
  challengeId: string;

  @ApiProperty()
  @Transform(trim)
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}

export class AuthSuccessResponseDto {
  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  accessToken: string;
}

export class AuthRefreshReqDto {
  @ApiProperty()
  refreshToken: string;
}
