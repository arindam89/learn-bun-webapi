# Learn Bun the Hard Way - Complete Reference Guide

> *A comprehensive guide to mastering Bun - the all-in-one JavaScript runtime, bundler, test runner, and package manager.*

---

## 📚 Table of Contents

1. [Introduction to Bun](#introduction-to-bun)
2. [Module 1: Bun Fundamentals](#module-1-bun-fundamentals)
3. [Module 2: REST API Development](#module-2-rest-api-development)
4. [Module 3: Data & Middleware](#module-3-data--middleware)
5. [Module 4: Real-World Applications](#module-4-real-world-applications)
6. [Module 5: Advanced Patterns](#module-5-advanced-patterns)
7. [Module 6: Production Deployment](#module-6-production-deployment)
8. [Module 7: Hono Framework](#module-7-hono-framework)
9. [Module 8: Concurrency & Reliability](#module-8-concurrency--reliability)
10. [Module 9: Security](#module-9-security)
11. [Module 10: Bun v1.3 Features](#module-10-bun-v13-features)
12. [Module 11: Full-Stack Application](#module-11-fullstack-application)
13. [Best Practices & Patterns](#best-practices--patterns)
14. [Advanced Tips & Tricks](#advanced-tips--tricks)
15. [Troubleshooting Guide](#troubleshooting-guide)

---

## Introduction to Bun

### What is Bun?

Bun is a **complete all-in-one toolkit** for JavaScript and TypeScript applications. It's designed to be a **drop-in replacement** for Node.js, while providing massive performance improvements and developer experience enhancements.

### Core Capabilities

| Feature | Description | Performance |
|---------|-------------|-------------|
| **JavaScript Runtime** | Fast JavaScript/TypeScript execution | 2-3x faster than Node.js |
| **Native Package Manager** | Install packages without npm | 20-100x faster than npm |
| **Built-in Test Runner** | Jest-compatible testing | 10x faster than Jest |
| **Bundling & Transpilation** | Zero-config bundling | 10-20x faster than Webpack |
| **SQLite & Redis Integration** | Native database support | Up to 4x faster than external libraries |
| **Web Server** | Fast HTTP server | 2.5x faster than Express |

### Why Choose Bun?

1. **Performance**: Native performance across all operations
2. **Simplicity**: One tool for everything - no complex configurations
3. **Compatibility**: Drop-in Node.js replacement
4. **Modern**: Built for modern JavaScript/TypeScript
5. **All-in-One**: Runtime, bundler, tester, package manager in one

---

## Module 1: Bun Fundamentals

### Basic HTTP Server

```typescript
// Basic server with Bun.serve()
import { serve } from 'bun';

const server = serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello from Bun!');
  },
});

console.log(`Server running on http://localhost:${server.port}`);
```

### Request Handling

```typescript
import { serve } from 'bun';

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    // Route handling
    if (url.pathname === '/api/users' && req.method === 'GET') {
      return Response.json({ users: [] });
    }

    // Query parameters
    const name = url.searchParams.get('name') || 'World';

    // POST request handling
    if (req.method === 'POST') {
      const body = await req.json();
      return Response.json({ received: body });
    }

    return new Response(`Hello, ${name}!`);
  },
});
```

### File Operations

```typescript
import { BunFile } from 'bun';

// Read files
const file = Bun.file('./data.json');
const content = await file.text();
const json = await file.json();

// Write files
await Bun.write('./output.txt', 'Hello, Bun!');

// File information
console.log(file.size);      // File size in bytes
console.log(file.type);      // MIME type
console.log(file.lastModified); // Last modified timestamp
```

### Environment Variables

```typescript
// Access environment variables
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

// Set environment variables
process.env.NODE_ENV = 'production';
```

### CLI Operations

```bash
# Run TypeScript files directly
bun run server.ts

# Install packages
bun install express
bun install --dev typescript

# Run scripts
bun run dev

# Execute code
bun -e "console.log('Hello, Bun!')"

# Package management
bun add lodash
bun add react --dev
bun remove lodash
bun update
```

---

## Module 2: REST API Development

### RESTful API Structure

```typescript
import { serve } from 'bun';

interface User {
  id: number;
  name: string;
  email: string;
}

let users: User[] = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
];

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // GET /api/users - List all users
    if (path === '/api/users' && method === 'GET') {
      return Response.json(users);
    }

    // GET /api/users/:id - Get specific user
    const userMatch = path.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && method === 'GET') {
      const id = parseInt(userMatch[1]);
      const user = users.find(u => u.id === id);

      if (!user) {
        return new Response('User not found', { status: 404 });
      }

      return Response.json(user);
    }

    // POST /api/users - Create user
    if (path === '/api/users' && method === 'POST') {
      try {
        const body = await req.json();
        const newUser: User = {
          id: Math.max(...users.map(u => u.id)) + 1,
          name: body.name,
          email: body.email
        };

        users.push(newUser);
        return Response.json(newUser, { status: 201 });
      } catch (error) {
        return new Response('Invalid JSON', { status: 400 });
      }
    }

    // PUT /api/users/:id - Update user
    const updateMatch = path.match(/^\/api\/users\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const id = parseInt(updateMatch[1]);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return new Response('User not found', { status: 404 });
      }

      try {
        const body = await req.json();
        users[userIndex] = { ...users[userIndex], ...body };
        return Response.json(users[userIndex]);
      } catch (error) {
        return new Response('Invalid JSON', { status: 400 });
      }
    }

    // DELETE /api/users/:id - Delete user
    const deleteMatch = path.match(/^\/api\/users\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = parseInt(deleteMatch[1]);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return new Response('User not found', { status: 404 });
      }

      users.splice(userIndex, 1);
      return new Response('User deleted', { status: 204 });
    }

    return new Response('Not Found', { status: 404 });
  },
});
```

### Query Parameters and Filtering

```typescript
// GET /api/users?page=1&limit=10&search=john
if (path === '/api/users' && method === 'GET') {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search')?.toLowerCase();

  let filteredUsers = users;

  // Search filter
  if (search) {
    filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return Response.json({
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    }
  });
}
```

### Error Handling

```typescript
class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error handling middleware
function handleRequest(req: Request): Response {
  try {
    // Your route handling logic here
    throw new APIError('User not found', 404, 'NOT_FOUND');
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json({
        error: error.message,
        code: error.code
      }, { status: error.status });
    }

    // Log unexpected errors
    console.error('Unexpected error:', error);

    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### CORS Support

```typescript
function addCORS(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle preflight requests
if (req.method === 'OPTIONS') {
  return addCORS(new Response(null, { status: 200 }));
}
```

---

## Module 3: Data & Middleware

### Middleware Pattern

```typescript
import type { Server } from 'bun';

type Middleware = (req: Request, next: () => Promise<Response>) => Promise<Response>;

class Router {
  private middleware: Middleware[] = [];

  use(middleware: Middleware) {
    this.middleware.push(middleware);
  }

  async handle(req: Request): Promise<Response> {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index >= this.middleware.length) {
        return new Response('Not Found', { status: 404 });
      }

      const middleware = this.middleware[index++];
      return middleware(req, next);
    };

    return next();
  }
}
```

### Logging Middleware

```typescript
const loggingMiddleware: Middleware = async (req, next) => {
  const start = Date.now();
  const method = req.method;
  const url = new URL(req.url);

  console.log(`[${new Date().toISOString()}] ${method} ${url.pathname}`);

  const response = await next();

  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${method} ${url.pathname} - ${response.status} (${duration}ms)`);

  return response;
};
```

### JSON Validation Middleware

```typescript
interface ValidationError {
  field: string;
  message: string;
}

const validateJSON = (schema: Record<string, (value: any) => boolean>): Middleware => {
  return async (req, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const body = await req.json();
        const errors: ValidationError[] = [];

        for (const [field, validator] of Object.entries(schema)) {
          if (!validator(body[field])) {
            errors.push({
              field,
              message: `Invalid ${field}`
            });
          }
        }

        if (errors.length > 0) {
          return Response.json({
            error: 'Validation failed',
            details: errors
          }, { status: 400 });
        }
      } catch (error) {
        return Response.json({
          error: 'Invalid JSON'
        }, { status: 400 });
      }
    }

    return next();
  };
};
```

### Rate Limiting Middleware

```typescript
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  middleware: Middleware = async (req, next) => {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const record = this.store[clientIP];

    if (!record || now > record.resetTime) {
      this.store[clientIP] = {
        count: 1,
        resetTime: now + this.windowMs
      };
    } else if (record.count >= this.maxRequests) {
      return Response.json({
        error: 'Too many requests'
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
        }
      });
    } else {
      record.count++;
    }

    return next();
  };
}
```

### Database Integration (SQLite)

```typescript
import { Database } from 'bun:sqlite';

