import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Enforce presence of JWT secret via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Set process.env.JWT_SECRET to a strong secret key.');
}

// Standardized expirations
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as any, JWT_SECRET as any, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET as any) as JWTPayload;
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as any, JWT_SECRET as any, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as any);
};

export const getJwtExpirations = () => ({
  accessToken: ACCESS_TOKEN_EXPIRES_IN,
  refreshToken: REFRESH_TOKEN_EXPIRES_IN,
});