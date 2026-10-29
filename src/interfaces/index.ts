import { Request } from 'express';

import { ETokenFor } from '../schemas/jwt.schema.js';
import { EUserRole } from '../schemas/users.schema.js';
import { Profile } from 'passport-google-oauth20';

export interface AuthenticatedUserReq extends Request {
  user: {
    type: ETokenFor.USER;
    role: EUserRole;
    userId: string;
    session: {
      id: string;
      expiresAt: string;
      revokedAt: string | null;
      lastUsedAt: string;
    };
  };
}

export interface OptionalAuthenticatedUserReq extends Request {
  user: {
    type: ETokenFor.USER;
    role: EUserRole;
    userId: string;
    session: {
      id: string;
      expiresAt: string;
      revokedAt: string | null;
      lastUsedAt: string;
    };
  } | undefined;
}

export interface GoogleUserReq extends Request {
  user?: Profile;
}
