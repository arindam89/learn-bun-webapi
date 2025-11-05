# Module 7: Hono Framework

## Overview

This module introduces **Hono**, a fast, lightweight web framework for modern JavaScript runtimes including Bun, Cloudflare Workers, Deno, and Node.js. After building APIs with vanilla Bun in previous modules, you'll learn how Hono simplifies and enhances API development.

## Why Hono?

### Framework Advantages

1. **Lightweight**: Only ~14KB, minimal overhead
2. **Fast**: One of the fastest web frameworks available
3. **Developer Experience**: Clean, Express-like API
4. **Type Safety**: Built with TypeScript, excellent type inference
5. **Cross-Runtime**: Works on Bun, Deno, Node, Cloudflare Workers, etc.
6. **Middleware Ecosystem**: Rich collection of built-in middleware
7. **No Dependencies**: Core framework has zero dependencies

### Comparison with Vanilla Bun

| Feature | Vanilla Bun | Hono |
|---------|-------------|------|
| **Routing** | Manual regex patterns | Declarative route definitions |
| **Middleware** | Custom implementation | Built-in middleware system |
| **Parameter Extraction** | Manual parsing | Automatic with `c.req.param()` |
| **Error Handling** | Manual try-catch everywhere | Built-in error handlers |
| **Code Complexity** | High for complex APIs | Low, very clean |
| **Type Safety** | Manual typing | Automatic type inference |
| **Learning Curve** | Low (just HTTP) | Low (Express-like) |

## Files in This Module

### 1. `01-hono-basics.ts`
**Introduction to Hono fundamentals**

**Concepts:**
- Installing and importing Hono
- Basic routing (`app.get()`, `app.post()`, etc.)
- Path parameters (`:id`, `:name`)
- Query parameters
- JSON responses with `c.json()`
- Text responses with `c.text()`
- Wildcard routes
- 404 and error handling

**Key Takeaways:**
```typescript
// Vanilla Bun - verbose
if (method === 'GET' && path.match(/^\/users\/([^\/]+)$/)) {
  const id = path.match(/^\/users\/([^\/]+)$/)[1];
  return new Response(JSON.stringify(data));
}

// Hono - clean and declarative
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json(data);
});
```

**Test Commands:**
```bash
bun run 07-hono-framework/01-hono-basics.ts

curl http://localhost:3000
curl http://localhost:3000/hello/Alice
curl http://localhost:3000/greet?name=Bob
curl http://localhost:3000/api/info
```

---

### 2. `02-hono-middleware.ts`
**Middleware system and composition**

**Concepts:**
- Built-in middleware (logger, cors, timing)
- Custom middleware creation
- Middleware execution order
- Context object (`c.set()`, `c.get()`)
- Request/response manipulation
- Authentication middleware
- Rate limiting middleware
- Performance monitoring

**Key Takeaways:**
```typescript
// Clean middleware composition
app.use('*', logger());
app.use('*', timing());
app.use('/api/*', cors());

// Custom middleware with context
const auth = async (c, next) => {
  c.set('user', authenticatedUser);
  await next();
};

app.get('/protected', auth, (c) => {
  const user = c.get('user'); // Type-safe
  return c.json({ user });
});
```

**Middleware Benefits:**
- Composable and reusable
- Type-safe context passing
- Clear separation of concerns
- Easy to test individually

**Test Commands:**
```bash
bun run 07-hono-framework/02-hono-middleware.ts

curl http://localhost:3000/public
curl http://localhost:3000/protected/profile -H "Authorization: Bearer secret-token"
curl http://localhost:3000/admin/stats -H "Authorization: Bearer secret-token"
```

---

### 3. `03-hono-routing.ts`
**Advanced routing patterns and organization**

**Concepts:**
- Route grouping with `new Hono()`
- Nested routers with `app.route()`
- API versioning (v1, v2)
- Resource-based routing
- Admin routes with auth
- Middleware per route group
- Route organization strategies

**Key Takeaways:**
```typescript
// Organize routes by resource
const usersRouter = new Hono();
usersRouter.get('/', listUsers);
usersRouter.post('/', createUser);

const postsRouter = new Hono();
postsRouter.get('/', listPosts);

// Combine into API version
const apiV1 = new Hono();
apiV1.route('/users', usersRouter);
apiV1.route('/posts', postsRouter);

// Mount to main app
app.route('/api/v1', apiV1);
```

