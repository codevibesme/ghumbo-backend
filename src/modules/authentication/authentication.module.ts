import { Module } from '@nestjs/common';
import { JwtUtilityModule } from '../../utilities/jwt/jwt.module.js';
import { UserModule } from '../users/users.module.js';
import { AuthIdentityModule } from '../auth_identities/auth_identities.module.js';
import { AuthSessionModule } from '../auth_sessions/auth_sessions.module.js';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { TxnHelperModule } from '../../helpers/txn.module.js';
import { OtpModule } from '../../lib/otp/otp.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-auth.strategy.js';
import { GoogleStrategy } from './strategies/google-auth.strategy.js';

@Module({
  imports: [
    TxnHelperModule,
    PassportModule.register({ session: false }),
    JwtUtilityModule,
    UserModule,
    AuthIdentityModule,
    AuthSessionModule,
    OtpModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy, GoogleStrategy],
})
export class AuthenticationModule {}
