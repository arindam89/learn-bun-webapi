/**
 * Module 7: Hono Framework - Middleware
 * 
 * Explore Hono's middleware system and built-in middleware.
 * Compare with custom middleware from Module 3.
 * 
 * Key Concepts:
 * - Built-in middleware (logger, cors, jwt, etc.)
 * - Custom middleware creation
 * - Middleware composition
 * - Request/Response context
 * - Middleware order and execution
 * 
 * Advantages of Hono Middleware:
 * - Clean, composable API
 * - Type-safe context
 * - Built-in helpers
 * - Easy to test
 * 
 * Run: bun run 07-hono-framework/02-hono-middleware.ts
 * Test:
 *   curl http://localhost:3000/public
 *   curl http://localhost:3000/protected -H "Authorization: Bearer secret-token"
 *   curl http://localhost:3000/admin -H "Authorization: Bearer secret-token"
 *   curl -X POST http://localhost:3000/api/data -H "Content-Type: application/json" -d '{"value": 42}'
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import type { Context, Next } from 'hono';

const app = new Hono();

// ============================================================================
// Built-in Middleware
// ============================================================================

// Logger middleware - logs all requests
app.use('*', logger());

// Timing middleware - adds Server-Timing header
app.use('*', timing());

// CORS middleware - handles cross-origin requests
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400,
  credentials: true,
}));

// ============================================================================
// Custom Middleware
// ============================================================================

// Request ID middleware
const requestId = async (c: Context, next: Next) => {
  const id = crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-ID', id);
  await next();
};

// Authentication middleware
const auth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - Missing token' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation (in production, verify JWT)
  if (token !== 'secret-token') {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
  
  // Add user info to context
  c.set('user', { id: '123', username: 'john_doe', role: 'user' });
  await next();
};

// Admin-only middleware
const adminOnly = async (c: Context, next: Next) => {
  const user = c.get('user') as any;
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }
  
  await next();
};

// Rate limiting middleware (simple in-memory)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const limit = rateLimits.get(ip);
    
    if (limit) {
      if (now > limit.resetAt) {
        // Reset window
        rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
      } else if (limit.count >= maxRequests) {
        // Rate limit exceeded
        const resetIn = Math.ceil((limit.resetAt - now) / 1000);
        return c.json({
          error: 'Too Many Requests',
          retryAfter: resetIn
        }, 429);
      } else {
        // Increment count
        limit.count++;
      }
    } else {
      // First request
      rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    }
    
    await next();
  };
};

// Performance monitoring middleware
const performanceMonitor = async (c: Context, next: Next) => {
  const start = performance.now();
  
  await next();
  
  const duration = performance.now() - start;
  c.header('X-Response-Time', `${duration.toFixed(2)}ms`);
  
  console.log(`[Performance] ${c.req.method} ${c.req.path} - ${duration.toFixed(2)}ms`);
};

// Request validation middleware
const validateJson = async (c: Context, next: Next) => {
  if (c.req.method === 'POST' || c.req.method === 'PUT') {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return c.json({
        error: 'Bad Request',
        message: 'Content-Type must be application/json'
      }, 400);
    }
    
    try {
      // Try to parse JSON
      const body = await c.req.json();
      // Store parsed body for reuse
      c.set('parsedBody', body);
    } catch (err) {
      return c.json({
        error: 'Bad Request',
        message: 'Invalid JSON in request body'
      }, 400);
    }
  }
  
  await next();
};

// ============================================================================
// Apply Middleware to Routes
// ============================================================================

// Global middleware
app.use('*', requestId);
app.use('*', performanceMonitor);

// Public route (no auth required)
app.get('/public', (c) => {
  const requestId = c.get('requestId');
  return c.json({
    message: 'This is a public endpoint',
    requestId
  });
});

// Protected routes (auth required)
app.use('/protected/*', auth);

app.get('/protected/profile', (c) => {
  const user = c.get('user');
  const requestId = c.get('requestId');
  
  return c.json({
    message: 'Protected resource',
    user,
    requestId
  });
});

// Admin routes (auth + admin role required)
app.use('/admin/*', auth);
app.use('/admin/*', adminOnly);

app.get('/admin/stats', (c) => {
  const user = c.get('user');
  
  return c.json({
    message: 'Admin-only statistics',
    user,
    stats: {
      totalUsers: 1000,
      activeUsers: 250
    }
  });
});

// Rate-limited API endpoint
app.use('/api/*', rateLimit(10, 60000)); // 10 requests per minute

app.post('/api/data', validateJson, async (c) => {
  const body = c.get('parsedBody');
  const requestId = c.get('requestId');
  
  return c.json({
    success: true,
    requestId,
    received: body
  }, 201);
});

// Chaining multiple middleware
app.get(
  '/special',
  auth,
  async (c, next) => {
    console.log('Custom middleware 1');
    await next();
  },
  async (c, next) => {
    console.log('Custom middleware 2');
    await next();
  },
  (c) => {
    return c.json({ message: 'Special endpoint with multiple middleware' });
  }
);

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
    requestId: c.get('requestId')
  }, 404);
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    requestId: c.get('requestId')
  }, 500);
});

console.log('🔥 Hono server with middleware running on http://localhost:3000');
console.log('\nEndpoints:');
console.log('  GET  /public              - Public endpoint');
console.log('  GET  /protected/profile   - Requires auth');
console.log('  GET  /admin/stats         - Requires admin role');
console.log('  POST /api/data            - Rate limited, validates JSON');
console.log('  GET  /special             - Multiple middleware chain');
console.log('\nAuth Token: Bearer secret-token');

export default app;
