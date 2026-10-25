import type { CookieOptions } from 'express';

// Secure everywhere except local dev, so a staging or prod ENV value can't
// silently send cookies over plain HTTP.
const isSecure = process.env.ENV !== 'local';

export const REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_VALIDITY = 15 * 60 * 1000;
export const OAUTH_STATE_VALIDITY = 10 * 60 * 1000;

export const OAUTH_STATE_COOKIE = 'ghumbo_oauth_state';

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: ACCESS_TOKEN_VALIDITY,
  domain: process.env.DOMAIN,
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax',
  path: '/auth',
  maxAge: REFRESH_TOKEN_VALIDITY,
  domain: process.env.DOMAIN,
};

// Host-only on the API: only /auth/google and its callback ever read it.
export const oauthStateCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax',
  path: '/auth/google',
  maxAge: OAUTH_STATE_VALIDITY,
};
