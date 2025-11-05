# 🚀 Bun REST API Learning Project

A comprehensive, hands-on guide to building REST APIs with Bun - from absolute basics to production-ready patterns.

## 📚 What You'll Learn

This project takes you from zero to hero in REST API development:

- **HTTP fundamentals** - Servers, routing, methods, status codes
- **REST principles** - CRUD operations, resource design, best practices
- **Data management** - Validation, error handling, middleware patterns
- **Real applications** - Todo lists, blogs, e-commerce APIs
- **Advanced features** - Authentication, file uploads, WebSockets
- **Production skills** - Logging, documentation, monitoring, deployment

## 🎯 Who This Is For

- **Beginners** learning web APIs from scratch
- **Developers** new to Bun or TypeScript
- **Anyone** wanting to build modern REST APIs

**Prerequisites:** Basic JavaScript/TypeScript knowledge

## 🏗️ Project Structure

```
bun_learn/
├── 01-basics/              # HTTP Server Fundamentals
│   ├── 01-hello-server.ts     - Your first HTTP server
│   ├── 02-basic-routing.ts    - URL routing
│   ├── 03-http-methods.ts     - GET, POST, PUT, DELETE
│   ├── 04-json-responses.ts   - Working with JSON
│   ├── 05-request-parsing.ts  - Query params, headers, body
│   └── README.md
│
├── 02-rest-fundamentals/   # REST API Best Practices
│   ├── 01-crud-operations.ts  - Complete CRUD
│   ├── 02-rest-best-practices.ts - Status codes, responses
│   ├── 03-query-filtering.ts  - Search, filter, sort
│   ├── 04-pagination.ts       - Page-based pagination
│   └── README.md
│
├── 03-data-middleware/     # Data Handling & Middleware
│   ├── 01-validation.ts       - Input validation
│   ├── 02-error-handling.ts   - Custom errors, error responses
│   ├── 03-middleware.ts       - CORS, logging, rate limiting
│   ├── 04-router.ts           - Routing patterns
│   └── README.md
│
├── 04-real-world-apps/     # Complete Applications
│   ├── 01-todo-api.ts         - Todo list API
│   ├── 02-blog-api.ts         - Blogging platform
│   ├── 03-ecommerce-api.ts    - E-commerce products
│   └── README.md
│
├── 05-advanced-patterns/   # Advanced Features
│   ├── 01-jwt-auth.ts         - JWT authentication
│   ├── 02-file-upload.ts      - File handling
│   ├── 03-websocket.ts        - Real-time chat
│   └── README.md
│
├── 06-production/          # Production-Ready Code
│   ├── 01-logging.ts          - Structured logging
│   ├── 02-documentation.ts    - OpenAPI/Swagger
│   ├── 03-health-metrics.ts   - Health checks, metrics
│   └── README.md
│
├── 07-hono-framework/      # Hono Web Framework  **NEW!**
│   ├── 01-hono-basics.ts      - Hono fundamentals
│   ├── 02-hono-middleware.ts  - Built-in & custom middleware
│   ├── 03-hono-routing.ts     - Advanced routing patterns
│   ├── 04-hono-validation.ts  - Type-safe validation with Zod
│   ├── 05-hono-vs-vanilla.ts  - Comparison with vanilla Bun
│   └── README.md
│
├── 08-concurrency-reliability/ # Concurrency & Reliability  **NEW!**
│   ├── 01-concurrency-control.ts - Race conditions, locks, mutexes
│   ├── 02-idempotency.ts      - Idempotent APIs, duplicate prevention
│   ├── 03-double-voting.ts    - Prevent duplicate votes/actions
│   ├── 04-rate-limit-cache.ts - Rate limiting & caching strategies
│   ├── 05-circuit-breaker.ts  - Circuit breaker pattern
│   └── README.md
│
└── 09-security/            # Security Best Practices  **NEW!**
    ├── 01-injection-prevention.ts - SQL injection, XSS, command injection
    ├── 02-password-security.ts - Password hashing, authentication
    ├── 03-csrf-cors-headers.ts - CSRF, CORS, security headers
    ├── 04-ddos-protection.ts  - DDoS mitigation, advanced rate limiting
    └── README.md
```

## 🚀 Getting Started

