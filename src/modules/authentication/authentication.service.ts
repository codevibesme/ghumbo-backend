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
import { Profile } from 'passport-google-oauth20';
import { EMediaType } from '../../schemas/misc.schema.js';
import {
  ACCESS_TOKEN_VALIDITY,
  REFRESH_TOKEN_VALIDITY,
} from './authentication.constant.js';
import { UserDto } from '../users/users.dto.js';

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

  private createRefreshToken() {
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    return {
      refreshToken,
      refreshTokenHash,
    };
  }

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

    const { refreshToken, refreshTokenHash } = this.createRefreshToken();

    const { user, session } = await this.txn.run(async (txnManager) => {
      const user = await this.userService.create(
        {
          name: record.name,
          email: record.email,
          phone: record.phone,
          photo: record.photo
            ? {
                label: 'Profile Photo',
                description: 'Profile photo of the user',
                thumbnail_url: record.photo,
                url: record.photo,
                type: EMediaType.IMAGE,
                sort_order: 0,
              }
            : null,
          role: EUserRole.CUSTOMER,
        },
        txnManager,
      );

      await this.authIdentityService.create(
        {
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
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY),
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
      ACCESS_TOKEN_VALIDITY,
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

    const { refreshToken, refreshTokenHash } = this.createRefreshToken();

    const session = await this.authSessionService.create(
      {
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY),
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
      ACCESS_TOKEN_VALIDITY,
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

    const {
      refreshToken: newRefreshToken,
      refreshTokenHash: newRefreshTokenHash,
    } = this.createRefreshToken();

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
      ACCESS_TOKEN_VALIDITY,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async signOut(refreshToken: string): Promise<void> {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const authSession =
      await this.authSessionService.findByRefreshTokenHash(refreshTokenHash);

    if (authSession && !authSession.revokedAt) {
      await this.authSessionService.revokeSession(authSession.id);
    }
  }

  async linkGoogleProvider(
    user: UserDto,
    providerUserId: string,
    refreshToken: string,
    refreshTokenHash: string,
    userSessionSignature: UserSessionSignatureDto,
  ) {
    let accessToken: string;

    const { session } = await this.txn.run(async (txnManager) => {
      await this.authIdentityService.create(
        {
          provider: EAuthIdentityProvider.GOOGLE,
          providerUserId,
          userId: user.id,
        },
        txnManager,
      );

      const session = await this.authSessionService.create(
        {
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY),
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

      return { session };
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
      ACCESS_TOKEN_VALIDITY,
    );

    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  async validateGoogleUser(
    profile: Profile,
    userSessionSignature: UserSessionSignatureDto,
  ): Promise<AuthSuccessResponseDto> {
    const providerUserId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase() || null;
    const isEmailVerified = profile.emails?.[0]?.verified || false;
    const name = profile.displayName || 'User';
    const photo = profile.photos?.[0]?.value || null;

    if (!email || !isEmailVerified) {
      throw new UnauthorizedException(
        'Google account must provide a verified email',
      );
    }

    const authIdentity =
      await this.authIdentityService.findByProviderAndProviderUserId(
        EAuthIdentityProvider.GOOGLE,
        providerUserId,
      );

    const { refreshToken, refreshTokenHash } = this.createRefreshToken();

    if (authIdentity) {
      const user = await this.userService.findByIdOrThrow(authIdentity.userId);

      const session = await this.authSessionService.create(
        {
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY),
          refreshTokenHash: refreshTokenHash,
          revokedAt: null,
          userId: user.id,
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
          role: user.role,
          userId: user.id,
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt,
            lastUsedAt: session.lastUsedAt,
          },
        },
        ACCESS_TOKEN_VALIDITY,
      );

      return {
        refreshToken: refreshToken,
        accessToken: accessToken,
      };
    }

    const existingEmailUser = await this.userService.findByEmailOrPhone(
      email,
      null,
    );
    if (existingEmailUser) {
      return await this.linkGoogleProvider(
        existingEmailUser,
        providerUserId,
        refreshToken,
        refreshTokenHash,
        userSessionSignature,
      );
    }

    let accessToken: string;

    const { user, session } = await this.txn.run(async (txnManager) => {
      const user = await this.userService.create(
        {
          name: name,
          email: email,
          phone: null,
          photo: photo
            ? {
                label: 'Profile Photo',
                description: 'Profile photo of the user',
                thumbnail_url: photo,
                url: photo,
                type: EMediaType.IMAGE,
                sort_order: 0,
              }
            : null,
          role: EUserRole.CUSTOMER,
        },
        txnManager,
      );

      await this.authIdentityService.create(
        {
          provider: EAuthIdentityProvider.GOOGLE,
          providerUserId,
          userId: user.id,
        },
        txnManager,
      );

      await this.authIdentityService.create(
        {
          provider: EAuthIdentityProvider.EMAIL,
          providerUserId: email,
          userId: user.id,
        },
        txnManager,
      );

      const session = await this.authSessionService.create(
        {
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY),
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
      ACCESS_TOKEN_VALIDITY,
    );

    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }
}
