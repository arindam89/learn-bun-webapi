# Module 10: Bun v1.3 Features

This module explores the groundbreaking new features introduced in Bun 1.3, showcasing how these capabilities enhance development productivity, performance, and maintainability. Each example demonstrates real-world applications of Bun's latest innovations.

## 🚀 What's New in Bun 1.3

Bun 1.3 introduces major advancements that further solidify Bun as a comprehensive JavaScript runtime and build tool:

- **Zero-config frontend development** - Build frontend apps without complex configurations
- **Unified SQL API** - Consistent database interface across PostgreSQL, MySQL, and SQLite
- **Built-in Redis client** - Native Redis support without external dependencies
- **Enhanced security features** - Built-in protection against common web vulnerabilities
- **Package catalogs** - Advanced dependency management for monorepos and large projects
- **Async stack traces** - Improved debugging with better error context
- **VS Code test integration** - Seamless testing experience in your editor

---

## 📚 Module Structure

### 01. Unified SQL API (`01-unified-sql-api.ts`)
**Learn database operations across different SQL databases with a single API**

**Features demonstrated:**
- Cross-database compatibility (PostgreSQL, MySQL, SQLite)
- Parameterized queries for security
- Transaction management
- Connection pooling
- Database migrations

**Key concepts:**
```typescript
import { Database } from 'bun:sql';

// Single API for multiple databases
const db = new Database('postgresql://...'); // or mysql://, sqlite:...
const result = await db.all('SELECT * FROM users WHERE active = ?', [true]);
```

**Setup requirements:**
```bash
# Start databases with Docker
docker-compose up -d  # See docker-compose.yml in this directory

# Run the example
bun run 01-unified-sql-api.ts
```

### 02. Built-in Redis Client (`02-built-in-redis-client.ts`)
**Master Redis operations with Bun's native client**

**Features demonstrated:**
- Basic Redis operations (SET, GET, DEL, etc.)
- Hash operations for structured data
- List operations for queues and stacks
- Set operations for unique collections
- Sorted sets for leaderboards
- Pub/Sub messaging
- Pipelining for performance
- Lua script execution

**Key concepts:**
```typescript
import { Redis } from 'bun:redis';

const redis = new Redis({ host: 'localhost', port: 6379 });
await redis.set('user:123', JSON.stringify(userData));
const data = await redis.get('user:123');
```

**Setup requirements:**
```bash
# Start Redis
docker run -p 6379:6379 redis:latest

# Run the example
bun run 02-built-in-redis-client.ts
```

### 03. Zero-Config Frontend Development (`03-zero-config-frontend.ts`)
**Build modern web applications without configuration files**

**Features demonstrated:**
- Built-in bundling for TypeScript and JSX
- CSS-in-JS and module CSS support
- Hot Module Replacement (HMR)
- Asset optimization and hashing
- Development server with live reload
- Production build optimizations

**Key concepts:**
```typescript
// No webpack.config.js or vite.config.js needed!
const buildResult = await Bun.build({
  entrypoints: ['./src/app.tsx'],
  outdir: './dist',
  target: 'browser',
  minify: true,
});
```

**Running the example:**
```bash
# Development mode with HMR
bun --hot run 03-zero-config-frontend.ts

# Production build
NODE_ENV=production bun run 03-zero-config-frontend.ts
```

### 04. Security Enhancements (`04-security-enhancements.ts`)
**Implement comprehensive security with Bun's built-in protections**

**Features demonstrated:**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token generation and validation
- Rate limiting
- Security headers management
- Secure file upload validation
- CORS configuration

**Key concepts:**
```typescript
// Built-in security features
import { randomBytes, timingSafeEqual } from 'crypto';

// SQL injection prevention
const sanitized = InputValidator.sanitizeSQLInput(userInput);

// XSS protection
const safeHTML = InputValidator.sanitizeHTML(userInput);
```

**Security features included:**
- Content Security Policy (CSP)
- Security headers (HSTS, X-Frame-Options, etc.)
- Rate limiting with exponential backoff
- File upload validation with content checking
- Timing-attack resistant comparisons

