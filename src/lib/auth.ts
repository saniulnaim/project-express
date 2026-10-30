import jwt from 'jsonwebtoken';
import type { Role } from '../../generated/prisma/client';

export interface AuthPayload {
  id: number;
  role: Role;
}

function secret(): string {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET is not configured');
  }

  return value;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign({ role: payload.role }, secret(), {
    algorithm: 'HS256',
    subject: String(payload.id),
    expiresIn: '1h',
  });
}

export function verifyToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] });

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Malformed token');
  }

  return { id: Number(decoded.sub), role: decoded['role'] as Role };
}
