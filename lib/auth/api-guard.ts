import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// In-memory token bucket rate limiter
const rateLimitMap: Map<string, RateLimitEntry> = new Map();

/**
 * Token bucket rate limiter
 */
export function checkRateLimit(
  key: string,
  capacity: number = 30,
  fillPerSecond: number = 0.5
): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(key);

  if (!entry) {
    entry = { tokens: capacity - 1, lastRefill: now };
    rateLimitMap.set(key, entry);
    return true;
  }

  // Refill tokens
  const elapsedSec = (now - entry.lastRefill) / 1000;
  entry.tokens = Math.min(capacity, entry.tokens + elapsedSec * fillPerSecond);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Get client IP address from standard headers
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Require valid authentication and authorization header or session
 */
export function requireAuth(
  request: NextRequest,
  allowedRoles: ('coach' | 'fighter' | 'admin')[] = ['coach', 'fighter', 'admin']
): { authorized: boolean; response?: NextResponse; user?: { id: string; role: string } } {
  // Support Bearer token, custom API secret, or gym role headers
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-campos-key') || request.headers.get('x-api-key');
  const roleHeader = (request.headers.get('x-camp-role') || 'coach').toLowerCase();
  const userIdHeader = request.headers.get('x-fighter-id') || 'gym_kiosk';

  const configuredSecret = process.env.CAMPOS_API_SECRET;

  // If a master API secret is configured in environment, require it
  if (configuredSecret) {
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const providedKey = bearer || apiKeyHeader;
    if (providedKey !== configuredSecret) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Missing or invalid API credentials.' },
          { status: 401 }
        ),
      };
    }
  }

  // Check role authorization
  if (!allowedRoles.includes(roleHeader as any)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden: Role "${roleHeader}" is not permitted to perform this operation.` },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: userIdHeader, role: roleHeader },
  };
}

/**
 * Handle API errors without leaking sensitive stack traces or internal connection details (S14)
 */
export function handleApiError(
  route: string,
  error: any,
  userMessage: string = 'An internal server error occurred.'
): NextResponse {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.error(`[API Error: ${route}] [ID: ${errorId}]`, error);

  return NextResponse.json(
    {
      error: userMessage,
      errorId,
    },
    { status: 500 }
  );
}