class UserDB {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  create(name: string, email: string) {
    return this.db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
  }

  findAll() {
    return this.db.query('SELECT * FROM users ORDER BY created_at DESC').all();
  }

  findById(id: number) {
    return this.db.query('SELECT * FROM users WHERE id = ?').get(id);
  }

  update(id: number, data: Partial<{ name: string; email: string }>) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    return this.db.run(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  delete(id: number) {
    return this.db.run('DELETE FROM users WHERE id = ?', [id]);
  }
}
```

---

## Module 4: Real-World Applications

### E-commerce API Example

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  createdAt: string;
}

class ProductAPI {
  private products: Product[] = [];
  private nextId = 1;

  // Create product
  create(productData: Omit<Product, 'id' | 'createdAt'>) {
    const product: Product = {
      ...productData,
      id: this.nextId++,
      createdAt: new Date().toISOString()
    };

    this.products.push(product);
    return product;
  }

  // Get all products with filtering
  getAll(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  } = {}) {
    let filtered = this.products;

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  // Update stock
  updateStock(id: number, quantity: number) {
    const product = this.products.find(p => p.id === id);
    if (!product) return null;

    product.stock += quantity;
    return product;
  }
}
```

### Search API with Pagination

```typescript
interface SearchResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class SearchService<T> {
  search(
    items: T[],
    query: string,
    getSearchableText: (item: T) => string,
    page: number = 1,
    limit: number = 10
  ): SearchResult<T> {
    // Search filtering
    const queryLower = query.toLowerCase();
    const filtered = items.filter(item =>
      getSearchableText(item).toLowerCase().includes(queryLower)
    );

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
}
```

### File Upload Handler

```typescript
class FileUploadHandler {
  constructor(private uploadDir: string) {
    // Ensure upload directory exists
    import('fs/promises').then(fs =>
      fs.mkdir(uploadDir, { recursive: true })
    );
  }

  async uploadFile(req: Request): Promise<{ filename: string; path: string }> {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const filename = `${timestamp}_${random}_${file.name}`;
    const filePath = `${this.uploadDir}/${filename}`;

    // Save file
    await Bun.write(filePath, await file.arrayBuffer());

    return { filename, path: filePath };
  }
}
```

---

## Module 5: Advanced Patterns

### Dependency Injection

```typescript
interface ServiceContainer {
  [key: string]: any;
}

class DIContainer {
  private services: ServiceContainer = {};
  private factories: Map<string, () => any> = new Map();

  register<T>(name: string, factory: () => T) {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    if (!this.services[name]) {
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`Service ${name} not found`);
      }
      this.services[name] = factory();
    }
    return this.services[name];
  }
}

// Usage
const container = new DIContainer();
container.register('db', () => new Database('./app.db'));
container.register('userService', () => new UserService(container.get('db')));
```

### Event-Driven Architecture

```typescript
type EventHandler<T = any> = (data: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T>(event: string, handler: EventHandler<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<T>(event: string, handler: EventHandler<T>) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit<T>(event: string, data: T) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

### Plugin System

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(app: any): Promise<void>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  async load(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already loaded`);
    }

    await plugin.initialize(this);
    this.plugins.set(plugin.name, plugin);
  }

  unload(pluginName: string) {
    this.plugins.delete(pluginName);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}
