import { Module } from '@nestjs/common';
import { JwtUtilityModule } from '../../utilities/jwt/jwt.module.js';
import { BcryptModule } from '../../utilities/bcrypt.module.js';
import { UserModule } from '../users/users.module.js';
import { AuthIdentityModule } from '../auth_identities/auth_identities.module.js';
import { AuthSessionModule } from '../auth_sessions/auth_sessions.module.js';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { TxnHelperModule } from '../../helpers/txn.module.js';
import { OtpModule } from '../../lib/otp/otp.module.js';

@Module({
  imports: [
    TxnHelperModule,
    JwtUtilityModule,
    BcryptModule,
    UserModule,
    AuthIdentityModule,
    AuthSessionModule,
    OtpModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