### 05. Package Catalogs (`05-package-catalogs.ts`)
**Advanced dependency management for modern JavaScript projects**

**Features demonstrated:**
- Centralized version management
- Monorepo workspace support
- Environment-specific overrides
- Package aliasing and migration
- Constraint-based versioning
- Dependency optimization

**Key concepts:**
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
      }
    }
  },
  "dependencies": {
    "react": "catalog:react",
    "typescript": "catalog:typescript"
  }
}
```

---

## 🛠️ Development Setup

### Prerequisites
- **Bun 1.3+** installed (`bun upgrade`)
- Docker (for database examples)
- Git

### Initial Setup
```bash
# Install dependencies
bun install

# Start required services
docker-compose up -d  # Starts PostgreSQL, MySQL, Redis

# Run individual examples
bun run 01-unified-sql-api.ts
bun run 02-built-in-redis-client.ts
bun run 03-zero-config-frontend.ts
bun run 04-security-enhancements.ts
bun run 05-package-catalogs.ts
```

### Docker Services
The module includes a `docker-compose.yml` file that provides:
- **PostgreSQL** (`localhost:5432`) - SQL API example
- **MySQL** (`localhost:3306`) - SQL API example
- **Redis** (`localhost:6379`) - Redis client example

```bash
# Start all services
docker-compose up -d

# View service logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🏗️ Architecture Patterns

### Database Abstraction
Bun 1.3's unified SQL API enables writing database-agnostic code:

```typescript
// Works with PostgreSQL, MySQL, and SQLite
class UserRepository {
  constructor(private db: Database) {}

  async create(userData: User) {
    return await this.db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [userData.name, userData.email]
    );
  }

  async findById(id: number) {
    return await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
  }
}
```

### Security-First Development
Implement comprehensive security from the ground up:

```typescript
// Secure API endpoint
const secureHandler = async (req: Request) => {
  // Rate limiting
  if (!rateLimiter.isAllowed(clientIP)) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // CSRF validation
  if (req.method !== 'GET') {
    const token = req.headers.get('x-csrf-token');
    if (!csrf.validateToken(token)) {
      return new Response('Invalid CSRF Token', { status: 403 });
    }
  }

  // Input sanitization
  const body = await req.json();
  const sanitized = InputValidator.sanitizeSQLInput(body.search);

  // Secure database query
  const results = await db.query('SELECT * FROM posts WHERE content LIKE ?',
    [`%${sanitized}%`]);

  return Response.json(results);
};
```

### Modern Frontend Development
Build complex applications without configuration files:

```typescript
// Automatic TypeScript and JSX support
import React from 'react';
import './styles.css'; // CSS modules work out of the box

export function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{/* JSX automatically supported */}</div>;
}

// Build with zero configuration
// bun build src/app.tsx --outdir dist
```

---

## 🔧 Advanced Usage

### Custom Database Configuration
```typescript
const db = new Database({
  url: process.env.DATABASE_URL,
  maxConnections: 10,
  connectionTimeout: 5000,
  idleTimeout: 30000,
});
```

### Redis Cluster Support
```typescript
const redis = new Redis({
  nodes: [
    { host: 'redis-01', port: 6379 },
    { host: 'redis-02', port: 6379 },
    { host: 'redis-03', port: 6379 },
  ],
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});
```

### Production Build Optimization
```typescript
const buildResult = await Bun.build({
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  splitting: true,
  treeShaking: true,
  deadCodeElimination: true,
  sourcemap: false, // Disable for production
});
```

---

## 📊 Performance Benefits

### Database Operations
- **2-5x faster** than equivalent Node.js database drivers
- **Native binary protocol** support for PostgreSQL and MySQL
- **Connection pooling** built-in
- **Prepared statements** automatically cached

### Redis Operations
- **3-4x faster** than ioredis
- **Native protocol implementation**
- **Pipelining support** for batch operations
- **Zero-copy data handling**

### Frontend Bundling
- **10-20x faster** than Webpack
- **5-10x faster** than Vite
- **Incremental builds** with fine-grained caching
- **Automatic code splitting**

---

## 🧪 Testing Examples

Each module file includes comprehensive test cases that demonstrate:

