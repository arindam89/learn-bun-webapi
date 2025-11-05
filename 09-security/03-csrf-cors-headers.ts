/**
 * Module 9: Security - CSRF, CORS & Security Headers
 * 
 * Implement CSRF protection, CORS policies, and security headers.
 * 
 * Key Concepts:
 * - CSRF (Cross-Site Request Forgery) tokens
 * - CORS (Cross-Origin Resource Sharing)
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Same-origin policy
 * - Token-based CSRF protection
 * 
 * Run: bun run 09-security/03-csrf-cors-headers.ts
 * Test:
 *   curl http://localhost:3000/csrf-token
 *   curl -X POST http://localhost:3000/transfer -H "Content-Type: application/json" -H "X-CSRF-Token: TOKEN" -d '{"amount":100}'
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// ============================================================================
// CSRF Protection
// ============================================================================

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

function generateCSRFToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Middleware to verify CSRF token
const csrfProtection = async (c: any, next: any) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    return next();
  }
  
  const token = c.req.header('X-CSRF-Token');
  
  if (!token) {
    return c.json({
      error: 'CSRF token required',
      message: 'Include X-CSRF-Token header with your request',
      hint: 'Get token from GET /csrf-token'
    }, 403);
  }
  
  const storedToken = csrfTokens.get(token);
  
  if (!storedToken || Date.now() > storedToken.expiresAt) {
    return c.json({
      error: 'Invalid or expired CSRF token',
      message: 'Request a new token from GET /csrf-token'
    }, 403);
  }
  
  await next();
};

// Get CSRF token
app.get('/csrf-token', (c) => {
  const token = generateCSRFToken();
  
  csrfTokens.set(token, {
    token,
    expiresAt: Date.now() + 3600000 // 1 hour
  });
  
  return c.json({
    csrfToken: token,
    expiresIn: 3600,
    usage: 'Include this token in X-CSRF-Token header for state-changing requests'
  });
});

// Protected endpoint requiring CSRF token
app.post('/transfer', csrfProtection, async (c) => {
  const body = await c.req.json();
  
  return c.json({
    success: true,
    message: 'Transfer successful',
    amount: body.amount,
    note: 'CSRF protection verified'
  });
});

// ============================================================================
// CORS Configuration
// ============================================================================

// Strict CORS for API
app.use('/api/*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-ID'],
  maxAge: 86400,
  credentials: true
}));

// Permissive CORS for public endpoints
app.use('/public/*', cors({
  origin: '*',
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type']
}));

app.get('/api/data', (c) => {
  return c.json({ data: 'Protected API data' });
});

app.get('/public/info', (c) => {
  return c.json({ info: 'Public information' });
});

// ============================================================================
// Security Headers
// ============================================================================

const securityHeaders = async (c: any, next: any) => {
  await next();
  
  // Content Security Policy
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
  
  // Strict Transport Security
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  c.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  c.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
};

app.use('*', securityHeaders);

// ============================================================================
// Same-Origin Policy Examples
// ============================================================================

app.get('/same-origin-test', (c) => {
  return c.json({
    message: 'Same-Origin Policy Information',
    sameOrigin: {
      definition: 'Browser security that restricts cross-origin requests',
      allowed: [
        'http://example.com/page1 → http://example.com/page2',
        'https://example.com:443/a → https://example.com:443/b'
      ],
      blocked: [
        'http://example.com → https://example.com (different protocol)',
        'http://example.com → http://api.example.com (different subdomain)',
        'http://example.com:80 → http://example.com:8080 (different port)'
      ]
    },
    cors: {
      purpose: 'Allows controlled relaxation of same-origin policy',
      headers: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods']
    }
  });
});

// ============================================================================
// Double Submit Cookie Pattern (Alternative CSRF Protection)
// ============================================================================

app.get('/csrf-cookie', (c) => {
  const token = generateCSRFToken();
  
  // Set token in cookie
  c.header('Set-Cookie', `csrf_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`);
  
  return c.json({
    message: 'CSRF token set in cookie',
    instruction: 'Send same token in X-CSRF-Token header',
    pattern: 'Double Submit Cookie'
  });
});

const doubleSubmitVerification = async (c: any, next: any) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') {
    return next();
  }
  
  const cookieToken = c.req.header('cookie')?.match(/csrf_token=([^;]+)/)?.[1];
  const headerToken = c.req.header('X-CSRF-Token');
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return c.json({ error: 'CSRF verification failed' }, 403);
  }
  
  await next();
};

app.post('/protected-action', doubleSubmitVerification, (c) => {
  return c.json({
    success: true,
    message: 'Action completed with double-submit CSRF protection'
  });
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'CSRF, CORS & Security Headers Examples',
    endpoints: {
      csrf: {
        getToken: 'GET /csrf-token',
        transfer: 'POST /transfer (requires X-CSRF-Token header)',
        cookieMethod: 'GET /csrf-cookie, POST /protected-action'
      },
      cors: {
        strictApi: 'GET /api/data (specific origins only)',
        public: 'GET /public/info (all origins allowed)'
      },
      info: {
        sameOrigin: 'GET /same-origin-test'
      }
    },
    securityHeaders: {
      csp: 'Content-Security-Policy',
      hsts: 'Strict-Transport-Security',
      frameOptions: 'X-Frame-Options: DENY',
      noSniff: 'X-Content-Type-Options: nosniff',
      xss: 'X-XSS-Protection',
      referrer: 'Referrer-Policy',
      permissions: 'Permissions-Policy'
    },
    csrfProtection: {
      tokenBased: 'Client includes token from server in subsequent requests',
      doubleSubmit: 'Token in cookie must match token in header',
      sameSite: 'SameSite cookie attribute provides additional protection'
    }
  });
});

console.log('🛡️  CSRF & Security Headers server running on http://localhost:3000');
console.log('\nTest CSRF protection:');
console.log('  1. curl http://localhost:3000/csrf-token');
console.log('  2. curl -X POST http://localhost:3000/transfer -H "X-CSRF-Token: <token>" -H "Content-Type: application/json" -d \'{"amount":100}\'');

export default app;
