import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
  AuthRefreshReqDto,
  AuthSuccessResponseDto,
  SignInDto,
  SignUpDto,
} from './authentication.dto.js';
import type { Request, Response } from 'express';
import { UserSessionSignatureDto } from '../auth_sessions/auth_sessions.dto.js';
import { JwtUtilityService } from '../../utilities/jwt/jwt.service.js';
import { ETokenFor, TVerifiedUserPayload } from '../../schemas/jwt.schema.js';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  constructor(
    private readonly jwt: JwtUtilityService,
    private readonly authService: AuthenticationService,
  ) {}

  @Post('/sign-up')
  @ApiBody({ type: SignUpDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiConflictResponse({ description: 'Account already exists' })
  async signUp(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SignUpDto,
  ) {
    if (!(body.email || body.phone) || (body.email && body.phone)) {
      throw new UnprocessableEntityException('Provide either email or phone.');
    }

    const userSessionSignature: UserSessionSignatureDto = {
      userAgent: req.headers['user-agent'] ?? '',
      deviceId: (req.headers['x-device-id'] as string) ?? '',
      ipAddress: req.ip ?? '',
    };

    const data = await this.authService.signUp(body, userSessionSignature);

    return res.status(200).send(data);
  }

  @Post('/sign-in')
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async signIn(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SignInDto,
  ) {
    if (!(body.email || body.phone) || (body.email && body.phone)) {
      throw new UnprocessableEntityException('Provide either email or phone.');
    }

    const userSessionSignature: UserSessionSignatureDto = {
      userAgent: req.headers['user-agent'] ?? '',
      deviceId: (req.headers['x-device-id'] as string) ?? '',
      ipAddress: req.ip ?? '',
    };

    const data = await this.authService.signIn(body, userSessionSignature);

    return res.status(200).send(data);
  }

  @Post('/refresh')
  @ApiBody({ type: AuthRefreshReqDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async refresh(@Res() res: Response, @Body() body: AuthRefreshReqDto) {
    const data = await this.authService.refresh(body.refreshToken);

    return res.status(200).send(data);
  }

  @Post('/sign-out')
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Sign out successful' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async signOut(@Req() req: Request, @Res() res: Response) {
    const payload = await this.jwt.verify<TVerifiedUserPayload>(
      req.headers?.authorization,
      ETokenFor.USER,
    );

    await this.authService.signOut(payload.userId, payload.session.id);

    return res.status(200).send('Sign out successful');
  }
}
