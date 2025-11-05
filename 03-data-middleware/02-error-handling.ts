/**
 * LESSON 2: Error Handling
 * 
 * Concepts covered:
 * - Centralized error handling
 * - Custom error classes
 * - Error response formatting
 * - Try-catch patterns
 * - Logging errors
 * 
 * Run: bun run 03-data-middleware/02-error-handling.ts
 */

// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(404, "NOT_FOUND", `${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

function handleError(error: unknown): Response {
  console.error("Error occurred:", error);

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
    return Response.json(response, { status: error.statusCode });
  }

  // Unknown errors
  const response: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    },
  };
  return Response.json(response, { status: 500 });
}

interface Item {
  id: number;
  name: string;
  sku: string;
}

let items: Item[] = [
  { id: 1, name: "Widget", sku: "WDG-001" },
  { id: 2, name: "Gadget", sku: "GDG-001" },
];
let nextId = 3;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // GET /items
      if (path === "/items" && method === "GET") {
        return Response.json({ success: true, data: items });
      }

      // GET /items/:id
      const getMatch = path.match(/^\/items\/(\d+)$/);
      if (getMatch && method === "GET") {
        const id = parseInt(getMatch[1]!);
        const item = items.find(i => i.id === id);
        
        if (!item) {
          throw new NotFoundError("Item", id);
        }
        
        return Response.json({ success: true, data: item });
      }

      // POST /items
      if (path === "/items" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.name || !body.sku) {
          throw new ValidationError("Name and SKU are required");
        }

        // Check for duplicate SKU
        if (items.some(i => i.sku === body.sku)) {
          throw new ConflictError(`Item with SKU ${body.sku} already exists`);
        }

        const newItem: Item = {
          id: nextId++,
          name: body.name,
          sku: body.sku,
        };

        items.push(newItem);
        
        return Response.json(
          { success: true, data: newItem },
          { status: 201 }
        );
      }

      // DELETE /items/:id
      const deleteMatch = path.match(/^\/items\/(\d+)$/);
      if (deleteMatch && method === "DELETE") {
        const id = parseInt(deleteMatch[1]!);
        const index = items.findIndex(i => i.id === id);
        
        if (index === -1) {
          throw new NotFoundError("Item", id);
        }

        items.splice(index, 1);
        return Response.json({ success: true, message: "Item deleted" });
      }

      // Test error endpoint
      if (path === "/error") {
        throw new Error("This is a test error");
      }

      throw new NotFoundError("Endpoint", path);

    } catch (error) {
      return handleError(error);
    }
  },
});

console.log(`🚨 Error Handling API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  GET    /items`);
console.log(`  GET    /items/:id`);
console.log(`  POST   /items`);
console.log(`  DELETE /items/:id`);
console.log(`  GET    /error (test)`);
