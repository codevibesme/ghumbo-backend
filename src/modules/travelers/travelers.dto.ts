import { OmitType, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { TravelerEntity } from '../../entities/travelers.entity.js';
import { ETravelerGender } from '../../schemas/travelers.schema.js';
import { trim, trimLower } from '../../utilities/transformers.js';

export class TravelerDto extends TravelerEntity {}

export class CreateTravelerDto extends OmitType(TravelerDto, [
  'id',
  'bookingTravelers',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'user',
]) {}

export class CreateTravelerReqDto extends OmitType(CreateTravelerDto, [
  'userId',
]) {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  declare lastName: string;

  // "YYYY-MM-DD"; the column is a `date`, so the string is stored as-is.
  @IsDateString({ strict: true })
  declare dateOfBirth: Date;

  @IsEnum(ETravelerGender)
  declare gender: ETravelerGender;

  @Transform(trim)
  @IsOptional()
  @IsPhoneNumber()
  declare phone: string | null;

  @Transform(trimLower)
  @IsOptional()
  @IsEmail()
  declare email: string | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare emergencyContactName: string | null;

  @Transform(trim)
  @IsOptional()
  @IsPhoneNumber()
  declare emergencyContactPhone: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare dietaryNotes: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare medicalNotes: string | null;
}

export class TravelerDetailsDto extends PickType(TravelerDto, [
  'id',
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'phone',
  'email',
]) {}
