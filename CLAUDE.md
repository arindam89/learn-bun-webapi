# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running Examples
All modules and examples can be run directly with Bun:
```bash
# Run specific examples
bun run 01-basics/01-hello-server.ts
bun run 07-hono-framework/01-basic-hono-app.ts

# Install dependencies
bun install

# Development with hot reload
bun --hot run <file>
```

### Testing
Each example includes curl commands in comments for testing. Examples:
```bash
curl http://localhost:3000
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"John"}'
```

## Project Architecture

This is a **progressive learning platform** for REST API development using Bun, structured into 9 modules:

### Core Modules
- **01-basics/**: HTTP server fundamentals using `Bun.serve()`
- **02-rest-fundamentals/**: CRUD operations, filtering, pagination
- **03-data-middleware/**: Validation (Zod), error handling, middleware patterns
- **04-real-world-apps/**: Complete application examples
- **05-advanced-patterns/**: Authentication, file uploads, WebSockets
- **06-production/**: Structured logging, OpenAPI docs, monitoring

### Advanced Modules (New)
- **07-hono-framework/**: Hono web framework patterns
- **08-concurrency-reliability/**: Race conditions, rate limiting, circuit breakers
- **09-security/**: Injection prevention, CSRF protection, DDoS mitigation

### Key Architectural Patterns

**Two Development Approaches:**
1. **Vanilla Bun** (Modules 1-6): Direct `Bun.serve()` usage
2. **Hono Framework** (Modules 7+): Express-like declarative API

**Common Patterns:**
- RESTful routing with proper HTTP methods
- Type-safe request/response handling with TypeScript
- Middleware pattern for cross-cutting concerns
- Error handling with appropriate status codes
- JSON request/response bodies

## Development Guidelines

### Bun-First Development (Mandatory)
This project enforces Bun usage over Node.js ecosystem:
- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of Jest/Vitest
- Use `Bun.serve()` for HTTP servers
- Use `bun:sqlite`, `Bun.redis`, `Bun.sql` for databases
- Use `Bun.file` for file operations
- Use Bun's built-in WebSocket support

### Code Standards
- TypeScript strict mode enabled
- All examples use standardized header comments
- Type-safe patterns throughout
- Progressive complexity from simple to advanced
- Each file is self-contained and runnable

### Dependencies
- **Runtime**: Bun (latest)
- **Web Framework**: Hono v4.0+ (for modules 7+)
- **Validation**: Zod v3.22+
- **TypeScript**: v5+ (peer dependency)

### File Structure
- No build step required (source maps only)
- Examples are self-contained TypeScript files
- Each module has its own README.md with detailed explanations
- Main README.md provides complete learning path overview

## Important Notes

- All 37+ examples are runnable and include test curl commands
- Focus on production-ready patterns and best practices
- Modern ESNext TypeScript with bundler optimization
- No additional build tools or configuration required