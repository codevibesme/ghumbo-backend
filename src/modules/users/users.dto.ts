import { OmitType, PartialType, PickType } from '@nestjs/swagger';
import { UserEntity } from '../../entities/users.entity.js';

export class UserDto extends UserEntity {}

export class UserDetailsDto extends PickType(UserDto, [
  'id',
  'name',
  'email',
  'phone',
  'photo',
]) {}

export class CreateUserDto extends OmitType(UserDto, [
  'id',
  'createdAt',
  'updatedAt',
  'identities',
  'sessions',
  'inquiries',
  'reviews',
]) {}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'role']),
) {}