**Organization Benefits:**
- Clean code structure
- Easy to maintain
- Scalable architecture
- Clear API versioning

**Test Commands:**
```bash
bun run 07-hono-framework/03-hono-routing.ts

curl http://localhost:3000/api/v1/users
curl http://localhost:3000/api/v2/users
curl http://localhost:3000/admin/dashboard -H "Authorization: Bearer admin-token"
```

---

### 4. `04-hono-validation.ts`
**Type-safe validation with Zod**

**Concepts:**
- Zod schema definition
- Hono validator middleware
- Type inference from schemas
- Validating body, params, query
- Custom validation rules
- Error message formatting
- Partial schemas for updates

**Key Takeaways:**
```typescript
import { z } from 'zod';
import { validator } from 'hono/validator';

// Define schema
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().positive().optional()
});

// Automatic type inference
type User = z.infer<typeof UserSchema>;

// Use in route with type safety
app.post('/users',
  validator('json', (value, c) => {
    const result = UserSchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data;
  }),
  (c) => {
    const validatedData = c.req.valid('json'); // Typed!
    return c.json({ user: validatedData });
  }
);
```

**Validation Benefits:**
- Runtime and compile-time safety
- Automatic TypeScript types
- Rich validation rules
- Clear error messages
- No manual type guards

**Test Commands:**
```bash
bun run 07-hono-framework/04-hono-validation.ts

# Valid request
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":30}'

# Invalid request (see validation errors)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"invalid","age":-5}'
```

---

### 5. `05-hono-vs-vanilla.ts`
**Side-by-side comparison: Hono vs Vanilla Bun**

**Concepts:**
- Code complexity comparison
- Lines of code analysis
- Developer experience differences
- Performance considerations
- When to use each approach

**Comparison Results:**

| Aspect | Vanilla Bun | Hono |
|--------|-------------|------|
| **Lines of Code** | ~120 lines | ~50 lines |
| **Routing** | Manual regex + conditionals | Declarative methods |
| **Error Handling** | Try-catch everywhere | Built-in handlers |
| **Middleware** | Custom implementation | Rich ecosystem |
| **Type Safety** | Manual typing | Automatic inference |
| **Maintainability** | Lower (more boilerplate) | Higher (clean API) |
| **Bundle Size** | Smallest (no deps) | Small (~14KB) |
| **Learning Curve** | Lower (just HTTP) | Low (Express-like) |

**When to Use Vanilla Bun:**
- Learning HTTP fundamentals
- Ultra-minimal deployments
- Maximum control needed
- No dependencies requirement

**When to Use Hono:**
- Production applications
- Team projects
- Complex routing needs
- Rapid development
- API versioning
- Middleware requirements

**Test Commands:**
```bash
bun run 07-hono-framework/05-hono-vs-vanilla.ts

# Test Hono implementation
curl http://localhost:3000/hono/users
curl -X POST http://localhost:3000/hono/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Test Vanilla implementation (same functionality)
curl http://localhost:3000/vanilla/users
curl -X POST http://localhost:3000/vanilla/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'
```

---

## Installation

Hono and Zod need to be installed first:

```bash
bun add hono zod
```

## Key Concepts Summary

### 1. **Context Object (`c`)**
The context object is the heart of Hono:
```typescript
app.get('/example', (c) => {
  c.req.param('id')        // Path parameters
  c.req.query('name')      // Query parameters
  c.req.json()             // Parse JSON body
  c.req.header('auth')     // Get headers
  c.set('key', value)      // Store data
  c.get('key')             // Retrieve data
  c.json(data)             // JSON response
  c.text(data)             // Text response
  c.html(data)             // HTML response
  c.status(200)            // Set status code
  c.header('X-Custom', 'value') // Set header
});
```

### 2. **Middleware Pattern**
```typescript
// Middleware runs before route handler
app.use('*', async (c, next) => {
  console.log('Before handler');
  await next(); // Call next middleware/handler
  console.log('After handler');
});
```

### 3. **Route Organization**
```typescript
// Small app - inline routes
app.get('/users', handler);

// Medium app - grouped routes
const api = new Hono();
api.get('/users', handler);
app.route('/api', api);

// Large app - modular routers
import { usersRouter } from './routes/users';
import { postsRouter } from './routes/posts';
app.route('/users', usersRouter);
app.route('/posts', postsRouter);
```

### 4. **Error Handling**
```typescript
// Global error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Per-route error handling
app.get('/risky', async (c) => {
  try {
    const data = await riskyOperation();
    return c.json(data);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});
```

