# Module 3: Data Management & Middleware

Learn how to validate data, handle errors, and build middleware patterns.

## Lessons

### 01 - Input Validation
**File:** `01-validation.ts`

Validate incoming request data to ensure data integrity.

**Concepts:**
- Request body validation
- Type checking
- Required vs optional fields
- Format validation (email, etc.)
- Custom validation functions
- Returning validation errors

**Run:**
```bash
bun run 03-data-middleware/01-validation.ts
```

**Test:**
```bash
# Valid user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","age":25}'

# Invalid - short username
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"jo","email":"john@example.com"}'

# Invalid - bad email format
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"notanemail"}'
```

---

### 02 - Error Handling
**File:** `02-error-handling.ts`

Centralized error handling with custom error classes.

**Concepts:**
- Custom error classes
- Error hierarchy
- Centralized error handler
- Consistent error responses
- Error logging
- Status code mapping

**Run:**
```bash
bun run 03-data-middleware/02-error-handling.ts
```

**Test:**
```bash
# Not found error
curl http://localhost:3000/items/999

# Validation error
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget"}'

# Conflict error (duplicate SKU)
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","sku":"WDG-001"}'

# Internal error
curl http://localhost:3000/error
```

---

### 03 - Middleware Pattern
**File:** `03-middleware.ts`

Build reusable middleware for cross-cutting concerns.

**Concepts:**
- Middleware pattern
- Request/response interceptors
- CORS handling
- Request logging
- Rate limiting
- Request ID tracking
- Composing middleware

**Run:**
```bash
bun run 03-data-middleware/03-middleware.ts
```

**Test:**
```bash
# Watch the console for logs
curl http://localhost:3000/data

# Check response headers
curl -v http://localhost:3000/data

# Test rate limiting (make 11+ requests quickly)
for i in {1..12}; do curl http://localhost:3000/data; done
```

---

### 04 - Router Pattern
**File:** `04-router.ts`

Build a simple but powerful routing system.

**Concepts:**
- Route matching with regex
- Path parameters extraction
- Method-based routing
- Route handlers
- RESTful route organization

**Run:**
```bash
bun run 03-data-middleware/04-router.ts
```

**Test:**
```bash
# List tasks
curl http://localhost:3000/tasks

# Get specific task
curl http://localhost:3000/tasks/1

# Create task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","completed":false}'

# Update task
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete task
curl -X DELETE http://localhost:3000/tasks/1
```

---

## Key Takeaways

### Validation
- Always validate input on the server side
- Provide clear, actionable error messages
- Validate types, formats, and business rules
- Return structured validation errors

### Error Handling
- Use custom error classes for different error types
- Centralize error handling logic
- Log errors appropriately
- Return consistent error response format
- Map errors to appropriate HTTP status codes

### Middleware
- Middleware handles cross-cutting concerns
- Each middleware should have a single responsibility
- Middleware can modify requests and responses
- Compose middleware in the correct order
- Common uses: logging, CORS, auth, rate limiting

### Routing
- Separate routing logic from business logic
- Use path parameters for resource identifiers
- Match routes with regex patterns
- Organize routes by resource
- Return 404 for unmatched routes

## Common Patterns

### Validation Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "timestamp": "2025-11-05T10:30:00.000Z"
  }
}
```

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```