```

### Caching Layer

```typescript
interface CacheItem<T> {
  value: T;
  expires: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
```

### Request Validation with Zod

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true)
  }).optional()
});

type User = z.infer<typeof UserSchema>;

// Validate incoming data
function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

---

## Module 6: Production Deployment

### Environment Configuration

```typescript
interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  corsOrigin: string;
  logLevel: string;
}

function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info'
  };
}
```

### Health Checks

```typescript
interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();

  addCheck(name: string, checkFn: () => Promise<HealthCheck>) {
    this.checks.set(name, checkFn);
  }

  async runChecks(): Promise<{ status: string; checks: HealthCheck[] }> {
    const results: HealthCheck[] = [];

    for (const [name, checkFn] of this.checks) {
      try {
        const start = Date.now();
        const result = await checkFn();
        result.responseTime = Date.now() - start;
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error.message
        });
      }
    }

    const allHealthy = results.every(check => check.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: results
    };
  }
}
```

### Structured Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

class Logger {
  constructor(private level: string = 'info') {}

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: string, message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as any,
      message,
      metadata
    };

    console.log(JSON.stringify(entry));
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
  }
}
```

### Graceful Shutdown

```typescript
class GracefulShutdown {
  private shutdownHandlers: (() => Promise<void>)[] = [];

  addHandler(handler: () => Promise<void>) {
    this.shutdownHandlers.push(handler);
  }

  async shutdown(signal: string) {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await Promise.all(this.shutdownHandlers.map(handler => handler()));
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  setup() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }
}
```

