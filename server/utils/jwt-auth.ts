/**
 * JWT Authentication Middleware
 * Provides JWT-based authentication for admin endpoints
 */

import { Request, Response, NextFunction } from 'express';

// Simple JWT verification (for demo - in production use proper JWT library)
const JWT_SECRET = process.env.JWT_SECRET || 'worldmonitor-secret-change-in-production';

// Simple base64 encoding/decoding (for demo purposes)
function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

export interface JWTPayload {
  userId: string;
  role: 'admin' | 'user';
  exp?: number;
}

/**
 * Generate a simple JWT token (demo only)
 */
export function generateToken(payload: Omit<JWTPayload, 'exp'>): string {
  const header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Encode(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })); // 24 hours
  const signature = base64Encode(header + body);

  return `${header}.${body}.${signature}`;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64Decode(parts[1])) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Authentication middleware
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  // Attach user to request
  (req as any).user = payload;
  next();
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
    }
  }

  next();
}

export default {
  generateToken,
  verifyToken,
  extractToken,
  authenticate,
  requireAdmin,
  optionalAuth,
};
