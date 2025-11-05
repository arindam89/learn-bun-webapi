/**
 * Module 8: Concurrency & Reliability - Idempotency
 * 
 * Build idempotent APIs that safely handle duplicate requests.
 * Critical for reliable distributed systems.
 * 
 * Key Concepts:
 * - Idempotency keys
 * - Duplicate request detection
 * - Safe retries
 * - Idempotent vs non-idempotent operations
 * - Request deduplication
 * 
 * HTTP Methods Idempotency:
 * - GET, PUT, DELETE: Naturally idempotent
 * - POST: NOT idempotent (need idempotency keys)
 * - PATCH: Depends on implementation
 * 
 * Run: bun run 08-concurrency-reliability/02-idempotency.ts
 * Test:
 *   # Non-idempotent (creates duplicate charges)
 *   curl -X POST http://localhost:3000/charges -H "Content-Type: application/json" -d '{"amount":100,"customerId":"cust1"}'
 *   curl -X POST http://localhost:3000/charges -H "Content-Type: application/json" -d '{"amount":100,"customerId":"cust1"}'
 *   
 *   # Idempotent (same key = same result)
 *   curl -X POST http://localhost:3000/charges-safe -H "Content-Type: application/json" -H "Idempotency-Key: key123" -d '{"amount":100,"customerId":"cust1"}'
 *   curl -X POST http://localhost:3000/charges-safe -H "Content-Type: application/json" -H "Idempotency-Key: key123" -d '{"amount":100,"customerId":"cust1"}'
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Problem: Non-Idempotent Payment Processing
// ============================================================================

interface Charge {
  id: string;
  amount: number;
  customerId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

const charges: Charge[] = [];

app.post('/charges', async (c) => {
  const body = await c.req.json();
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const charge: Charge = {
    id: crypto.randomUUID(),
    amount: body.amount,
    customerId: body.customerId,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  charges.push(charge);
  
  return c.json({
    charge,
    warning: 'NOT IDEMPOTENT - Duplicate requests create duplicate charges!'
  }, 201);
});

app.get('/charges', (c) => {
  return c.json({
    charges,
    total: charges.length,
    totalAmount: charges.reduce((sum, ch) => sum + ch.amount, 0)
  });
});

// ============================================================================
// Solution 1: Idempotency Keys with Request Cache
// ============================================================================

interface IdempotentRequest {
  key: string;
  response: any;
  statusCode: number;
  createdAt: number;
  expiresAt: number;
}

class IdempotencyCache {
  private cache = new Map<string, IdempotentRequest>();
  private ttl = 24 * 60 * 60 * 1000; // 24 hours
  
  get(key: string): IdempotentRequest | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item;
  }
  
  set(key: string, response: any, statusCode: number): void {
    this.cache.set(key, {
      key,
      response,
      statusCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

const idempotencyCache = new IdempotencyCache();
const safeCharges: Charge[] = [];

app.post('/charges-safe', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  
  if (!idempotencyKey) {
    return c.json({
      error: 'Idempotency-Key header required',
      hint: 'Add header: Idempotency-Key: your-unique-key'
    }, 400);
  }
  
  // Check if we've seen this request before
  const cached = idempotencyCache.get(idempotencyKey);
  
  if (cached) {
    console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
    return c.json(
      {
        ...cached.response,
        fromCache: true,
        note: 'This is a cached response from previous request'
      },
      cached.statusCode
    );
  }
  
  // Process new request
  const body = await c.req.json();
  
  console.log(`[Idempotency] Processing new request with key: ${idempotencyKey}`);
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const charge: Charge = {
    id: crypto.randomUUID(),
    amount: body.amount,
    customerId: body.customerId,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  safeCharges.push(charge);
  
  const response = {
    charge,
    message: 'Charge created successfully',
    idempotencyKey
  };
  
  // Cache the response
  idempotencyCache.set(idempotencyKey, response, 201);
  
  return c.json(response, 201);
});

app.get('/charges-safe', (c) => {
  return c.json({
    charges: safeCharges,
    total: safeCharges.length,
    totalAmount: safeCharges.reduce((sum, ch) => sum + ch.amount, 0),
    cacheSize: idempotencyCache.size()
  });
});

// ============================================================================
// Solution 2: Idempotent Updates with Content Hash
// ============================================================================

interface Order {
  id: string;
  items: string[];
  total: number;
  status: string;
  contentHash: string;
  updatedAt: string;
  version: number;
}

const orders = new Map<string, Order>([
  ['order1', {
    id: 'order1',
    items: ['item1'],
    total: 100,
    status: 'pending',
    contentHash: '',
    updatedAt: new Date().toISOString(),
    version: 1
  }]
]);

function hashContent(data: any): string {
  return Bun.hash(JSON.stringify(data)).toString(16);
}

app.put('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const order = orders.get(id);
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  // Calculate content hash
  const contentHash = hashContent(body);
  
  // Check if this exact update was already applied
  if (order.contentHash === contentHash) {
    return c.json({
      order,
      message: 'Update already applied (idempotent)',
      duplicate: true
    });
  }
  
  // Apply update
  const updated: Order = {
    ...order,
    ...body,
    id, // Preserve ID
    contentHash,
    updatedAt: new Date().toISOString(),
    version: order.version + 1
  };
  
  orders.set(id, updated);
  
  return c.json({
    order: updated,
    message: 'Order updated successfully',
    duplicate: false
  });
});

app.get('/orders/:id', (c) => {
  const id = c.req.param('id');
  const order = orders.get(id);
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  return c.json(order);
});

// ============================================================================
// Solution 3: Naturally Idempotent Operations
// ============================================================================

const users = new Map([
  ['user1', { id: 'user1', email: 'user1@example.com', active: true }]
]);

// PUT is naturally idempotent - replace entire resource
app.put('/users/:id/email', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Setting to same value multiple times = same result
  user.email = body.email;
  users.set(id, user);
  
  return c.json({
    user,
    message: 'Email updated (idempotent PUT)'
  });
});

// DELETE is naturally idempotent - deleting already deleted = same state
app.delete('/users/:id', (c) => {
  const id = c.req.param('id');
  
  const existed = users.has(id);
  users.delete(id);
  
  return c.json({
    message: existed ? 'User deleted' : 'User already deleted',
    idempotent: true
  });
});

// ============================================================================
// Testing & Cleanup
// ============================================================================

app.post('/reset', (c) => {
  charges.length = 0;
  safeCharges.length = 0;
  idempotencyCache.clear();
  
  return c.json({ message: 'All data reset' });
});

app.get('/', (c) => {
  return c.json({
    message: 'Idempotency Examples',
    endpoints: {
      'Non-Idempotent (Problem)': {
        create: 'POST /charges',
        list: 'GET /charges'
      },
      'Idempotent with Keys (Solution)': {
        create: 'POST /charges-safe (with Idempotency-Key header)',
        list: 'GET /charges-safe'
      },
      'Content Hash Idempotency': {
        update: 'PUT /orders/:id',
        get: 'GET /orders/:id'
      },
      'Naturally Idempotent': {
        updateEmail: 'PUT /users/:id/email',
        delete: 'DELETE /users/:id'
      }
    },
    concepts: {
      idempotencyKey: 'Client-generated unique key for request deduplication',
      contentHash: 'Server-side hash to detect duplicate updates',
      naturalIdempotency: 'Operations that are inherently safe to repeat (PUT, DELETE)',
      caching: 'Store and return previous response for duplicate requests'
    },
    bestPractices: [
      'Always require idempotency keys for POST operations',
      'Cache responses for 24 hours minimum',
      'Use UUIDs or timestamps for idempotency keys',
      'Return same response (including status code) for duplicates',
      'Document which endpoints require idempotency keys'
    ]
  });
});

console.log('🔁 Idempotency server running on http://localhost:3000');
console.log('\nTest non-idempotent (creates duplicates):');
console.log('  curl -X POST http://localhost:3000/charges -H "Content-Type: application/json" -d \'{"amount":100,"customerId":"cust1"}\'');
console.log('  curl -X POST http://localhost:3000/charges -H "Content-Type: application/json" -d \'{"amount":100,"customerId":"cust1"}\'');
console.log('\nTest idempotent (prevents duplicates):');
console.log('  curl -X POST http://localhost:3000/charges-safe -H "Content-Type: application/json" -H "Idempotency-Key: key123" -d \'{"amount":100,"customerId":"cust1"}\'');
console.log('  curl -X POST http://localhost:3000/charges-safe -H "Content-Type: application/json" -H "Idempotency-Key: key123" -d \'{"amount":100,"customerId":"cust1"}\'');

export default app;