### Prerequisites

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```
   
   This will install:
   - **Hono** - Fast, lightweight web framework (Module 7)
   - **Zod** - TypeScript-first schema validation (Module 7)

### Your First API

Start with the simplest example:

```bash
bun run 01-basics/01-hello-server.ts
```

Then open another terminal and test it:

```bash
curl http://localhost:3000
```

You should see: `Hello from Bun! 🚀`

## 📖 Learning Path

### Stage 1: Fundamentals (Day 1)
Start here if you're new to APIs:

1. **01-basics/01-hello-server.ts** - Create your first server
2. **01-basics/02-basic-routing.ts** - Handle different URLs
3. **01-basics/03-http-methods.ts** - GET, POST, PUT, DELETE
4. **01-basics/04-json-responses.ts** - Return JSON data
5. **01-basics/05-request-parsing.ts** - Read request data

**Time:** 1-2 hours  
**Goal:** Understand HTTP request/response cycle

### Stage 2: REST Principles (Day 2)
Learn REST API best practices:

1. **02-rest-fundamentals/01-crud-operations.ts** - Build CRUD API
2. **02-rest-fundamentals/02-rest-best-practices.ts** - Proper status codes
3. **02-rest-fundamentals/03-query-filtering.ts** - Filter and search
4. **02-rest-fundamentals/04-pagination.ts** - Handle large datasets

**Time:** 2-3 hours  
**Goal:** Build RESTful APIs properly

### Stage 3: Data & Middleware (Day 3)
Handle data properly:

1. **03-data-middleware/01-validation.ts** - Validate inputs
2. **03-data-middleware/02-error-handling.ts** - Handle errors gracefully
3. **03-data-middleware/03-middleware.ts** - Reusable middleware
4. **03-data-middleware/04-router.ts** - Organize routes

**Time:** 2-3 hours  
**Goal:** Build robust, maintainable APIs

### Stage 4: Real Applications (Day 4-5)
Build complete APIs:

1. **04-real-world-apps/01-todo-api.ts** - Todo list management
2. **04-real-world-apps/02-blog-api.ts** - Blogging platform
3. **04-real-world-apps/03-ecommerce-api.ts** - Product catalog

**Time:** 4-6 hours  
**Goal:** Apply everything you've learned

### Stage 5: Advanced Patterns (Day 6-7)
Add advanced features:

1. **05-advanced-patterns/01-jwt-auth.ts** - User authentication
2. **05-advanced-patterns/02-file-upload.ts** - Handle file uploads
3. **05-advanced-patterns/03-websocket.ts** - Real-time features

**Time:** 4-6 hours  
**Goal:** Build production-level features

### Stage 6: Production Ready (Day 8)
Make it production-ready:

1. **06-production/01-logging.ts** - Professional logging
2. **06-production/02-documentation.ts** - API documentation
3. **06-production/03-health-metrics.ts** - Monitoring & health checks

**Time:** 3-4 hours  
**Goal:** Deploy-ready applications

### Stage 7: Hono Framework (Day 9-10) **NEW!**
Master the Hono web framework:

1. **07-hono-framework/01-hono-basics.ts** - Hono fundamentals
2. **07-hono-framework/02-hono-middleware.ts** - Middleware patterns
3. **07-hono-framework/03-hono-routing.ts** - Advanced routing
4. **07-hono-framework/04-hono-validation.ts** - Type-safe validation
5. **07-hono-framework/05-hono-vs-vanilla.ts** - Framework comparison

**Time:** 4-5 hours  
**Goal:** Build cleaner APIs with less boilerplate

### Stage 8: Concurrency & Reliability (Day 11-12) **NEW!**
Build reliable, scalable systems:

1. **08-concurrency-reliability/01-concurrency-control.ts** - Race conditions & locks
2. **08-concurrency-reliability/02-idempotency.ts** - Idempotent operations
3. **08-concurrency-reliability/03-double-voting.ts** - Duplicate prevention
4. **08-concurrency-reliability/04-rate-limit-cache.ts** - Performance optimization
5. **08-concurrency-reliability/05-circuit-breaker.ts** - Fault tolerance

**Time:** 5-6 hours  
**Goal:** Handle high-concurrency scenarios safely

### Stage 9: Security (Day 13-14) **NEW!**
Protect your APIs from common attacks:

1. **09-security/01-injection-prevention.ts** - SQL injection, XSS, command injection
2. **09-security/02-password-security.ts** - Secure password handling
3. **09-security/03-csrf-cors-headers.ts** - CSRF protection & security headers
4. **09-security/04-ddos-protection.ts** - DDoS mitigation & rate limiting

**Time:** 5-6 hours  
**Goal:** Build secure, production-ready APIs

## 🔧 How to Use This Project

### Running Examples

Each file is a standalone, runnable example:

```bash
# Run any example
bun run <path-to-file>