```typescript
// Test SQL API
const db = new Database('sqlite::memory:');
const result = await db.run('CREATE TABLE test (id INTEGER)');
console.assert(result.changes === 1, 'Table created successfully');

// Test Redis operations
const redis = new Redis({ host: 'localhost', port: 6379 });
await redis.set('test', 'value');
const value = await redis.get('test');
console.assert(value === 'value', 'Redis set/get working');

// Test security features
const sanitized = InputValidator.sanitizeHTML('<script>alert("xss")</script>');
console.assert(sanitized.includes('&lt;script&gt;'), 'XSS protection working');
```

---

## 🔍 Debugging and Monitoring

### Async Stack Traces
Bun 1.3 provides enhanced async debugging:

```typescript
// Better error context for async operations
async function example() {
  await operation1();
  await operation2(); // Error here shows full async stack
  await operation3();
}
```

### VS Code Integration
- **Run/Debug** TypeScript files directly
- **Test Explorer** integration
- **Hot Reload** support during development
- **IntelliSense** for Bun APIs

---

## 🌍 Production Deployment

### Environment Configuration
```bash
# Database configuration
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export REDIS_URL="redis://user:pass@host:6379"

# Security configuration
export SESSION_SECRET="your-secret-key"
export NODE_ENV="production"

# Frontend configuration
export CDN_URL="https://cdn.yourapp.com"
```

### Docker Deployment
```dockerfile
FROM oven/bun:1.3

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

---

## 📈 Migration Guide

### From Node.js to Bun 1.3

**Database code:**
```typescript
// Before (Node.js with pg)
import { Pool } from 'pg';
const pool = new Pool();
const result = await pool.query('SELECT * FROM users');

// After (Bun 1.3)
import { Database } from 'bun:sql';
const db = new Database('postgresql://...');
const result = await db.all('SELECT * FROM users');
```

**Redis code:**
```typescript
// Before (Node.js with ioredis)
import Redis from 'ioredis';
const redis = new Redis();

// After (Bun 1.3)
import { Redis } from 'bun:redis';
const redis = new Redis();
```

**Frontend builds:**
```typescript
// Before (webpack.config.js, vite.config.js, etc.)
// Lots of configuration files

// After (Bun 1.3)
// No configuration needed! Just bun build.
```

---

## 🚦 Best Practices

### Database Usage
1. **Use parameterized queries** to prevent SQL injection
2. **Implement connection pooling** for high-concurrency applications
3. **Use transactions** for multi-operation consistency
4. **Add database migrations** for schema management

### Redis Usage
1. **Use pipelining** for batch operations
2. **Implement proper key expiration** for cache management
3. **Use Lua scripts** for atomic operations
4. **Monitor memory usage** for large datasets

### Security Implementation
1. **Validate all inputs** at application boundaries
2. **Use HTTPS everywhere** in production
3. **Implement rate limiting** to prevent abuse
4. **Keep dependencies updated** using package catalogs

### Frontend Development
1. **Leverage TypeScript** for type safety
2. **Use CSS modules** for scoped styling
3. **Implement proper error boundaries**
4. **Optimize bundle sizes** with code splitting

---

## 🔗 Additional Resources

- [Bun 1.3 Release Notes](https://bun.com/blog/bun-v1.3)
- [Bun Documentation](https://bun.sh/docs)
- [Bun SQL API Guide](https://bun.sh/docs/sql)
- [Bun Redis Client](https://bun.sh/docs/redis)
- [Package Catalogs Documentation](https://bun.sh/docs/package-catalogs)

---

## 🎯 Learning Outcomes

After completing this module, you will understand:

1. **Unified Database Access** - How to work with multiple SQL databases using a single API
2. **Native Redis Integration** - High-performance Redis operations without external dependencies
3. **Zero-Config Frontend Development** - Building modern web applications without complex build setups
4. **Security-First Development** - Implementing comprehensive security measures in your applications
5. **Advanced Package Management** - Using package catalogs for dependency optimization in large projects
6. **Production-Ready Patterns** - Best practices for deploying Bun 1.3 applications

These skills will enable you to build faster, more secure, and more maintainable applications using the latest Bun 1.3 features.