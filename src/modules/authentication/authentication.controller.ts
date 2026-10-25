import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service.js';
import {
  AuthChallengeDto,
  SignInDto,
  SignUpDto,
  VerifyOtpDto,
} from './authentication.dto.js';
import type { Request, Response } from 'express';
import { UserSessionSignatureDto } from '../auth_sessions/auth_sessions.dto.js';
import type { GoogleUserReq } from '../../interfaces/index.js';
import {
  accessCookieOptions,
  refreshCookieOptions,
} from './authentication.constant.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  private readonly logger = new Logger(AuthenticationController.name);

  constructor(private readonly authService: AuthenticationService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    res.cookie('ghumbo_at', accessToken, accessCookieOptions);
    res.cookie('ghumbo_rt', refreshToken, refreshCookieOptions);
  }

  private clearCookies(res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    res.clearCookie('ghumbo_at', accessCookieOptions);
    res.clearCookie('ghumbo_rt', refreshCookieOptions);
  }

  private getUserSessionSignature(req: Request): UserSessionSignatureDto {
    return {
      userAgent: req.headers['user-agent'] ?? '',
      deviceId: (req.headers['x-device-id'] as string) ?? '',
      ipAddress: req.ip ?? '',
    };
  }

  @Post('/sign-up')
  @ApiBody({ type: SignUpDto })
  @ApiOkResponse({ type: AuthChallengeDto })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiConflictResponse({ description: 'Account already exists' })
  async signUp(@Res() res: Response, @Body() body: SignUpDto) {
    if (!(body.email || body.phone) || (body.email && body.phone)) {
      throw new UnprocessableEntityException('Provide either email or phone.');
    }

    const data = await this.authService.signUp(body);

    return res.status(200).send(data);
  }

  @Post('/sign-in')
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ type: AuthChallengeDto })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async signIn(@Res() res: Response, @Body() body: SignInDto) {
    if (!(body.email || body.phone) || (body.email && body.phone)) {
      throw new UnprocessableEntityException('Provide either email or phone.');
    }

    const data = await this.authService.signIn(body);

    return res.status(200).send(data);
  }

  @Post('/verify')
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ description: 'Signed in successfully.' })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiConflictResponse({ description: 'Account already exists' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async verify(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: VerifyOtpDto,
  ) {
    const userSessionSignature = this.getUserSessionSignature(req);

    const data = await this.authService.verifyOtpAndCompleteAuth(
      body,
      userSessionSignature,
    );

    this.setAuthCookies(res, data.accessToken, data.refreshToken);

    return res.status(200).json({ message: 'Signed in successfully.' });
  }

  @Get('/google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {}

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOkResponse({ description: 'Signed in successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiConflictResponse({ description: 'Conflict' })
  async googleCallback(@Req() req: GoogleUserReq, @Res() res: Response) {
    const signInUrl = (error: string) =>
      `${process.env.CLIENT_URL}/sign-in?error=${error}`;

    if (!req.user) {
      const cancelled = req.query.error === 'access_denied';
      return res.redirect(
        signInUrl(cancelled ? 'google_cancelled' : 'google_failed'),
      );
    }

    try {
      const data = await this.authService.validateGoogleUser(
        req.user,
        this.getUserSessionSignature(req),
      );

      this.setAuthCookies(res, data.accessToken, data.refreshToken);

      return res.redirect(process.env.CLIENT_URL + '/auth/callback');
    } catch (e) {
      this.logger.error('Google sign-in failed', e);

      return res.redirect(
        signInUrl(
          e instanceof UnauthorizedException
            ? 'google_email_unverified'
            : 'google_failed',
        ),
      );
    }
  }

  @Post('/refresh')
  @ApiOkResponse({ description: 'Tokens rotated successfully.' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.ghumbo_rt ?? null;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    const data = await this.authService.refresh(refreshToken);

    this.setAuthCookies(res, data.accessToken, data.refreshToken);

    return res.status(200).json({ message: 'Tokens rotated successfully.' });
  }

  @Post('/sign-out')
  @ApiOkResponse({ description: 'Sign out successful' })
  async signOut(@Req() req: Request, @Res() res: Response) {
    const refreshToken: string | undefined = req.cookies.ghumbo_rt;
    if (refreshToken) {
      await this.authService.signOut(refreshToken);
    }

    this.clearCookies(res);

    return res.status(200).json({ message: 'Sign out successful' });
  }
}
