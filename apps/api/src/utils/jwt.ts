import jwt from 'jsonwebtoken';

import { config } from '../config';

export type JwtPayload = {
  sub: string;
  role?: string;
};

/**
 * JWT helpers — ready for auth features.
 * Not enforced on routes yet.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, config.jwt.secret) as T;
}
