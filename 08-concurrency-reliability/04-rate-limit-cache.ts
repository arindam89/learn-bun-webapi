/**
 * Module 8: Concurrency & Reliability - Rate Limiting & Caching
 * 
 * Implement rate limiting and caching strategies for performance and protection.
 * 
 * Run: bun run 08-concurrency-reliability/04-rate-limit-cache.ts
 * Test:
 *   # Rate limiting
 *   for i in {1..15}; do curl http://localhost:3000/api/data; done
 *   
 *   # Caching
 *   curl http://localhost:3000/users/1  # Miss
 *   curl http://localhost:3000/users/1  # Hit
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Rate Limiting Strategies
// ============================================================================

// Token Bucket Algorithm
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  availableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Sliding Window Rate Limiter
class SlidingWindowLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  tryRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }
  
  getRetryAfter(key: string): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;
    
    const oldest = Math.min(...timestamps);
    const retryAt = oldest + this.windowMs;
    return Math.max(0, retryAt - Date.now());
  }
}

// Apply rate limiters
const globalBucket = new TokenBucket(100, 10); // 100 capacity, 10 tokens/sec
const apiLimiter = new SlidingWindowLimiter(10, 60000); // 10 req/min

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  
  if (!apiLimiter.tryRequest(ip)) {
    const retryAfter = Math.ceil(apiLimiter.getRetryAfter(ip) / 1000);
    
    return c.json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: `${retryAfter}s`
    }, 429);
  }
  
  await next();
});

app.get('/api/data', (c) => {
  return c.json({ data: 'Success', timestamp: Date.now() });
});

// ============================================================================
// Caching Strategies
// ============================================================================

// Simple LRU Cache
class LRUCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private order: string[] = [];
  
  constructor(private maxSize: number, private ttlMs: number) {}
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.order = this.order.filter(k => k !== key);
    this.order.push(key);
    
    return item.value;
  }
  
  set(key: string, value: T): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.order = this.order.filter(k => k !== key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.order.shift();
      if (oldest) this.cache.delete(oldest);
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
    
    this.order.push(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.order = [];
  }
  
  size(): number {
    return this.cache.size;
  }
}

const userCache = new LRUCache<any>(100, 60000); // 100 items, 60s TTL

const users = new Map([
  ['1', { id: '1', name: 'Alice', email: 'alice@example.com' }],
  ['2', { id: '2', name: 'Bob', email: 'bob@example.com' }],
]);

app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  
  // Try cache first
  const cached = userCache.get(`user:${id}`);
  if (cached) {
    return c.json({ ...cached, fromCache: true });
  }
  
  // Fetch from "database"
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Cache the result
  userCache.set(`user:${id}`, user);
  
  return c.json({ ...user, fromCache: false });
});

// Cache invalidation
app.put('/users/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Update user
  const updated = { ...user, ...body };
  users.set(id, updated);
  
  // Invalidate cache
  userCache.set(`user:${id}`, updated); // Update cache with new data
  
  return c.json({ user: updated, message: 'User updated and cache refreshed' });
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Rate Limiting & Caching Examples',
    rateLimiting: {
      tokenBucket: 'Smooth rate limiting with token refill',
      slidingWindow: 'Precise time-based rate limiting',
      endpoint: '/api/data (10 req/min)',
    },
    caching: {
      strategy: 'LRU Cache with TTL',
      size: userCache.size(),
      ttl: '60 seconds',
      endpoints: {
        get: 'GET /users/:id (cached)',
        update: 'PUT /users/:id (invalidates cache)'
      }
    }
  });
});

console.log('⚡ Rate Limiting & Caching server running on http://localhost:3000');

export default app;
