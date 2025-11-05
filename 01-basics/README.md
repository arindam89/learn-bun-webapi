# Module 1: Basics

Learn the fundamentals of HTTP servers and REST APIs with Bun.

## Lessons

### 01 - Hello Server
**File:** `01-hello-server.ts`

Your first HTTP server that responds with a simple text message.

**Concepts:**
- Creating a Bun HTTP server
- Basic request/response cycle
- Running a server on a port

**Run:**
```bash
bun run 01-basics/01-hello-server.ts
```

**Test:**
```bash
curl http://localhost:3000
```

---

### 02 - Basic Routing
**File:** `02-basic-routing.ts`

Handle different URL paths and return different responses.

**Concepts:**
- URL parsing
- Pathname-based routing
- 404 status codes

**Run:**
```bash
bun run 01-basics/02-basic-routing.ts
```

**Test:**
```bash
curl http://localhost:3000/
curl http://localhost:3000/about
curl http://localhost:3000/contact
curl http://localhost:3000/unknown
```

---

### 03 - HTTP Methods
**File:** `03-http-methods.ts`

Understanding and handling different HTTP methods.

**Concepts:**
- GET, POST, PUT, DELETE
- Method-based routing
- Status codes (200, 201, 404, 405)

**Run:**
```bash
bun run 01-basics/03-http-methods.ts
```

**Test:**
```bash
curl http://localhost:3000/resource
curl -X POST http://localhost:3000/resource
curl -X PUT http://localhost:3000/resource
curl -X DELETE http://localhost:3000/resource
```

---

### 04 - JSON Responses
**File:** `04-json-responses.ts`

Return structured JSON data from your API.

**Concepts:**
- JSON serialization
- Response.json() helper
- Structured API responses

**Run:**
```bash
bun run 01-basics/04-json-responses.ts
```

**Test:**
```bash
curl http://localhost:3000/user
curl http://localhost:3000/users
```

---

### 05 - Request Parsing
**File:** `05-request-parsing.ts`

Parse and work with incoming request data.

**Concepts:**
- Query parameters
- Request body parsing
- Reading headers

**Run:**
```bash
bun run 01-basics/05-request-parsing.ts
```

**Test:**
```bash
curl "http://localhost:3000/greet?name=Alice"
curl -X POST http://localhost:3000/echo -H "Content-Type: application/json" -d '{"message": "Hello World"}'
curl http://localhost:3000/headers -H "X-Custom-Header: MyValue"
```

---

## Key Takeaways

- Bun provides a simple `Bun.serve()` API for HTTP servers
- Use `new URL(req.url)` to parse URLs and extract pathnames
- Access HTTP methods via `req.method`
- Use `Response.json()` for JSON responses
- Parse request bodies with `await req.json()`
- Access headers with `req.headers.get()`
- Always handle errors and return appropriate status codes