# Example:
bun run 01-basics/01-hello-server.ts
```

### Testing Examples

Most examples include test commands in their header comments. You can also test with curl:

```bash
# Example: Create a book
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"1984","author":"George Orwell"}'
```

### Reading Code

Each file includes:
- **Header comment** - What you'll learn
- **Inline comments** - Explaining key concepts
- **Test commands** - How to try it out

Start by reading the code, then run it, then modify it!

## 🎓 Key Concepts Covered

### HTTP & REST
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Status codes (200, 201, 400, 404, 500, etc.)
- Headers and content types
- Request/response cycle
- RESTful resource design

### Data Handling
- JSON parsing and serialization
- Query parameters
- Path parameters
- Request body parsing
- Form data / Multipart uploads

### Validation & Errors
- Input validation
- Type checking
- Custom error classes
- Error response formatting
- Graceful error handling

### Architecture
- Middleware pattern
- Routing patterns
- Separation of concerns
- Code organization

### Advanced Features
- JWT authentication
- Password hashing
- File uploads and storage
- WebSocket real-time communication
- CORS handling
- Rate limiting

### Production
- Structured logging
- Health checks
- Metrics collection
- API documentation (OpenAPI)
- Deployment strategies

## 🧪 Practice Exercises

After completing each module, try these challenges:

### Module 1: Basics
- [ ] Add a `/about` route with your information
- [ ] Create a route that returns the current time
- [ ] Build a simple calculator API

### Module 2: REST
- [ ] Build a notes API with CRUD operations
- [ ] Add search functionality
- [ ] Implement sorting by different fields

### Module 3: Middleware
- [ ] Create custom validation for email format
- [ ] Build a request timing middleware
- [ ] Add request/response logging

### Module 4: Real Apps
- [ ] Extend the todo API with tags
- [ ] Add comments to blog posts
- [ ] Implement product reviews in e-commerce

### Module 5: Advanced
- [ ] Add password reset functionality
- [ ] Implement image thumbnail generation
- [ ] Build a real-time notification system

### Module 6: Production
- [ ] Create custom metrics
- [ ] Add rate limiting per user
- [ ] Implement request caching

## 🌟 Best Practices Learned

1. **Always validate input** - Never trust user data
2. **Use proper status codes** - 200, 201, 400, 404, 500
3. **Return consistent responses** - Same structure for all endpoints
4. **Handle errors gracefully** - Meaningful error messages
5. **Log important events** - For debugging and monitoring
6. **Document your API** - Make it easy for others to use
7. **Version your API** - `/api/v1/resource`
8. **Implement health checks** - For monitoring and load balancers
9. **Use middleware** - For cross-cutting concerns
10. **Test everything** - Manual and automated testing

## 📦 What's Included

- **30+ runnable examples** - Each teaching specific concepts
- **6 complete APIs** - Todo, Blog, E-commerce, and more
- **Comprehensive comments** - Learn by reading code
- **Test commands** - Try everything with curl
- **READMEs for each module** - Detailed explanations

## 🚀 Next Steps

After completing this course:

1. **Build your own API** - Apply what you learned
2. **Add a database** - SQLite, PostgreSQL, or MongoDB
3. **Write tests** - Use Bun's built-in test runner
4. **Deploy it** - Try Fly.io, Railway, or Render
5. **Share it** - Deploy and share with others!

### Recommended Resources

- [Bun Documentation](https://bun.sh/docs)
- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [MDN Web Docs - HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [OpenAPI Specification](https://swagger.io/specification/)

## 💡 Tips for Success

1. **Code along** - Don't just read, type the code yourself
2. **Experiment** - Modify the examples, break them, fix them
3. **Use curl** - Get comfortable with testing APIs
4. **Read error messages** - They usually tell you what's wrong
5. **Take breaks** - Learning is a marathon, not a sprint
6. **Build projects** - Apply concepts to real problems

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules
bun install
```

---

**Ready to start?** Run your first server:

```bash
bun run 01-basics/01-hello-server.ts
```

Then check out `01-basics/README.md` for detailed explanations!

Happy coding! 🚀

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
