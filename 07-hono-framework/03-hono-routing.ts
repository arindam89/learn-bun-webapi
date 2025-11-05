/**
 * Module 7: Hono Framework - Advanced Routing
 * 
 * Explore Hono's powerful routing capabilities including grouping,
 * nesting, and route organization patterns.
 * 
 * Key Concepts:
 * - Route grouping with Hono.route()
 * - Nested routers
 * - Base path routing
 * - Route chaining
 * - RESTful resource routing
 * - Route organization patterns
 * 
 * Advantages vs Vanilla Bun:
 * - Automatic route matching
 * - No manual regex patterns
 * - Clean route organization
 * - Type-safe parameters
 * - Middleware per route group
 * 
 * Run: bun run 07-hono-framework/03-hono-routing.ts
 * Test:
 *   curl http://localhost:3000/api/v1/users
 *   curl http://localhost:3000/api/v1/users/123
 *   curl -X POST http://localhost:3000/api/v1/users -H "Content-Type: application/json" -d '{"name":"Alice"}'
 *   curl http://localhost:3000/api/v2/users
 *   curl http://localhost:3000/admin/dashboard
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';

// ============================================================================
// Main Application
// ============================================================================

const app = new Hono();

app.use('*', logger());

// ============================================================================
// User Router (v1 API)
// ============================================================================

const usersV1 = new Hono();

// In-memory user store
const users = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
]);

usersV1.get('/', (c) => {
  return c.json({
    users: Array.from(users.values()),
    total: users.size
  });
});

usersV1.get('/:id', (c) => {
  const id = c.req.param('id');
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

usersV1.post('/', async (c) => {
  const body = await c.req.json();
  const id = (users.size + 1).toString();
  
  const newUser = {
    id,
    name: body.name,
    email: body.email,
    createdAt: new Date().toISOString()
  };
  
  users.set(id, newUser);
  
  return c.json(newUser, 201);
});

usersV1.put('/:id', async (c) => {
  const id = c.req.param('id');
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const body = await c.req.json();
  const updated = { ...user, ...body, id }; // Preserve ID
  users.set(id, updated);
  
  return c.json(updated);
});

usersV1.delete('/:id', (c) => {
  const id = c.req.param('id');
  
  if (!users.has(id)) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  users.delete(id);
  return c.json({ message: 'User deleted' });
});

// ============================================================================
// Posts Router (v1 API)
// ============================================================================

const postsV1 = new Hono();

const posts = new Map([
  ['1', { id: '1', userId: '1', title: 'First Post', content: 'Hello World' }],
  ['2', { id: '2', userId: '1', title: 'Second Post', content: 'Learning Hono' }],
]);

postsV1.get('/', (c) => {
  const userId = c.req.query('userId');
  let filteredPosts = Array.from(posts.values());
  
  if (userId) {
    filteredPosts = filteredPosts.filter(p => p.userId === userId);
  }
  
  return c.json({ posts: filteredPosts, total: filteredPosts.length });
});

postsV1.get('/:id', (c) => {
  const id = c.req.param('id');
  const post = posts.get(id);
  
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  
  return c.json(post);
});

postsV1.post('/', async (c) => {
  const body = await c.req.json();
  const id = (posts.size + 1).toString();
  
  const newPost = {
    id,
    userId: body.userId,
    title: body.title,
    content: body.content,
    createdAt: new Date().toISOString()
  };
  
  posts.set(id, newPost);
  return c.json(newPost, 201);
});

// ============================================================================
// V1 API Router (combines all v1 routes)
// ============================================================================

const apiV1 = new Hono();

apiV1.route('/users', usersV1);
apiV1.route('/posts', postsV1);

apiV1.get('/', (c) => {
  return c.json({
    version: 'v1',
    endpoints: [
      '/api/v1/users',
      '/api/v1/posts'
    ]
  });
});

// ============================================================================
// V2 API Router (example of API versioning)
// ============================================================================

const apiV2 = new Hono();

apiV2.get('/users', (c) => {
  // V2 returns additional metadata
  return c.json({
    version: 'v2',
    users: Array.from(users.values()).map(u => ({
      ...u,
      profileUrl: `/api/v2/users/${u.id}/profile`
    })),
    pagination: {
      page: 1,
      perPage: 10,
      total: users.size
    }
  });
});

apiV2.get('/users/:id/profile', (c) => {
  const id = c.req.param('id');
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    ...user,
    stats: {
      posts: Array.from(posts.values()).filter(p => p.userId === id).length,
      joinedAt: '2024-01-01T00:00:00Z'
    }
  });
});

// ============================================================================
// Admin Router
// ============================================================================

const admin = new Hono();

// Simple admin auth middleware
admin.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || authHeader !== 'Bearer admin-token') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});

admin.get('/dashboard', (c) => {
  return c.json({
    stats: {
      totalUsers: users.size,
      totalPosts: posts.size,
      timestamp: new Date().toISOString()
    }
  });
});

admin.get('/users', (c) => {
  return c.json({
    users: Array.from(users.values()),
    metadata: {
      source: 'admin-panel',
      exportedAt: new Date().toISOString()
    }
  });
});

admin.post('/users/:id/ban', async (c) => {
  const id = c.req.param('id');
  const user = users.get(id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    message: `User ${user.name} has been banned`,
    userId: id
  });
});

// ============================================================================
// Public Routes
// ============================================================================

const publicRoutes = new Hono();

publicRoutes.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

publicRoutes.get('/version', (c) => {
  return c.json({
    name: 'Hono Routing Example',
    version: '1.0.0',
    availableVersions: ['v1', 'v2']
  });
});

// ============================================================================
// Mount All Routers
// ============================================================================

// Mount API versions
app.route('/api/v1', apiV1);
app.route('/api/v2', apiV2);

// Mount admin routes
app.route('/admin', admin);

// Mount public routes at root
app.route('/', publicRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Hono Advanced Routing Example',
    documentation: {
      'API v1': '/api/v1',
      'API v2': '/api/v2',
      'Admin': '/admin (requires auth)',
      'Health': '/health',
      'Version': '/version'
    }
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
    availableRoutes: [
      '/api/v1',
      '/api/v2',
      '/admin',
      '/health',
      '/version'
    ]
  }, 404);
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

console.log('🔥 Hono Advanced Routing server running on http://localhost:3000');
console.log('\nAPI v1 Routes:');
console.log('  GET  /api/v1/users');
console.log('  GET  /api/v1/users/:id');
console.log('  POST /api/v1/users');
console.log('  PUT  /api/v1/users/:id');
console.log('  DELETE /api/v1/users/:id');
console.log('  GET  /api/v1/posts');
console.log('  GET  /api/v1/posts/:id');
console.log('  POST /api/v1/posts');
console.log('\nAPI v2 Routes:');
console.log('  GET  /api/v2/users');
console.log('  GET  /api/v2/users/:id/profile');
console.log('\nAdmin Routes (require auth):');
console.log('  GET  /admin/dashboard');
console.log('  GET  /admin/users');
console.log('  POST /admin/users/:id/ban');
console.log('\nPublic Routes:');
console.log('  GET  /health');
console.log('  GET  /version');
console.log('\nAdmin Token: Bearer admin-token');

export default app;
