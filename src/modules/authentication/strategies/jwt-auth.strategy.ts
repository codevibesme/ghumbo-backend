import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  TVerifiedTokenPayload,
  VerifiedTokenPayloadSchema,
} from '../../../schemas/jwt.schema.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    if (!process.env.JWT_SIGNING_SECRET) {
      throw new InternalServerErrorException('JWT_SIGNING_SECRET missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.ghumbo_at ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_SIGNING_SECRET,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  validate(payload: TVerifiedTokenPayload): TVerifiedTokenPayload {
    const result = VerifiedTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return result.data;
  }
}
