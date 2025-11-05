/**
 * Module 8: Concurrency & Reliability - Concurrency Control
 * 
 * Learn how to handle concurrent requests safely and prevent race conditions.
 * 
 * Key Concepts:
 * - Race conditions in concurrent operations
 * - Locks and mutexes
 * - Optimistic vs pessimistic locking
 * - Transaction isolation
 * - Read-modify-write operations
 * - Atomic operations
 * 
 * Common Problems:
 * - Lost updates
 * - Dirty reads
 * - Non-repeatable reads
 * - Phantom reads
 * 
 * Run: bun run 08-concurrency-reliability/01-concurrency-control.ts
 * Test:
 *   # Simulate concurrent updates (race condition)
 *   curl -X POST http://localhost:3000/counter/increment &
 *   curl -X POST http://localhost:3000/counter/increment &
 *   curl -X POST http://localhost:3000/counter/increment &
 *   curl http://localhost:3000/counter
 *   
 *   # Safe concurrent updates with lock
 *   curl -X POST http://localhost:3000/counter-safe/increment &
 *   curl -X POST http://localhost:3000/counter-safe/increment &
 *   curl http://localhost:3000/counter-safe
 *   
 *   # Optimistic locking
 *   curl -X PUT http://localhost:3000/accounts/1/transfer -H "Content-Type: application/json" -d '{"amount":100,"version":1}'
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Problem 1: Race Condition in Counter (UNSAFE)
// ============================================================================

let unsafeCounter = 0;

app.get('/counter', (c) => {
  return c.json({ 
    counter: unsafeCounter,
    note: 'This counter has race conditions!'
  });
});

app.post('/counter/increment', async (c) => {
  // RACE CONDITION: Read-modify-write is not atomic
  const current = unsafeCounter;
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Another request might have modified the counter by now!
  unsafeCounter = current + 1;
  
  return c.json({ 
    counter: unsafeCounter,
    warning: 'Race condition possible!'
  });
});

app.post('/counter/reset', (c) => {
  unsafeCounter = 0;
  return c.json({ message: 'Counter reset' });
});

// ============================================================================
// Solution 1: Simple Mutex Lock
// ============================================================================

class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];
  
  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    
    // Wait in queue
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }
  
  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
  
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const counterLock = new Mutex();
let safeCounter = 0;

app.get('/counter-safe', (c) => {
  return c.json({ 
    counter: safeCounter,
    note: 'This counter is protected by mutex'
  });
});

app.post('/counter-safe/increment', async (c) => {
  const result = await counterLock.runExclusive(async () => {
    const current = safeCounter;
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    safeCounter = current + 1;
    return safeCounter;
  });
  
  return c.json({ 
    counter: result,
    message: 'Thread-safe increment'
  });
});

app.post('/counter-safe/reset', (c) => {
  safeCounter = 0;
  return c.json({ message: 'Safe counter reset' });
});

// ============================================================================
// Solution 2: Optimistic Locking with Versioning
// ============================================================================

interface Account {
  id: string;
  balance: number;
  version: number;
  lastUpdated: string;
}

const accounts = new Map<string, Account>([
  ['1', { id: '1', balance: 1000, version: 1, lastUpdated: new Date().toISOString() }],
  ['2', { id: '2', balance: 500, version: 1, lastUpdated: new Date().toISOString() }],
]);

app.get('/accounts/:id', (c) => {
  const id = c.req.param('id');
  const account = accounts.get(id);
  
  if (!account) {
    return c.json({ error: 'Account not found' }, 404);
  }
  
  return c.json(account);
});

app.put('/accounts/:id/transfer', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { amount, version } = body;
  
  const account = accounts.get(id);
  
  if (!account) {
    return c.json({ error: 'Account not found' }, 404);
  }
  
  // Optimistic locking: Check version
  if (account.version !== version) {
    return c.json({
      error: 'Conflict - Account was modified',
      message: 'Someone else updated this account. Please retry with current version.',
      currentVersion: account.version
    }, 409); // 409 Conflict
  }
  
  // Validate business logic
  if (account.balance < amount) {
    return c.json({ error: 'Insufficient funds' }, 400);
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Update with new version
  const updated: Account = {
    ...account,
    balance: account.balance - amount,
    version: account.version + 1,
    lastUpdated: new Date().toISOString()
  };
  
  accounts.set(id, updated);
  
  return c.json({
    success: true,
    account: updated,
    message: 'Transfer successful'
  });
});

// ============================================================================
// Solution 3: Pessimistic Locking with Timeouts
// ============================================================================

class ResourceLock {
  private locks = new Map<string, { timestamp: number; owner: string }>();
  private timeout = 5000; // 5 seconds
  
  acquire(resourceId: string, ownerId: string): boolean {
    const existing = this.locks.get(resourceId);
    
    // Check if lock exists and is still valid
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.timeout) {
        // Lock is still held by someone else
        return false;
      }
      // Lock has expired, we can acquire it
    }
    
    this.locks.set(resourceId, {
      timestamp: Date.now(),
      owner: ownerId
    });
    
    return true;
  }
  
  release(resourceId: string, ownerId: string): boolean {
    const lock = this.locks.get(resourceId);
    
    if (!lock || lock.owner !== ownerId) {
      return false;
    }
    
    this.locks.delete(resourceId);
    return true;
  }
  
  isLocked(resourceId: string): boolean {
    const lock = this.locks.get(resourceId);
    if (!lock) return false;
    
    const age = Date.now() - lock.timestamp;
    return age < this.timeout;
  }
}

const resourceLock = new ResourceLock();

const resources = new Map<string, { id: string; value: string }>([
  ['res1', { id: 'res1', value: 'Initial value' }],
]);

app.post('/resources/:id/lock', (c) => {
  const id = c.req.param('id');
  const ownerId = c.req.header('X-Owner-ID') || crypto.randomUUID();
  
  const acquired = resourceLock.acquire(id, ownerId);
  
  if (!acquired) {
    return c.json({
      error: 'Resource is locked',
      message: 'Another process is currently modifying this resource'
    }, 423); // 423 Locked
  }
  
  return c.json({
    success: true,
    ownerId,
    message: 'Lock acquired. You have 5 seconds to complete your operation.',
    expiresIn: 5000
  });
});

app.put('/resources/:id', async (c) => {
  const id = c.req.param('id');
  const ownerId = c.req.header('X-Owner-ID');
  const body = await c.req.json();
  
  if (!ownerId) {
    return c.json({ error: 'X-Owner-ID header required' }, 400);
  }
  
  // Check if caller owns the lock
  const lock = resourceLock['locks'].get(id);
  if (!lock || lock.owner !== ownerId) {
    return c.json({
      error: 'You must acquire lock first',
      hint: 'POST /resources/:id/lock'
    }, 423);
  }
  
  const resource = resources.get(id);
  if (!resource) {
    return c.json({ error: 'Resource not found' }, 404);
  }
  
  // Update resource
  resources.set(id, { ...resource, value: body.value });
  
  // Release lock
  resourceLock.release(id, ownerId);
  
  return c.json({
    success: true,
    resource: resources.get(id),
    message: 'Resource updated and lock released'
  });
});

app.post('/resources/:id/unlock', (c) => {
  const id = c.req.param('id');
  const ownerId = c.req.header('X-Owner-ID');
  
  if (!ownerId) {
    return c.json({ error: 'X-Owner-ID header required' }, 400);
  }
  
  const released = resourceLock.release(id, ownerId);
  
  if (!released) {
    return c.json({ error: 'Lock not held or already released' }, 400);
  }
  
  return c.json({ success: true, message: 'Lock released' });
});

// ============================================================================
// Demonstration Endpoints
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Concurrency Control Examples',
    endpoints: {
      'Race Condition (Unsafe)': {
        increment: 'POST /counter/increment',
        get: 'GET /counter',
        reset: 'POST /counter/reset'
      },
      'Mutex Lock (Safe)': {
        increment: 'POST /counter-safe/increment',
        get: 'GET /counter-safe',
        reset: 'POST /counter-safe/reset'
      },
      'Optimistic Locking': {
        get: 'GET /accounts/:id',
        transfer: 'PUT /accounts/:id/transfer (with version)'
      },
      'Pessimistic Locking': {
        lock: 'POST /resources/:id/lock',
        update: 'PUT /resources/:id (requires lock)',
        unlock: 'POST /resources/:id/unlock'
      }
    },
    tips: {
      testRaceCondition: 'Run multiple increments simultaneously to see race condition',
      optimisticLocking: 'Try updating account with old version number',
      pessimisticLocking: 'Acquire lock before updating resource'
    }
  });
});

console.log('🔒 Concurrency Control server running on http://localhost:3000');
console.log('\nTest race condition:');
console.log('  curl -X POST http://localhost:3000/counter/increment & curl -X POST http://localhost:3000/counter/increment &');
console.log('\nTest safe increment:');
console.log('  curl -X POST http://localhost:3000/counter-safe/increment');
console.log('\nTest optimistic locking:');
console.log('  curl -X PUT http://localhost:3000/accounts/1/transfer -H "Content-Type: application/json" -d \'{"amount":100,"version":1}\'');

export default app;
