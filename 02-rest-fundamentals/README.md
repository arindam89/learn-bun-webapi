# Module 2: REST Fundamentals

Learn REST API best practices and common patterns.

## Lessons

### 01 - CRUD Operations
**File:** `01-crud-operations.ts`

Complete Create, Read, Update, Delete operations for a resource.

**Concepts:**
- RESTful endpoint design
- HTTP method semantics (GET, POST, PUT, DELETE)
- URL parameter extraction
- Status codes (200, 201, 400, 404)

**Endpoints:**
- `GET /books` - List all books
- `GET /books/:id` - Get a specific book
- `POST /books` - Create a new book
- `PUT /books/:id` - Update a book
- `DELETE /books/:id` - Delete a book

**Run:**
```bash
bun run 02-rest-fundamentals/01-crud-operations.ts
```

**Test:**
```bash
# Create
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"1984","author":"George Orwell"}'

# List all
curl http://localhost:3000/books

# Get one
curl http://localhost:3000/books/1

# Update
curl -X PUT http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"1984","author":"George Orwell","year":1949}'

# Delete
curl -X DELETE http://localhost:3000/books/1
```

---

### 02 - REST Best Practices
**File:** `02-rest-best-practices.ts`

Implementing REST API best practices with consistent response patterns.

**Concepts:**
- Consistent API responses
- Error handling with error codes
- 204 No Content for deletions
- 409 Conflict for duplicates
- PATCH vs PUT
- API versioning (/api/v1)

**Run:**
```bash
bun run 02-rest-fundamentals/02-rest-best-practices.ts
```

**Test:**
```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com"}'

# Partial update
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"john_updated"}'
```

---

### 03 - Query Filtering
**File:** `03-query-filtering.ts`

Filter, search, and sort resources using query parameters.

**Concepts:**
- Query parameter parsing
- Filtering by multiple criteria
- Search functionality
- Sorting (asc/desc)
- Combining filters

**Run:**
```bash
bun run 02-rest-fundamentals/03-query-filtering.ts
```

**Test:**
```bash
# Filter by category
curl "http://localhost:3000/products?category=electronics"

# Price range
curl "http://localhost:3000/products?minPrice=100&maxPrice=500"

# Sort
curl "http://localhost:3000/products?sort=price&order=desc"

# Search
curl "http://localhost:3000/products?search=phone"

# Combine filters
curl "http://localhost:3000/products?category=electronics&inStock=true&sort=price"
```

---

### 04 - Pagination
**File:** `04-pagination.ts`

Implement pagination for large datasets.

**Concepts:**
- Page-based pagination
- Offset-based pagination
- Limit controls
- Pagination metadata
- hasNext/hasPrev flags

**Run:**
```bash
bun run 02-rest-fundamentals/04-pagination.ts
```

**Test:**
```bash
# Default (first page)
curl "http://localhost:3000/items"

# Specific page
curl "http://localhost:3000/items?page=2&limit=5"

# Offset-based
curl "http://localhost:3000/items?offset=10&limit=5"
```

---

## Key Takeaways

### REST Principles
1. **Resources** - Use plural nouns (`/users`, `/products`)
2. **HTTP Methods** - Use the right verb for each operation
   - GET: Retrieve
   - POST: Create
   - PUT: Full update
   - PATCH: Partial update
   - DELETE: Remove

3. **Status Codes**
   - 200: OK
   - 201: Created
   - 204: No Content
   - 400: Bad Request
   - 404: Not Found
   - 409: Conflict
   - 500: Internal Server Error

### Best Practices
- Always validate input
- Return consistent response structures
- Use meaningful error messages
- Include metadata (pagination, counts)
- Support filtering and sorting
- Version your API (`/api/v1`)
- Use appropriate status codes