## Best Practices

### 1. **Middleware Order**
```typescript
// Correct order
app.use('*', logger());          // 1. Logging first
app.use('*', requestId());       // 2. Request tracking
app.use('*', errorHandler());    // 3. Error handling
app.use('/api/*', auth());       // 4. Route-specific auth
```

### 2. **Validation Strategy**
```typescript
// Define schemas separately
const schemas = {
  createUser: z.object({...}),
  updateUser: z.object({...}).partial(),
  userId: z.object({ id: z.string().uuid() })
};

// Reuse across routes
app.post('/users', validator('json', schemas.createUser), handler);
app.put('/users/:id', validator('json', schemas.updateUser), handler);
```

### 3. **Context Usage**
```typescript
// Use context to pass data between middleware
app.use('*', async (c, next) => {
  const startTime = Date.now();
  c.set('startTime', startTime);
  await next();
  const duration = Date.now() - c.get('startTime');
  c.header('X-Response-Time', `${duration}ms`);
});
```

### 4. **Type Safety**
```typescript
// Use type inference
type Variables = {
  user: { id: string; role: string };
  requestId: string;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', async (c, next) => {
  c.set('user', { id: '123', role: 'admin' }); // Typed!
  await next();
});

app.get('/profile', (c) => {
  const user = c.get('user'); // Fully typed
  return c.json(user);
});
```

## Hono Ecosystem

### Built-in Middleware
- `logger` - Request logging
- `cors` - Cross-Origin Resource Sharing
- `timing` - Server-Timing header
- `jwt` - JWT authentication
- `basic-auth` - Basic authentication
- `bearer-auth` - Bearer token auth
- `compress` - Response compression
- `etag` - ETag generation
- `pretty-json` - Pretty JSON responses

### Third-Party Adapters
- `@hono/node-server` - Node.js adapter
- `@hono/zod-validator` - Enhanced Zod integration
- Various cloud platform adapters

## Performance Comparison

Hono is one of the fastest web frameworks:

```
Framework Performance (req/sec):
Hono:     ~500,000 req/sec
Express:  ~15,000 req/sec
Fastify:  ~70,000 req/sec
```

Despite being lightweight, Hono maintains excellent performance.

## Common Patterns

### API Versioning
```typescript
const v1 = new Hono();
v1.get('/users', getUsers);

const v2 = new Hono();
v2.get('/users', getUsersV2);

app.route('/api/v1', v1);
app.route('/api/v2', v2);
```

### Resource Grouping
```typescript
// users.ts
export const usersRouter = new Hono();
usersRouter.get('/', list);
usersRouter.post('/', create);

// posts.ts
export const postsRouter = new Hono();
postsRouter.get('/', list);

// main.ts
app.route('/users', usersRouter);
app.route('/posts', postsRouter);
```

## Exercises

1. **Convert a vanilla Bun server** from Module 1 or 2 to use Hono
2. **Build a complete CRUD API** using Hono with validation
3. **Create a custom middleware** for API key authentication
4. **Implement API versioning** with different response formats
5. **Add comprehensive error handling** with custom error types

## Key Takeaways

1. ✅ **Hono dramatically reduces boilerplate** while maintaining performance
2. ✅ **Middleware system enables clean, reusable code** patterns
3. ✅ **Type safety with Zod** prevents runtime errors
4. ✅ **Routing is declarative and intuitive** compared to manual parsing
5. ✅ **Context object provides clean data flow** between middleware
6. ✅ **Built-in helpers simplify common tasks** (CORS, auth, logging)
7. ✅ **Code is more maintainable** with Hono's clean API

## Next Steps

After mastering Hono, you can:
- Build production APIs with confidence
- Explore Hono's advanced features (streaming, WebSocket)
- Deploy to edge runtimes (Cloudflare Workers)
- Combine with databases (SQLite, PostgreSQL)
- Add authentication (OAuth, JWT)
- Implement real-time features

## Resources

- [Hono Documentation](https://hono.dev)
- [Hono GitHub](https://github.com/honojs/hono)
- [Zod Documentation](https://zod.dev)
- [Hono Examples](https://github.com/honojs/examples)

---

**Note:** While Hono adds a small dependency (~14KB), the developer experience improvements and code quality gains make it worthwhile for most production applications. For learning HTTP fundamentals, vanilla Bun is still valuable, but Hono is recommended for real-world projects.
