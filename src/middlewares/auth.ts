import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../../generated/prisma/client';
import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyToken, type AuthPayload } from '../lib/auth.js';

export function currentAuth(res: Response): AuthPayload {
  return res.locals['auth'] as AuthPayload;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized();
  }

  try {
    res.locals['auth'] = verifyToken(token);
  } catch {
    throw unauthorized();
  }

  next();
}

export function requireRole(role: Role) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (currentAuth(res).role !== role) {
      throw forbidden();
    }

    next();
  };
}
