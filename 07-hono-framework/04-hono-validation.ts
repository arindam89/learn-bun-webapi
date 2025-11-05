/**
 * Module 7: Hono Framework - Validation with Zod
 * 
 * Integrate Zod validation with Hono for type-safe request validation.
 * Compare with manual validation from Module 3.
 * 
 * Key Concepts:
 * - Zod schema validation
 * - Hono validator middleware
 * - Type inference from schemas
 * - Custom validation rules
 * - Error message formatting
 * - Request body, params, and query validation
 * 
 * Advantages:
 * - Type safety at runtime and compile time
 * - Automatic TypeScript types
 * - Rich validation rules
 * - Composable schemas
 * - Clear error messages
 * 
 * Run: bun run 07-hono-framework/04-hono-validation.ts
 * Test:
 *   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com","age":30}'
 *   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"A","email":"invalid","age":-5}'
 *   curl -X PUT http://localhost:3000/users/123 -H "Content-Type: application/json" -d '{"name":"Updated Name"}'
 *   curl 'http://localhost:3000/users?page=1&limit=10&sort=name'
 */

import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';

const app = new Hono();

// ============================================================================
// Zod Schemas
// ============================================================================

// User schema with validation rules
const UserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.string()
    .email('Invalid email format'),
  age: z.number()
    .int('Age must be an integer')
    .min(0, 'Age must be positive')
    .max(150, 'Age must be realistic')
    .optional(),
  role: z.enum(['user', 'admin', 'moderator'])
    .default('user'),
  bio: z.string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  website: z.string()
    .url('Invalid URL format')
    .optional(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional()
});

// Partial schema for updates
const UserUpdateSchema = UserSchema.partial();

// ID parameter schema
const IdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID must be numeric')
});

// Query parameter schema
const UserQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be numeric')
    .transform(Number)
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be numeric')
    .transform(Number)
    .refine(val => val <= 100, 'Limit cannot exceed 100')
    .default('10'),
  sort: z.enum(['name', 'email', 'age', 'createdAt'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc'])
    .default('desc')
});

// Product schema with complex validation
const ProductSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food', 'other']),
  inStock: z.boolean(),
  quantity: z.number().int().nonnegative(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive()
  }).optional(),
  tags: z.array(z.string()).min(1, 'At least one tag required')
}).refine(
  data => data.inStock ? data.quantity > 0 : true,
  'In-stock products must have quantity > 0'
);

// ============================================================================
// Type Inference from Schemas
// ============================================================================

type User = z.infer<typeof UserSchema>;
type UserUpdate = z.infer<typeof UserUpdateSchema>;
type UserQuery = z.infer<typeof UserQuerySchema>;
type Product = z.infer<typeof ProductSchema>;

// ============================================================================
// In-Memory Storage
// ============================================================================

const users = new Map<string, User & { id: string; createdAt: string }>();

// Seed data
users.set('1', {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z'
});

// ============================================================================
// Routes with Validation
// ============================================================================

// List users with query validation
app.get(
  '/users',
  validator('query', (value, c) => {
    const result = UserQuerySchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Invalid query parameters',
        details: result.error.flatten()
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const query = c.req.valid('query');
    
    let userList = Array.from(users.values());
    
    // Apply sorting
    userList.sort((a, b) => {
      const aVal = a[query.sort] || '';
      const bVal = b[query.sort] || '';
      
      if (query.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Apply pagination
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginatedUsers = userList.slice(start, end);
    
    return c.json({
      users: paginatedUsers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: userList.length,
        totalPages: Math.ceil(userList.length / query.limit)
      },
      sort: {
        field: query.sort,
        order: query.order
      }
    });
  }
);

// Get user by ID with param validation
app.get(
  '/users/:id',
  validator('param', (value, c) => {
    const result = IdParamSchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Invalid user ID',
        details: result.error.flatten()
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const { id } = c.req.valid('param');
    const user = users.get(id);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  }
);

// Create user with body validation
app.post(
  '/users',
  validator('json', (value, c) => {
    const result = UserSchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const validatedUser = c.req.valid('json');
    
    const id = (users.size + 1).toString();
    const newUser = {
      id,
      ...validatedUser,
      createdAt: new Date().toISOString()
    };
    
    users.set(id, newUser);
    
    return c.json(newUser, 201);
  }
);

// Update user with partial validation
app.put(
  '/users/:id',
  validator('param', (value, c) => {
    const result = IdParamSchema.safeParse(value);
    if (!result.success) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    return result.data;
  }),
  validator('json', (value, c) => {
    const result = UserUpdateSchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    
    const user = users.get(id);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const updated = { ...user, ...updates };
    users.set(id, updated);
    
    return c.json(updated);
  }
);

// Complex product validation
app.post(
  '/products',
  validator('json', (value, c) => {
    const result = ProductSchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Product validation failed',
        details: result.error.flatten().fieldErrors,
        message: result.error.errors.map(e => e.message).join(', ')
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const product = c.req.valid('json');
    
    return c.json({
      success: true,
      product: {
        id: crypto.randomUUID(),
        ...product,
        createdAt: new Date().toISOString()
      }
    }, 201);
  }
);

// Custom validation example
const CustomEmailSchema = z.object({
  email: z.string().refine(
    (email) => {
      // Custom domain validation
      const allowedDomains = ['example.com', 'test.com'];
      const domain = email.split('@')[1];
      return allowedDomains.includes(domain);
    },
    { message: 'Email must be from allowed domains (example.com, test.com)' }
  )
});

app.post(
  '/validate-email',
  validator('json', (value, c) => {
    const result = CustomEmailSchema.safeParse(value);
    
    if (!result.success) {
      return c.json({
        error: 'Email validation failed',
        details: result.error.errors
      }, 400);
    }
    
    return result.data;
  }),
  (c) => {
    const { email } = c.req.valid('json');
    
    return c.json({
      message: 'Email is valid',
      email
    });
  }
);

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

console.log('🔥 Hono Validation server running on http://localhost:3000');
console.log('\nEndpoints:');
console.log('  GET  /users?page=1&limit=10&sort=name&order=asc');
console.log('  GET  /users/:id');
console.log('  POST /users');
console.log('  PUT  /users/:id');
console.log('  POST /products');
console.log('  POST /validate-email');
console.log('\nExample requests:');
console.log('  Valid user: {"name":"John","email":"john@example.com","age":30}');
console.log('  Valid product: {"name":"Laptop","price":999.99,"category":"electronics","inStock":true,"quantity":10,"tags":["tech"]}');
console.log('  Valid email: {"email":"test@example.com"}');

export default app;