---

## Module 7: Hono Framework

### Basic Hono Application

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.get('/', (c) => c.text('Hello from Hono!'));

app.get('/api/users', (c) => {
  return c.json({ users: [] });
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  return c.json({ received: body }, 201);
});

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default {
  port: 3000,
  fetch: app.fetch
};
```

### Route Groups

```typescript
import { Hono } from 'hono';

const app = new Hono();

// API routes
const api = new Hono();

api.get('/users', (c) => c.json({ users: [] }));
api.post('/users', async (c) => {
  const body = await c.req.json();
  return c.json({ received: body }, 201);
});

api.get('/tasks', (c) => c.json({ tasks: [] }));
api.post('/tasks', async (c) => {
  const body = await c.req.json();
  return c.json({ received: body }, 201);
});

app.route('/api', api);

// Admin routes
const admin = new Hono();

admin.get('/stats', (c) => c.json({ stats: {} }));
admin.delete('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ message: `User ${id} deleted` });
});

app.route('/admin', admin);
```

### Validation Middleware

```typescript
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional()
});

app.post(
  '/users',
  zValidator('json', userSchema),
  async (c) => {
    const userData = c.req.valid('json');
    return c.json({ user: userData }, 201);
  }
);
```

### JWT Authentication

```typescript
import { jwt, sign } from 'hono/jwt';

const secret = 'your-secret-key';

// Authentication middleware
const auth = jwt({ secret });

// Protected routes
app.use('/api/protected/*', auth);

app.get('/api/protected/profile', auth, (c) => {
  const payload = c.get('jwtPayload');
  return c.json({ user: payload });
});

// Login route
app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json();

  // Validate credentials (simplified)
  if (username === 'admin' && password === 'password') {
    const token = await sign({ sub: username, role: 'admin' }, secret);
    return c.json({ token });
  }

  return c.json({ error: 'Invalid credentials' }, 401);
});
```

---

## Module 8: Concurrency & Reliability

### Mutex for Race Conditions

```typescript
class Mutex {
  private isLocked = false;
  private waitQueue: (() => void)[] = [];

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    } else {
      this.isLocked = false;
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
```

### Rate Limiting Implementation

```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private windowMs: number = 1000
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed >= this.windowMs) {
      const tokensToAdd = Math.floor(timePassed / this.windowMs * this.refillRate);
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  constructor(
    private capacity: number,
    private refillRate: number
  ) {}

  isAllowed(key: string, tokens: number = 1): boolean {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.capacity, this.refillRate));
    }

    return this.buckets.get(key)!.consume(tokens);
  }
}
```

### Circuit Breaker Pattern

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 10000 // 10 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
  }
}
```

### Retry Mechanism

