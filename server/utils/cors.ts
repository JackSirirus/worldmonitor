/**
 * CORS middleware for Express
 * Supports custom domains via CORS_ORIGINS environment variable
 */

import { Request, Response } from 'express';

// Default allowed patterns (Vercel deployment)
const DEFAULT_ALLOWED_ORIGINS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/.*-elie-habib-projects\.vercel\.app$/,
  /^https:\/\/worldmonitor.*\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function getAllowedOrigins(): RegExp[] {
  const envOrigins = process.env.CORS_ORIGINS;
  if (!envOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  // Parse comma-separated origins
  return envOrigins.split(',').map(origin => {
    // Convert domain to regex pattern
    const escaped = origin.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^https?://${escaped}$`);
  });
}

function isAllowedOrigin(origin: string, patterns: RegExp[]): boolean {
  if (!origin) return false;
  return patterns.some((pattern) => pattern.test(origin));
}

export function createCorsMiddleware() {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
      const allowedPatterns = getAllowedOrigins();

      // Allow requests with no origin (like curl)
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin, allowedPatterns)) {
        callback(null, origin);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
          callback(null, origin);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    maxAge: 86400,
  };
}

// Helper function for individual route CORS headers (if needed)
export function getCorsHeaders(req: Request, methods = 'GET, OPTIONS'): Record<string, string> {
  const origin = req.headers.origin || '';
  const allowedPatterns = getAllowedOrigins();
  const allowOrigin = isAllowedOrigin(origin, allowedPatterns) ? origin : 'https://worldmonitor.app';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function isDisallowedOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;
  const allowedPatterns = getAllowedOrigins();
  return !isAllowedOrigin(origin, allowedPatterns);
}
