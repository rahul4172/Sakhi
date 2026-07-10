import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt_sign';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
}

/**
 * Generates a JWT token for session management.
 * @param payload The session payload containing userId, email, and sessionId.
 * @returns The signed JWT token string.
 */
export function generateToken(payload: { userId: string; email: string; sessionId: string }): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verifies and decodes a JWT token.
 * @param token The JWT token string.
 * @returns The decoded JWTPayload.
 */
export function verifyToken(token: string): { userId: string; email: string; sessionId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; sessionId: string };
}
