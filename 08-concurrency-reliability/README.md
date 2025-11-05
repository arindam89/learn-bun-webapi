# Module 8: Concurrency & Reliability

## Overview

This module covers essential patterns for building reliable, high-performance APIs that handle concurrent requests safely. Learn to prevent race conditions, implement idempotency, manage rate limiting, and build resilient systems.

## Files in This Module

### 1. `01-concurrency-control.ts`
**Handling concurrent requests safely**

**Concepts:**
- Race conditions and lost updates
- Mutex locks for exclusive access
- Optimistic locking with versioning
- Pessimistic locking with timeouts
- Atomic operations

**Key Patterns:**
- Simple Mutex for critical sections
- Version-based optimistic concurrency
- Resource locking with automatic expiration

### 2. `02-idempotency.ts`
**Building idempotent APIs**

**Concepts:**
- Idempotency keys for duplicate detection
- Request deduplication
- Response caching
- Content hash verification
- Naturally idempotent operations (PUT, DELETE)

**Why It Matters:**
- Network retries are common
- Prevents duplicate payments/orders
- Safe retry logic
- Better client experience

### 3. `03-double-voting.ts`
**Preventing duplicate actions**

**Concepts:**
- Composite keys (user + resource)
- Duplicate vote/like prevention
- Time-based action limits
- One-time operations
- Vote changing logic

**Use Cases:**
- Polls and voting systems
- Like/favorite buttons
- Daily rewards
- One-time coupons

### 4. `04-rate-limit-cache.ts`
**Rate limiting and caching strategies**

**Concepts:**
- Token bucket algorithm
- Sliding window rate limiting
- LRU cache with TTL
- Cache invalidation
- Performance optimization

**Benefits:**
- API protection from abuse
- Reduced database load
- Faster response times
- Better resource utilization

### 5. `05-circuit-breaker.ts`
**Resilient system design**

**Concepts:**
- Circuit breaker pattern
- Failure threshold tracking
- Automatic recovery (CLOSED → OPEN → HALF_OPEN)
- Load testing simulation
- Cascading failure prevention

**States:**
- CLOSED: Normal operation
- OPEN: Failing fast
- HALF_OPEN: Testing recovery

## Key Takeaways

### Concurrency Control

**Problem:** Race Conditions
```typescript
// UNSAFE - race condition
const current = counter;
await processData();
counter = current + 1; // Lost updates!
```

**Solution:** Mutex Lock
```typescript
await mutex.runExclusive(async () => {
  const current = counter;
  await processData();
  counter = current + 1; // Safe!
});
```

### Idempotency

**Problem:** Duplicate Requests
```typescript
// Creates duplicate charges!
POST /charges {"amount": 100}
POST /charges {"amount": 100}
// Result: $200 charged
```

**Solution:** Idempotency Keys
```typescript
POST /charges
Headers: Idempotency-Key: abc123
{"amount": 100}

POST /charges
Headers: Idempotency-Key: abc123
{"amount": 100}
// Result: $100 charged (cached response returned)
```

### Rate Limiting

**Token Bucket:**
- Smooth rate limiting
- Burst handling
- Token refill over time

**Sliding Window:**
- Precise time-based limits
- No burst allowed
- Exact request tracking

### Circuit Breaker

```
Normal → Failures → OPEN (blocking)
   ↑                     ↓
   └── HALF_OPEN ← Time passes
```

**Benefits:**
- Fail fast when service is down
- Prevent resource exhaustion
- Automatic recovery testing
- Better error messages

## Best Practices

### 1. Always Use Idempotency for POST
```typescript
app.post('/payments', (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  
  if (!idempotencyKey) {
    return c.json({ error: 'Idempotency-Key required' }, 400);
  }
  
  // Check cache, process if new
});
```

### 2. Choose Right Locking Strategy

**Optimistic (Version-Based):**
- Low contention scenarios
- Better performance
- Retry on conflict

**Pessimistic (Explicit Locks):**
- High contention
- Critical operations
- Guaranteed exclusivity

### 3. Implement Rate Limiting per Client
```typescript
const limiter = new RateLimiter(100, 60000); // 100/min

app.use('*', (c, next) => {
  const clientId = c.req.header('x-api-key') || ip;
  
  if (!limiter.tryRequest(clientId)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  return next();
});
```

### 4. Use Circuit Breakers for External APIs
```typescript
const githubCircuit = new CircuitBreaker(5, 30000);

app.get('/github-data', async (c) => {
  try {
    const data = await githubCircuit.execute(() => 
      fetch('https://api.github.com/...')
    );
    return c.json(data);
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      return c.json({ error: 'Service temporarily unavailable' }, 503);
    }
    throw error;
  }
});
```

### 5. Cache Strategically
```typescript
// Cache expensive computations
const cache = new LRUCache(1000, 300000); // 1000 items, 5min TTL

app.get('/reports/:id', async (c) => {
  const cached = cache.get(id);
  if (cached) return c.json(cached);
  
  const report = await generateExpensiveReport(id);
  cache.set(id, report);
  
  return c.json(report);
});
```

## Common Patterns

### Preventing Double Voting
```typescript
const votes = new Map<string, Set<string>>(); // pollId -> userIds

function vote(pollId, userId, option) {
  const key = `${pollId}:${userId}`;
  
  if (votes.get(pollId)?.has(userId)) {
    throw new Error('Already voted');
  }
  
  votes.get(pollId)?.add(userId);
  // Record vote...
}
```

### Idempotent Updates
```typescript
interface Resource {
  id: string;
  data: any;
  version: number;
}

function update(id, data, expectedVersion) {
  const resource = resources.get(id);
  
  if (resource.version !== expectedVersion) {
    throw new Error('Conflict - resource was modified');
  }
  
  resource.data = data;
  resource.version++;
}
```

### Rate Limiting with Retry-After
```typescript
if (!limiter.tryRequest(clientId)) {
  const retryAfter = limiter.getRetryAfter(clientId);
  
  return c.json({
    error: 'Too Many Requests',
    retryAfter: Math.ceil(retryAfter / 1000)
  }, 429);
}
```

## Exercises

1. **Build a booking system** that prevents double-booking of resources
2. **Implement distributed rate limiting** using Redis (conceptually)
3. **Create an idempotent payment API** with proper error handling
4. **Build a caching layer** with multiple cache strategies (LRU, LFU, TTL)
5. **Implement retry logic** with exponential backoff and circuit breaker

## Resources

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Idempotency in APIs](https://stripe.com/docs/api/idempotent_requests)
- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Token_bucket)
- [Optimistic vs Pessimistic Locking](https://stackoverflow.com/questions/129329)

---

**Next Module:** Security patterns and protection mechanisms