```typescript
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

class RetryManager {
  static async execute<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...options
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === opts.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay(attempt, opts);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, options.maxDelay);

    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Module 9: Security

### Input Sanitization

```typescript
class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  static sanitizeSQL(input: string): string {
    return input
      .replace(/['"\\]/g, '') // Remove SQL escape characters
      .replace(/(--|\/\*|\*\/|;)/g, '') // Remove SQL comments and statement separators
      .trim();
  }

  static sanitizeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### CSRF Protection

```typescript
import { randomBytes, timingSafeEqual } from 'crypto';

class CSRFProtection {
  private tokens = new Map<string, { token: string; expires: number }>();

  generateToken(): string {
    const token = randomBytes(32).toString('hex');
    const sessionId = this.getSessionId();
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  validateToken(token: string): boolean {
    const sessionId = this.getSessionId();
    const storedToken = this.tokens.get(sessionId);

    if (!storedToken || Date.now() > storedToken.expires) {
      return false;
    }

    try {
      return timingSafeEqual(
        Buffer.from(token),
        Buffer.from(storedToken.token)
      );
    } catch {
      return false;
    }
  }

  private getSessionId(): string {
    // In a real app, this would come from session/cookie
    return 'session-id-placeholder';
  }
}
```

### Security Headers Middleware

```typescript
class SecurityHeaders {
  static addHeaders(response: Response): Response {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'"
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  }
}
```

### Password Hashing

```typescript
import { createHash, scrypt, randomBytes } from 'crypto';

class PasswordManager {
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 64;

  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(this.SALT_LENGTH);

    return new Promise((resolve, reject) => {
      scrypt(password, salt, this.KEY_LENGTH, (err, derivedKey) => {
        if (err) reject(err);
        else {
          const hash = salt.toString('hex') + ':' + derivedKey.toString('hex');
          resolve(hash);
        }
      });
    });
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [saltHex, hashHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');

    return new Promise((resolve, reject) => {
      scrypt(password, salt, this.KEY_LENGTH, (err, derivedKey) => {
        if (err) reject(err);
        else {
          const derivedKeyHex = derivedKey.toString('hex');
          resolve(derivedKeyHex === hashHex);
        }
      });
    });
  }

  static generateStrongPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }
}
```

---

## Module 10: Bun v1.3 Features

### Enhanced Routing (New in v1.3)

```typescript
import { serve } from 'bun';

// Before v1.3: Manual routing
serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/users/')) {
      const id = url.pathname.split('/')[2];
      return Response.json({ userId: id });
    }

    return new Response('Not found', { status: 404 });
  },
});

// After v1.3: Built-in routing with parameters
serve({
  port: 3000,
  routes: {
    // Parameter extraction
    '/users/:id': (request, params) => {
      const userId = params?.id;
      return Response.json({ userId });
    },

    // Multiple parameters
    '/users/:userId/posts/:postId': (request, params) => {
      const { userId, postId } = params || {};
      return Response.json({ userId, postId });
    },

    // HTTP method routing
    '/api/users': {
      GET: () => Response.json({ users: [] }),
      POST: async (request) => {
        const body = await request.json();
        return Response.json({ created: body }, { status: 201 });
      },
      PUT: async (request) => {
        const body = await request.json();
        return Response.json({ updated: body });
      }
    }
  }
});
```

### Unified SQL API

```typescript
import { Database } from 'bun:sql';

// Cross-database compatibility
const db = new Database('postgresql://user:pass@localhost/db');
// Also works with: mysql://..., sqlite:...

// Parameterized queries
const users = await db.all('SELECT * FROM users WHERE active = ?', [true]);
const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

// Transactions
await db.run('BEGIN TRANSACTION');
try {
  await db.run('INSERT INTO orders (user_id, total) VALUES (?, ?)', [userId, total]);
  await db.run('UPDATE users SET order_count = order_count + 1 WHERE id = ?', [userId]);
  await db.run('COMMIT');
} catch (error) {
  await db.run('ROLLBACK');
  throw error;
}
```

### Built-in Redis Client

```typescript
import { Redis } from 'bun:redis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // No external dependencies needed!
});

// Basic operations
await redis.set('user:123', JSON.stringify(userData));
const data = await redis.get('user:123');

// All Redis data structures
await redis.hset('product:456', { name: 'Product', price: 29.99 });
await redis.lpush('queue:notifications', 'new_order');
await redis.sadd('online:users', userId);
await redis.zadd('leaderboard', { score: 100, member: 'player1' });

// Pub/Sub
await redis.subscribe('notifications');
await redis.publish('notifications', JSON.stringify(notification));

// Pipelining for performance
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
const results = await pipeline.exec();
```

### Zero-Config Frontend Development

```typescript
// No webpack.config.js, vite.config.js, or rollup.config.js needed!

// Automatic TypeScript and JSX support
import React from 'react';

function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{/* JSX works out of the box */}</div>;
}

// Build with zero configuration
const buildResult = await Bun.build({
  entrypoints: ['./src/app.tsx'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  splitting: true, // Automatic code splitting
  sourcemap: true,
});

// Development with HMR
// bun --hot run src/app.tsx
```

### Package Catalogs

```json
{
  "catalog": {
    "versions": {
      "react": "^18.2.0",
      "typescript": "^5.2.0",
      "zod": "^3.22.0"
    },
    "overrides": {
      "development": {
        "react": "18.3.0-canary.0"
      },
      "production": {
        "react": "18.2.0"
      }
    }
  },
  "dependencies": {
    "react": "catalog:react",
    "typescript": "catalog:typescript",
    "zod": "catalog:zod"
  }
}
```

---

## Module 11: Full-Stack Application

### Complete Application Architecture

```typescript
// Backend with all Bun 1.3 features
import { serve, Database, Redis } from 'bun';
import { z } from 'zod';

class TaskFlowAPI {
  private db: Database;
  private redis: Redis;

  constructor() {
    this.db = new Database(process.env.DATABASE_URL);
    this.redis = new Redis({ url: process.env.REDIS_URL });
    this.initDatabase();
  }

  private initDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  createServer() {
    return serve({
      port: 3001,
      routes: {
        // Authentication with built-in routing
        '/api/auth/login': {
          POST: async (request) => {
            const { email, password } = await request.json();
            const user = await this.authenticateUser(email, password);
            const token = this.generateJWT(user);

            // Cache user session
            await this.redis.setex(`session:${token}`, 3600, JSON.stringify(user));

            return Response.json({ user, token });
          }
        },

        // Task management with validation
        '/api/tasks': {
          GET: async (request, params, user) => {
            const url = new URL(request.url);
            const cacheKey = `tasks:${url.search}`;

            // Try cache first
            const cached = await this.redis.get(cacheKey);
            if (cached) {
              return Response.json(JSON.parse(cached));
            }

            const tasks = await this.db.all('SELECT * FROM tasks WHERE user_id = ?', [user.id]);

            // Cache for 5 minutes
            await this.redis.setex(cacheKey, 300, JSON.stringify(tasks));

            return Response.json({ data: tasks });
          },

          POST: async (request, params, user) => {
            const taskSchema = z.object({
              title: z.string().min(1),
              priority: z.enum(['low', 'medium', 'high']).optional()
            });

            const body = await request.json();
            const validated = taskSchema.parse(body);

            const result = await this.db.run(
              'INSERT INTO tasks (title, priority, user_id) VALUES (?, ?, ?)',
              [validated.title, validated.priority || 'medium', user.id]
            );

            const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);

            // Invalidate cache
            await this.redis.del('tasks:*');

            // Broadcast real-time update
            this.broadcastEvent('task_created', task);

            return Response.json({ data: task }, { status: 201 });
          }
        },

        // Real-time events with SSE
        '/api/events': {
          GET: async (request, params, user) => {
            const headers = new Headers({
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            });

            const response = new Response(null, { headers });

            // Add to SSE clients
            this.addSSEClient(user.id.toString(), response);

            request.signal.addEventListener('abort', () => {
              this.removeSSEClient(user.id.toString());
            });

            return response;
          }
        }
      }
    });
  }
}
```

### Frontend with Modern React

```typescript
// Modern React with all Bun features
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

function TaskDashboard() {
  const queryClient = useQueryClient();

  // Data fetching with React Query and Bun's fetch
  const { data: tasks, isLoading } = useQuery(
    ['tasks'],
    async () => {
      const response = await fetch('/api/tasks');
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000  // 10 minutes
    }
  );

  // Mutations with automatic cache invalidation
  const createTask = useMutation(
    async (taskData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
      }
    }
  );

  // Real-time updates with SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data);

      if (realtimeEvent.type === 'task_created') {
        queryClient.setQueryData(['tasks'], (old: any) => ({
          ...old,
          data: [...old.data, realtimeEvent.data]
        }));
      }
    };

    return () => eventSource.close();
  }, [queryClient]);

  return (
    <div className="task-dashboard">
      <h1>Tasks</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="task-list">
          {tasks?.data?.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices & Patterns

### Error Handling Patterns

```typescript
// Global error boundary
class GlobalError {
  static handle(error: Error, context?: string): Response {
    console.error(`Error in ${context}:`, error);

    if (error instanceof ValidationError) {
      return Response.json({
        error: 'Validation failed',
        details: error.details
      }, { status: 400 });
    }

    if (error instanceof AuthenticationError) {
      return Response.json({
        error: 'Authentication failed'
      }, { status: 401 });
    }

    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Error types
class ValidationError extends Error {
  constructor(public details: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
```

### Performance Optimization

```typescript
// Response caching
class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Request batching
class BatchProcessor<T> {
  private queue: Array<{ data: T; resolve: (result: any) => void; reject: (error: any) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private processor: (items: T[]) => Promise<any[]>,
    private batchSize: number = 10,
    private batchTimeout: number = 100
  ) {}

  async process(data: T): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchTimeout);
      }
    });
  }

  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const batch = this.queue.splice(0);
    if (batch.length === 0) return;

    try {
      const items = batch.map(item => item.data);
      const results = await this.processor(items);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}
```

### Testing Patterns

```typescript
// Test helpers
class TestUtils {
  static createTestServer(routes: any) {
    return serve({
      port: 0, // Random port
      routes,
      fetch: routes.fetch
    });
  }

  static async makeRequest(server: any, path: string, options?: RequestInit) {
    const url = `http://localhost:${server.port}${path}`;
    return fetch(url, options);
  }

  static async cleanup(server: any) {
    server.stop();
  }
}

// Example test
import { test, expect } from 'bun:test';

test('API should create user', async () => {
  const server = TestUtils.createTestServer({
    '/api/users': {
      POST: async (req) => {
        const body = await req.json();
        return Response.json({ id: 1, ...body }, { status: 201 });
      }
    }
  });

  try {
    const response = await TestUtils.makeRequest(server, '/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('John');
    expect(data.email).toBe('john@example.com');
  } finally {
    await TestUtils.cleanup(server);
  }
});
```

---

## Advanced Tips & Tricks

### 1. Performance Monitoring

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number }>();

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    const metric = this.metrics.get(name) || { count: 0, totalTime: 0 };
    metric.count++;
    metric.totalTime += duration;
    this.metrics.set(name, metric);

    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    const metric = this.metrics.get(name) || { count: 0, totalTime: 0 };
    metric.count++;
    metric.totalTime += duration;
    this.metrics.set(name, metric);

    return result;
  }

  getStats() {
    const stats: Record<string, { avg: number; count: number; total: number }> = {};

    for (const [name, metric] of this.metrics) {
      stats[name] = {
        avg: metric.totalTime / metric.count,
        count: metric.count,
        total: metric.totalTime
      };
    }

    return stats;
  }
}
```

### 2. Memory Management

```typescript
class MemoryManager {
  private caches = new Set<{ clear: () => void }>();

  registerCache(cache: { clear: () => void }) {
    this.caches.add(cache);
  }

  clearAll() {
    for (const cache of this.caches) {
      cache.clear();
    }
  }

  getMemoryUsage() {
    if (typeof process !== 'undefined') {
      return process.memoryUsage();
    }
    return null;
  }
}

// WeakMap for memory-efficient caching
class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }
}
```

### 3. Stream Processing

```typescript
class StreamProcessor {
  static async processStream<T, R>(
    stream: ReadableStream<T>,
    processor: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const result = await processor(value);
      results.push(result);
    }

    return results;
  }

  static createFileStream(filePath: string): ReadableStream<Uint8Array> {
    const file = Bun.file(filePath);
    return file.stream();
  }
}
```

### 4. Database Connection Pool

```typescript
class ConnectionPool {
  private connections: any[] = [];
  private waiting: Array<{ resolve: (conn: any) => void; reject: (error: any) => void }> = [];
  private maxConnections: number;

  constructor(createConnection: () => any, maxConnections: number = 10) {
    this.maxConnections = maxConnections;

    for (let i = 0; i < maxConnections; i++) {
      this.connections.push(createConnection());
    }
  }

  async acquire(): Promise<any> {
    if (this.connections.length > 0) {
      return this.connections.pop()!;
    }

    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  release(connection: any): void {
    if (this.waiting.length > 0) {
      const { resolve } = this.waiting.shift()!;
      resolve(connection);
    } else {
      this.connections.push(connection);
    }
  }
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Port Already in Use

```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 PID

# Or use a different port
PORT=3001 bun run server.ts
```

#### 2. Memory Leaks

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
  });
}, 5000);
```

#### 3. Database Connection Issues

```typescript
// Implement connection retry logic
class DatabaseManager {
  private db: Database | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<Database> {
    if (this.db) return this.db;

    try {
      this.db = new Database(process.env.DATABASE_URL);
      this.reconnectAttempts = 0;
      return this.db;
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
        return this.connect();
      }
      throw error;
    }
  }
}
```

#### 4. Hot Module Replacement Issues

```typescript
// Clean shutdown helper
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');

  // Close database connections
  // Clean up resources
  // Save state

  process.exit(0);
});
```

### Performance Optimization Checklist

- [ ] Use connection pooling for databases
- [ ] Implement proper caching strategies
- [ ] Monitor memory usage regularly
- [ ] Use Bun's built-in performance features
- [ ] Profile slow database queries
- [ ] Implement request batching where appropriate
- [ ] Use compression for API responses
- [ ] Optimize bundle sizes for frontend

### Debugging Tools

```typescript
// Debug middleware
const debugMiddleware = (req: Request, next: () => Promise<Response>) => {
  console.log('🔍 Debug:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  return next();
};

// Request tracer
class RequestTracer {
  private static traceId = 0;

  static generateTraceId(): string {
    return `trace_${++RequestTracer.traceId}_${Date.now()}`;
  }

  static trace<T>(name: string, fn: () => T): T {
    const traceId = this.generateTraceId();
    console.log(`[${traceId}] Starting: ${name}`);

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    console.log(`[${traceId}] Completed: ${name} (${duration.toFixed(2)}ms)`);

    return result;
  }
}
```

---

## 🎓 Final Study Tips

### Key Concepts to Master

1. **Bun Fundamentals**
   - Basic HTTP server with `Bun.serve()`
   - File operations with `Bun.file()`
   - Package management with `bun install`

2. **API Development**
   - RESTful design principles
   - Request/response handling
   - Error handling patterns
   - Middleware implementation

3. **Advanced Patterns**
   - Dependency injection
   - Event-driven architecture
   - Caching strategies
   - Performance optimization

4. **Bun v1.3 Features**
   - Enhanced routing with parameters
   - Unified SQL API
   - Built-in Redis client
   - Zero-config frontend development

5. **Full-Stack Integration**
   - Database integration
   - Real-time communication
   - Authentication & authorization
   - Production deployment

### Practice Exercises

1. **Build a REST API** for a blog platform
2. **Implement a caching layer** with Redis
3. **Create a real-time chat application** with SSE
4. **Build a full-stack CRUD application**
5. **Optimize performance** of an existing application

### Recommended Study Order

1. Start with Module 1 (Fundamentals)
2. Progress through Modules 2-6 (Core Concepts)
3. Learn Hono in Module 7 (Framework)
4. Master v1.3 features in Module 10
5. Build the full-stack application in Module 11
6. Review and practice regularly

---

## 🚀 Next Steps

1. **Build Production Applications** - Apply these concepts to real projects
2. **Contribute to Bun** - The Bun community is growing rapidly
3. **Stay Updated** - Bun evolves quickly, keep up with new features
4. **Share Knowledge** - Help others learn Bun
5. **Explore Ecosystem** - Discover Bun-compatible libraries and tools

---

**Congratulations!** 🎉 You now have a comprehensive understanding of Bun and are ready to build amazing applications. This guide serves as your complete reference for mastering Bun the hard way!

*Remember: The best way to learn is by building. Start coding, experimenting, and creating amazing things with Bun!*