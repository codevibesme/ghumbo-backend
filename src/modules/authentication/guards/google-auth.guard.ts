import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import {
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
} from '../authentication.constant.js';

const isCallback = (req: Request) => req.path.endsWith('/callback');

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    if (isCallback(req)) {
      const expected: string | undefined = req.cookies?.[OAUTH_STATE_COOKIE];
      http
        .getResponse<Response>()
        .clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions);

      if (!expected || req.query.state !== expected) {
        this.logger.warn('Google OAuth state mismatch');
        return true;
      }
    }

    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const http = context.switchToHttp();
    if (isCallback(http.getRequest<Request>())) return undefined;

    const state = randomBytes(16).toString('hex');
    http
      .getResponse<Response>()
      .cookie(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions);

    return { state };
  }

  handleRequest<TUser = Profile>(
    err: unknown,
    user: TUser | false,
  ): TUser | undefined {
    if (err) this.logger.warn(`Google OAuth failed: ${String(err)}`);
    if (err || !user) return undefined;

    return user;
  }
}
