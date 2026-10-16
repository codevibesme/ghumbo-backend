import { PickType } from '@nestjs/swagger';
import { AuthIdentityEntity } from '../../entities/auth_identities.entity.js';

export class AuthIdentityDto extends AuthIdentityEntity {}

export class CreateAuthIdentityDto extends PickType(AuthIdentityDto, [
  'userId',
  'provider',
  'providerUserId',
  'isVerified',
]) {}
