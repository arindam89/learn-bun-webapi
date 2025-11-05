# Module 4: Real-World Applications

Complete, production-ready API examples that demonstrate best practices.

## Applications

### 01 - Todo List API
**File:** `01-todo-api.ts`

A full-featured todo list management API.

**Features:**
- CRUD operations for todos
- Priority levels (low, medium, high)
- Completion tracking with timestamps
- Filtering by status and priority
- Sorting capabilities
- Statistics endpoint
- Input validation

**Run:**
```bash
bun run 04-real-world-apps/01-todo-api.ts
```

**Example Usage:**
```bash
# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn REST APIs","priority":"high","description":"Complete tutorial"}'

# List all todos
curl http://localhost:3000/todos

# Filter by priority
curl "http://localhost:3000/todos?priority=high"

# Filter by completion status
curl "http://localhost:3000/todos?completed=false"

# Sort by creation date
curl "http://localhost:3000/todos?sort=createdAt&order=desc"

# Get statistics
curl http://localhost:3000/todos/stats

# Mark as complete
curl -X PATCH http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:3000/todos/1
```

---

### 02 - Blog API
**File:** `02-blog-api.ts`

A blogging platform with posts, authors, and comments.

**Features:**
- Author management
- Post creation and management
- Nested comments on posts
- Publishing workflow
- Tagging system
- Full-text search
- Related resource population
- Cascade deletion

**Run:**
```bash
bun run 04-real-world-apps/02-blog-api.ts
```

**Example Usage:**
```bash
# Create an author
curl -X POST http://localhost:3000/authors \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","bio":"Developer"}'

# Create a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post","content":"Hello World!","authorId":1,"tags":["intro","blog"],"published":true}'

# Search posts
curl "http://localhost:3000/posts?search=REST"

# Filter by author
curl "http://localhost:3000/posts?authorId=1"

# Filter by tag
curl "http://localhost:3000/posts?tag=tutorial"

# Get post with comments
curl http://localhost:3000/posts/1

# Add a comment
curl -X POST http://localhost:3000/posts/1/comments \
  -H "Content-Type: application/json" \
  -d '{"author":"Jane","content":"Great post!"}'

# Get all comments for a post
curl http://localhost:3000/posts/1/comments

# Update post
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","published":false}'
```

---

### 03 - E-commerce Product API
**File:** `03-ecommerce-api.ts`

An e-commerce platform with products, categories, and orders.

**Features:**
- Product catalog management
- Category organization
- Inventory tracking
- Price filtering
- Stock management
- Order creation
- Automatic stock deduction
- SKU uniqueness validation
- Product search

**Run:**
```bash
bun run 04-real-world-apps/03-ecommerce-api.ts
```

**Example Usage:**
```bash
# List all categories
curl http://localhost:3000/categories

# Create category
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Accessories","description":"Tech accessories"}'

# Create product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"Gaming laptop","price":1299.99,"categoryId":1,"stock":10,"sku":"ELEC-LAP-001"}'

# Search products
curl "http://localhost:3000/products?search=mouse"

# Filter by category
curl "http://localhost:3000/products?categoryId=1"

# Filter by price range
curl "http://localhost:3000/products?minPrice=10&maxPrice=50"

# Show only in-stock items
curl "http://localhost:3000/products?inStock=true"

# Sort by price
curl "http://localhost:3000/products?sort=price&order=asc"

# Update stock
curl -X PATCH http://localhost:3000/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}'

# Create an order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2},{"productId":2,"quantity":1}]}'

# View order details
curl http://localhost:3000/orders/1
```

---

## Key Concepts Demonstrated

### 1. Resource Relationships
- One-to-many (authors → posts, posts → comments)
- Resource population (embedding related data)
- Nested routes (`/posts/:id/comments`)

### 2. Business Logic
- Stock management and validation
- Automatic timestamp tracking
- Cascade operations (delete post → delete comments)
- Order total calculation
- SKU uniqueness enforcement

### 3. Data Validation
- Required field checking
- Type validation
- Business rule validation
- Existence validation (foreign keys)

### 4. Querying & Filtering
- Multiple filter parameters
- Range queries (price, date)
- Boolean filters (in stock, published)
- Full-text search
- Sorting with direction

### 5. API Design Patterns
- Consistent response formats
- Proper HTTP status codes
- RESTful endpoint naming
- Resource-oriented design
- Pagination support (shown in earlier modules)

### 6. Error Handling
- Not found errors (404)
- Validation errors (400)
- Conflict errors (409)
- Server errors (500)
- Descriptive error messages

## Testing Tips

### Using curl
```bash
# Pretty print JSON responses
curl http://localhost:3000/products | jq

# Save response to file
curl http://localhost:3000/products > products.json

# Include headers in output
curl -v http://localhost:3000/products

# Set custom headers
curl -H "X-Custom-Header: value" http://localhost:3000/products
```

### Common Test Scenarios
1. **Happy Path**: Normal CRUD operations
2. **Validation**: Invalid inputs
3. **Not Found**: Non-existent resources
4. **Conflicts**: Duplicate entries
5. **Cascade**: Deleting parent resources
6. **Filtering**: Various query combinations
7. **Edge Cases**: Empty results, max values

## Next Steps

After mastering these real-world applications, explore:
- **Module 5**: Authentication and advanced patterns
- **Module 6**: Production concerns (logging, testing, caching)
- Integrating with real databases (SQLite, PostgreSQL)
- Adding WebSocket support
- Building a frontend to consume these APIs
