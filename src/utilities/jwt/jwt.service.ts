import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import {
  ETokenFor,
  TVerifiedTokenPayload,
  VerifiedTokenPayloadSchema,
} from '../../schemas/jwt.schema.js';

@Injectable()
export class JwtUtilityService {
  constructor(private readonly jwt: JwtService) {}

  async sign(
    payload: Record<string, unknown>,
    expiresIn: number = 3600,
  ): Promise<string> {
    return await this.jwt.signAsync(payload, { expiresIn });
  }

  async verify<T extends TVerifiedTokenPayload>(
    authorization: string | undefined,
    tokenFor: ETokenFor,
  ): Promise<T> {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Missing or malformed authorization header.',
      );
    }

    let decoded: unknown;
    try {
      decoded = await this.jwt.verifyAsync(token, { algorithms: ['HS256'] });
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired.');
      }
      if (e instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token.');
      }
      throw e;
    }

    const parsed = await VerifiedTokenPayloadSchema.safeParseAsync(decoded);
    if (!parsed.success || parsed.data.type !== tokenFor) {
      throw new UnauthorizedException('Invalid token.');
    }

    return parsed.data as T;
  }
}
