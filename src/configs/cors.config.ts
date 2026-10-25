import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import type { NextFunction, Request, Response } from 'express';

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (process.env.ENV === 'local') {
  allowedOrigins.add(`http://localhost:${process.env.PORT ?? 3000}`);
}

export const corsOptions: CorsOptions = {
  origin: [...allowedOrigins],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['content-type', 'x-device-id'],
  maxAge: 600,
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function rejectForeignOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;
  if (SAFE_METHODS.has(req.method) || !origin || allowedOrigins.has(origin)) {
    return next();
  }

  res
    .status(403)
    .json({
      statusCode: 403,
      message: 'Origin not allowed',
      error: 'Forbidden',
    });
}
