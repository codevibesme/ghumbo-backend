import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthChallengeDto,
  AuthSuccessResponseDto,
  SignInDto,
  SignUpDto,
  VerifyOtpDto,
} from './authentication.dto.js';
import { UserService } from '../users/users.service.js';
import { AuthIdentityService } from '../auth_identities/auth_identities.service.js';
import { EAuthIdentityProvider } from '../../schemas/auth_identities.schema.js';
import { JwtUtilityService } from '../../utilities/jwt/jwt.service.js';
import { createHash, randomBytes } from 'crypto';
import { ETokenFor } from '../../schemas/jwt.schema.js';
import { AuthSessionService } from '../auth_sessions/auth_sessions.service.js';
import { UserSessionSignatureDto } from '../auth_sessions/auth_sessions.dto.js';
import { EUserRole } from '../../schemas/users.schema.js';
import { TxnHelperService } from '../../helpers/txn.service.js';
import { OtpService } from '../../lib/otp/otp.service.js';
import { EOtpChannel } from '../../schemas/otp.schema.js';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly authIdentityService: AuthIdentityService,
    private readonly authSessionService: AuthSessionService,
    private readonly otpService: OtpService,
    private readonly jwt: JwtUtilityService,
    private readonly txn: TxnHelperService,
  ) {}
  private readonly SALT_ROUNDS = 10;
  private readonly REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000;
  private readonly ACCESS_TOKEN_VALIDITY = 15 * 60;

  private async validateSignUp(record: SignUpDto): Promise<void> {
    const existingUser = await this.userService.findByEmailOrPhone(
      record.email,
      record.phone,
    );

    if (existingUser) {
      throw new ConflictException('Account already exists.');
    }

    const existingAuthIdentity =
      await this.authIdentityService.findByProviderAndProviderUserId(
        record.email
          ? EAuthIdentityProvider.EMAIL
          : EAuthIdentityProvider.PHONE,
        record.email ?? record.phone ?? '',
      );
    if (existingAuthIdentity) {
      throw new ConflictException('Account already exists');
    }
  }

  private async completeSignUp(
    record: SignUpDto,
    userSessionSignature: UserSessionSignatureDto,
  ): Promise<AuthSuccessResponseDto> {
    await this.validateSignUp(record);

    let accessToken: string;

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const { user, session } = await this.txn.run(async (txnManager) => {
      const user = await this.userService.create(
        {
          name: record.name,
          email: record.email,
          phone: record.phone,
          photo: null,
          role: EUserRole.CUSTOMER,
        },
        txnManager,
      );

      await this.authIdentityService.create(
        {
          isVerified: true,
          provider: record.email
            ? EAuthIdentityProvider.EMAIL
            : EAuthIdentityProvider.PHONE,
          providerUserId: record.email ?? record.phone ?? '',
          userId: user.id,
        },
        txnManager,
      );

      const session = await this.authSessionService.create(
        {
          expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_VALIDITY),
          refreshTokenHash: refreshTokenHash,
          revokedAt: null,
          userId: user.id,
          lastUsedAt: new Date(),
          deviceId: userSessionSignature.deviceId,
          ipAddress: userSessionSignature.ipAddress,
          userAgent: userSessionSignature.userAgent,
        },
        txnManager,
      );

      return { user, session };
    });

    accessToken = await this.jwt.sign(
      {
        type: ETokenFor.USER,
        role: user.role,
        userId: user.id,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
          lastUsedAt: session.lastUsedAt,
        },
      },
      this.ACCESS_TOKEN_VALIDITY,
    );

    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  private async validateSignIn(
    record: SignInDto,
  ): Promise<{ userId: string; userRole: EUserRole }> {
    const user = await this.userService.findByEmailOrPhoneOrThrow(
      record.email,
      record.phone,
    );

    await this.authIdentityService.findByUserIdAndProviderOrThrow(
      user.id,
      record.email ? EAuthIdentityProvider.EMAIL : EAuthIdentityProvider.PHONE,
    );

    return { userId: user.id, userRole: user.role };
  }

  private async completeSignIn(
    record: SignInDto,
    userSessionSignature: UserSessionSignatureDto,
  ): Promise<AuthSuccessResponseDto> {
    const { userId, userRole } = await this.validateSignIn(record);

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.authSessionService.create(
      {
        expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_VALIDITY),
        refreshTokenHash: refreshTokenHash,
        revokedAt: null,
        userId,
        lastUsedAt: new Date(),
        deviceId: userSessionSignature.deviceId,
        ipAddress: userSessionSignature.ipAddress,
        userAgent: userSessionSignature.userAgent,
      },
      null,
    );

    const accessToken = await this.jwt.sign(
      {
        type: ETokenFor.USER,
        role: userRole,
        userId,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
          lastUsedAt: session.lastUsedAt,
        },
      },
      this.ACCESS_TOKEN_VALIDITY,
    );

    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  async signUp(record: SignUpDto): Promise<AuthChallengeDto> {
    await this.validateSignUp(record);

    return await this.otpService.createChallenge({
      channel: record.email ? EOtpChannel.EMAIL : EOtpChannel.PHONE,
      destination: record.email ?? record.phone ?? '',
      context: {
        type: 'sign-up',
        email: record.email,
        phone: record.phone,
        name: record.name,
      },
    });
  }

  async signIn(record: SignInDto): Promise<AuthChallengeDto> {
    await this.validateSignIn(record);

    return await this.otpService.createChallenge({
      channel: record.email ? EOtpChannel.EMAIL : EOtpChannel.PHONE,
      destination: record.email ?? record.phone ?? '',
      context: {
        type: 'sign-in',
        email: record.email,
        phone: record.phone,
      },
    });
  }

  async verifyOtpAndCompleteAuth(
    record: VerifyOtpDto,
    userSessionSignature: UserSessionSignatureDto,
  ): Promise<AuthSuccessResponseDto> {
    const context = await this.otpService.validateOtp(
      record.challengeId,
      record.otp,
    );

    if (context.type == 'sign-up')
      return await this.completeSignUp(context, userSessionSignature);

    if (context.type == 'sign-in')
      return await this.completeSignIn(context, userSessionSignature);

    throw new BadRequestException('Invalid verify Request');
  }

  async refresh(refreshToken: string): Promise<AuthSuccessResponseDto> {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const authSession =
      await this.authSessionService.findByRefreshTokenHashOrThrow(
        refreshTokenHash,
      );

    if (authSession.revokedAt || authSession.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session has expired.');
    }

    const user = await this.userService.findByIdOrThrow(authSession.userId);

    const newRefreshToken = randomBytes(32).toString('hex');
    const newRefreshTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    const updatedAuthSession = await this.authSessionService.rotateRefreshToken(
      authSession.id,
      authSession.refreshTokenHash,
      newRefreshTokenHash,
    );

    const accessToken = await this.jwt.sign(
      {
        type: ETokenFor.USER,
        role: user.role,
        userId: user.id,
        session: {
          id: updatedAuthSession.id,
          expiresAt: updatedAuthSession.expiresAt,
          revokedAt: updatedAuthSession.revokedAt,
          lastUsedAt: updatedAuthSession.lastUsedAt,
        },
      },
      this.ACCESS_TOKEN_VALIDITY,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async signOut(userId: string, sessionId: string): Promise<void> {
    const user = await this.userService.findByIdOrThrow(userId);
    const authSession =
      await this.authSessionService.findByIdOrThrow(sessionId);

    if (user.id !== authSession.userId) {
      throw new UnauthorizedException("Session doesn't belong to the user");
    }

    await this.authSessionService.revokeSession(sessionId);
  }
}
