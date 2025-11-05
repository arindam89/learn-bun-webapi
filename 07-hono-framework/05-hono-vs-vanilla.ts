/**
 * Module 7: Hono Framework - Comparison with Vanilla Bun
 * 
 * Side-by-side comparison of implementing the same API
 * with vanilla Bun vs Hono framework.
 * 
 * Key Differences:
 * - Routing complexity
 * - Middleware implementation
 * - Error handling
 * - Code organization
 * - Type safety
 * - Developer experience
 * 
 * This file demonstrates BOTH implementations for comparison.
 * 
 * Run Hono version: bun run 07-hono-framework/05-hono-vs-vanilla.ts
 * Test:
 *   curl http://localhost:3000/hono/users
 *   curl http://localhost:3000/vanilla/users
 *   curl -X POST http://localhost:3000/hono/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com"}'
 *   curl -X POST http://localhost:3000/vanilla/users -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@example.com"}'
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';

// ============================================================================
// Shared Data Store
// ============================================================================

const users = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
]);

// ============================================================================
// HONO IMPLEMENTATION
// ============================================================================

const honoApp = new Hono();

// Middleware - simple and declarative
honoApp.use('*', logger());

honoApp.use('*', async (c, next) => {
  c.header('X-Powered-By', 'Hono');
  await next();
});

// Routes - clean and readable
honoApp.get('/users', (c) => {
  return c.json({
    users: Array.from(users.values()),
    total: users.size
  });
});

honoApp.get('/users/:id', (c) => {
  const id = c.req.param('id');
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

honoApp.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.email) {
      return c.json({
        error: 'Validation failed',
        message: 'Name and email are required'
      }, 400);
    }
    
    const id = (users.size + 1).toString();
    const newUser = { id, name: body.name, email: body.email };
    users.set(id, newUser);
    
    return c.json(newUser, 201);
  } catch (err) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }
});

honoApp.delete('/users/:id', (c) => {
  const id = c.req.param('id');
  
  if (!users.has(id)) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  users.delete(id);
  return c.json({ message: 'User deleted' });
});

// Error handling - built-in
honoApp.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

honoApp.onError((err, c) => {
  console.error('Hono Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// ============================================================================
// VANILLA BUN IMPLEMENTATION
// ============================================================================

async function vanillaHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  
  // Manual logging middleware
  console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  
  // Common headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Powered-By': 'Vanilla Bun'
  };
  
  try {
    // Manual routing with regex patterns
    
    // GET /users
    if (method === 'GET' && path === '/users') {
      return new Response(
        JSON.stringify({
          users: Array.from(users.values()),
          total: users.size
        }),
        { status: 200, headers }
      );
    }
    
    // GET /users/:id
    const getUserMatch = path.match(/^\/users\/([^\/]+)$/);
    if (method === 'GET' && getUserMatch) {
      const id = getUserMatch[1];
      const user = users.get(id);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers }
        );
      }
      
      return new Response(
        JSON.stringify(user),
        { status: 200, headers }
      );
    }
    
    // POST /users
    if (method === 'POST' && path === '/users') {
      let body;
      
      try {
        const text = await req.text();
        body = JSON.parse(text);
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON' }),
          { status: 400, headers }
        );
      }
      
      if (!body.name || !body.email) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Name and email are required'
          }),
          { status: 400, headers }
        );
      }
      
      const id = (users.size + 1).toString();
      const newUser = { id, name: body.name, email: body.email };
      users.set(id, newUser);
      
      return new Response(
        JSON.stringify(newUser),
        { status: 201, headers }
      );
    }
    
    // DELETE /users/:id
    const deleteUserMatch = path.match(/^\/users\/([^\/]+)$/);
    if (method === 'DELETE' && deleteUserMatch) {
      const id = deleteUserMatch[1];
      
      if (!users.has(id)) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers }
        );
      }
      
      users.delete(id);
      return new Response(
        JSON.stringify({ message: 'User deleted' }),
        { status: 200, headers }
      );
    }
    
    // 404 Not Found
    return new Response(
      JSON.stringify({ error: 'Not Found', path }),
      { status: 404, headers }
    );
    
  } catch (err) {
    // Error handling
    console.error('Vanilla Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers }
    );
  }
}

// ============================================================================
// COMBINED APP (for comparison)
// ============================================================================

const app = new Hono();

// Mount Hono routes under /hono
app.route('/hono', honoApp);

// Mount vanilla handler under /vanilla
app.all('/vanilla/*', async (c) => {
  // Strip /vanilla prefix and forward to vanilla handler
  const originalUrl = new URL(c.req.url);
  const newPath = c.req.path.replace('/vanilla', '');
  const newUrl = new URL(newPath, originalUrl.origin);
  
  const req = new Request(newUrl.toString(), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  
  return await vanillaHandler(req);
});

// Comparison endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Hono vs Vanilla Bun Comparison',
    endpoints: {
      hono: {
        users: '/hono/users',
        user: '/hono/users/:id',
        create: 'POST /hono/users',
        delete: 'DELETE /hono/users/:id'
      },
      vanilla: {
        users: '/vanilla/users',
        user: '/vanilla/users/:id',
        create: 'POST /vanilla/users',
        delete: 'DELETE /vanilla/users/:id'
      }
    },
    comparison: {
      honoAdvantages: [
        'Cleaner routing syntax',
        'Built-in middleware system',
        'Automatic parameter extraction',
        'Type-safe context',
        'Less boilerplate code',
        'Better error handling',
        'Composable routers',
        'Active ecosystem'
      ],
      vanillaAdvantages: [
        'No dependencies',
        'Full control',
        'Slightly smaller bundle',
        'Direct access to Request/Response',
        'Learning experience'
      ],
      linesOfCode: {
        hono: '~50 lines',
        vanilla: '~120 lines'
      },
      complexity: {
        hono: 'Low - declarative and clean',
        vanilla: 'Medium - manual routing and error handling'
      }
    }
  });
});

console.log('🔥 Hono vs Vanilla Bun comparison running on http://localhost:3000');
console.log('\n📊 Comparison:');
console.log('\nHono Routes (cleaner syntax):');
console.log('  GET    /hono/users');
console.log('  GET    /hono/users/:id');
console.log('  POST   /hono/users');
console.log('  DELETE /hono/users/:id');
console.log('\nVanilla Bun Routes (manual routing):');
console.log('  GET    /vanilla/users');
console.log('  GET    /vanilla/users/:id');
console.log('  POST   /vanilla/users');
console.log('  DELETE /vanilla/users/:id');
console.log('\n💡 Key Differences:');
console.log('  - Hono: ~50 lines of clean, declarative code');
console.log('  - Vanilla: ~120 lines with manual routing/parsing');
console.log('  - Hono: Built-in middleware, error handling, validation');
console.log('  - Vanilla: Everything manual, more control but more code');
console.log('\nVisit http://localhost:3000 for detailed comparison');

export default app;
