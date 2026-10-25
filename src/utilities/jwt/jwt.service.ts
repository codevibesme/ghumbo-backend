import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtUtilityService {
  constructor(private readonly jwt: JwtService) {}

  async sign(
    payload: Record<string, unknown>,
    expiresIn: number = 3600,
  ): Promise<string> {
    return await this.jwt.signAsync(payload, { expiresIn });
  }
}
