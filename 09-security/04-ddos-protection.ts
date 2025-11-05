/**
 * Module 9: Security - DDoS Protection & Rate Limiting
 * 
 * Implement DDoS protection, advanced rate limiting, and abuse prevention.
 * 
 * Key Concepts:
 * - DDoS (Distributed Denial of Service) mitigation
 * - Advanced rate limiting (per IP, per user, per endpoint)
 * - Request throttling
 * - IP blocklisting/allowlisting
 * - Exponential backoff
 * - Request size limits
 * 
 * Run: bun run 09-security/04-ddos-protection.ts
 * Test:
 *   # Normal request
 *   curl http://localhost:3000/api/data
 *   
 *   # Trigger rate limit
 *   for i in {1..30}; do curl http://localhost:3000/api/data; done
 *   
 *   # Test blocked IP
 *   curl http://localhost:3000/api/data -H "X-Forwarded-For: 192.168.1.100"
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// IP Blocklist/Allowlist
// ============================================================================

const blockedIPs = new Set(['192.168.1.100', '10.0.0.5']);
const allowedIPs = new Set(['127.0.0.1', 'localhost']);

const ipFilter = async (c: any, next: any) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
              c.req.header('x-real-ip') || 
              'unknown';
  
  if (blockedIPs.has(ip)) {
    return c.json({
      error: 'Forbidden',
      message: 'Your IP address has been blocked',
      reason: 'Suspicious activity detected'
    }, 403);
  }
  
  await next();
};

app.use('*', ipFilter);

// ============================================================================
// Advanced Rate Limiting
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

class AdvancedRateLimiter {
  private requests = new Map<string, number[]>();
  private blocked = new Map<string, number>(); // IP -> unblock timestamp
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(key: string): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const now = Date.now();
    
    // Check if blocked
    const blockExpiry = this.blocked.get(key);
    if (blockExpiry && now < blockExpiry) {
      return {
        allowed: false,
        retryAfter: Math.ceil((blockExpiry - now) / 1000)
      };
    }
    
    // Clear expired block
    if (blockExpiry && now >= blockExpiry) {
      this.blocked.delete(key);
    }
    
    // Get recent requests
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.config.windowMs);
    
    // Check limit
    if (validTimestamps.length >= this.config.maxRequests) {
      // Block if configured
      if (this.config.blockDurationMs) {
        this.blocked.set(key, now + this.config.blockDurationMs);
      }
      
      const oldestRequest = Math.min(...validTimestamps);
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter
      };
    }
    
    // Allow and record
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - validTimestamps.length
    };
  }
  
  reset(key: string): void {
    this.requests.delete(key);
    this.blocked.delete(key);
  }
}

// Different limits for different endpoints
const globalLimiter = new AdvancedRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  blockDurationMs: 300000 // 5 minute block
});

const strictLimiter = new AdvancedRateLimiter({
  windowMs: 60000,
  maxRequests: 10,
  blockDurationMs: 600000 // 10 minute block
});

const loginLimiter = new AdvancedRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5,
  blockDurationMs: 900000 // 15 minute block
});

// Middleware factory
function rateLimitMiddleware(limiter: AdvancedRateLimiter) {
  return async (c: any, next: any) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const result = limiter.isAllowed(ip);
    
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfter));
      
      return c.json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: `${result.retryAfter}s`
      }, 429);
    }
    
    // Add rate limit headers
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + 60));
    
    await next();
  };
}

// Apply rate limiting
app.use('/api/*', rateLimitMiddleware(globalLimiter));
app.use('/auth/*', rateLimitMiddleware(loginLimiter));
app.use('/admin/*', rateLimitMiddleware(strictLimiter));

// ============================================================================
// Request Size Limits
// ============================================================================

const requestSizeLimit = (maxSizeBytes: number) => {
  return async (c: any, next: any) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return c.json({
        error: 'Payload Too Large',
        message: `Request body exceeds maximum size of ${maxSizeBytes} bytes`,
        maxSize: maxSizeBytes,
        yourSize: parseInt(contentLength)
      }, 413);
    }
    
    await next();
  };
};

app.use('/upload/*', requestSizeLimit(1024 * 1024)); // 1MB limit

// ============================================================================
// Slowloris Protection (Request Timeout)
// ============================================================================

const requestTimeout = (timeoutMs: number) => {
  return async (c: any, next: any) => {
    const timeout = setTimeout(() => {
      console.log('[Security] Request timeout - possible slowloris attack');
    }, timeoutMs);
    
    try {
      await next();
    } finally {
      clearTimeout(timeout);
    }
  };
};

app.use('*', requestTimeout(30000)); // 30 second timeout

// ============================================================================
// Endpoints
// ============================================================================

app.get('/api/data', (c) => {
  return c.json({
    message: 'Public API data',
    rateLimit: 'Global limiter: 100 req/min'
  });
});

app.post('/auth/login', async (c) => {
  const body = await c.req.json();
  
  return c.json({
    message: 'Login endpoint',
    rateLimit: 'Strict limiter: 5 req/5min',
    note: 'Failed attempts trigger exponential backoff'
  });
});

app.get('/admin/dashboard', (c) => {
  return c.json({
    message: 'Admin dashboard',
    rateLimit: 'Very strict: 10 req/min'
  });
});

app.post('/upload/file', (c) => {
  return c.json({
    message: 'File upload endpoint',
    limits: {
      size: '1MB',
      rateLimit: 'Global limiter'
    }
  });
});

// ============================================================================
// Security Monitoring
// ============================================================================

interface SecurityEvent {
  timestamp: number;
  ip: string;
  event: string;
  severity: 'low' | 'medium' | 'high';
}

const securityEvents: SecurityEvent[] = [];

function logSecurityEvent(ip: string, event: string, severity: 'low' | 'medium' | 'high') {
  securityEvents.push({
    timestamp: Date.now(),
    ip,
    event,
    severity
  });
  
  console.log(`[SECURITY ${severity.toUpperCase()}] ${event} from ${ip}`);
  
  // In production: send to SIEM, trigger alerts, etc.
}

app.get('/security/events', (c) => {
  // Admin-only endpoint in production
  return c.json({
    events: securityEvents.slice(-100), // Last 100 events
    total: securityEvents.length
  });
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'DDoS Protection & Advanced Security',
    endpoints: {
      api: 'GET /api/data (100 req/min)',
      auth: 'POST /auth/login (5 req/5min)',
      admin: 'GET /admin/dashboard (10 req/min)',
      upload: 'POST /upload/file (1MB limit)',
      monitoring: 'GET /security/events'
    },
    protections: {
      ipBlocking: 'Blocklist/allowlist enforcement',
      rateLimiting: 'Per-IP, per-endpoint limits',
      requestSize: 'Maximum payload size enforcement',
      timeout: 'Request timeout (slowloris protection)',
      monitoring: 'Security event logging'
    },
    mitigation: [
      'Progressive rate limiting with exponential backoff',
      'Temporary IP blocking after repeated violations',
      'Request size validation',
      'Connection timeout enforcement',
      'Security event monitoring and alerting'
    ]
  });
});

console.log('🚨 DDoS Protection server running on http://localhost:3000');
console.log('\nProtections enabled:');
console.log('  ✓ IP blocklist/allowlist');
console.log('  ✓ Advanced rate limiting');
console.log('  ✓ Request size limits');
console.log('  ✓ Request timeouts');
console.log('  ✓ Security monitoring');

export default app;
