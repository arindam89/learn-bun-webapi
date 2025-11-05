/**
 * Module 7: Hono Framework - Basics
 * 
 * Introduction to Hono, a fast, lightweight web framework for Bun, Cloudflare Workers, and more.
 * Compare the simplicity of Hono with vanilla Bun HTTP servers.
 * 
 * Key Concepts:
 * - Hono framework installation and setup
 * - Basic routing with Hono
 * - Request/Response handling
 * - Path parameters
 * - Query parameters
 * - JSON responses
 * 
 * Why Hono?
 * - Ultra-lightweight (~14KB)
 * - Express-like API but faster
 * - TypeScript support out of the box
 * - Middleware ecosystem
 * - Cross-runtime (Bun, Deno, Node, Cloudflare Workers)
 * 
 * Run: bun run 07-hono-framework/01-hono-basics.ts
 * Test: 
 *   curl http://localhost:3000
 *   curl http://localhost:3000/hello/John
 *   curl http://localhost:3000/greet?name=Alice
 *   curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@example.com"}'
 */

import { Hono } from 'hono';

// Create a new Hono app
const app = new Hono();

// Simple root route
app.get('/', (c) => {
  return c.text('Hello from Hono! 🔥');
});

// Route with path parameter
app.get('/hello/:name', (c) => {
  const name = c.req.param('name');
  return c.text(`Hello, ${name}!`);
});

// Route with query parameter
app.get('/greet', (c) => {
  const name = c.req.query('name') || 'Guest';
  const age = c.req.query('age');
  
  if (age) {
    return c.text(`Hello, ${name}! You are ${age} years old.`);
  }
  
  return c.text(`Hello, ${name}!`);
});

// JSON response
app.get('/api/info', (c) => {
  return c.json({
    framework: 'Hono',
    version: '1.0.0',
    runtime: 'Bun',
    timestamp: new Date().toISOString()
  });
});

// POST route with JSON body
app.post('/api/users', async (c) => {
  const body = await c.req.json();
  
  return c.json({
    success: true,
    message: 'User created',
    user: {
      id: Math.random().toString(36).substring(7),
      ...body,
      createdAt: new Date().toISOString()
    }
  }, 201);
});

// Multiple HTTP methods on same route
app.get('/api/items', (c) => {
  return c.json({ method: 'GET', items: [] });
});

app.post('/api/items', async (c) => {
  const body = await c.req.json();
  return c.json({ method: 'POST', item: body }, 201);
});

// Route with multiple path parameters
app.get('/users/:userId/posts/:postId', (c) => {
  const userId = c.req.param('userId');
  const postId = c.req.param('postId');
  
  return c.json({
    userId,
    postId,
    message: `Getting post ${postId} for user ${userId}`
  });
});

// Wildcard route
app.get('/files/*', (c) => {
  const path = c.req.param('*');
  return c.text(`File path: ${path}`);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

console.log('🔥 Hono server starting on http://localhost:3000');
console.log('\nAvailable routes:');
console.log('  GET  /');
console.log('  GET  /hello/:name');
console.log('  GET  /greet?name=...');
console.log('  GET  /api/info');
console.log('  POST /api/users');
console.log('  GET  /api/items');
console.log('  POST /api/items');
console.log('  GET  /users/:userId/posts/:postId');
console.log('  GET  /files/*');

export default app;
