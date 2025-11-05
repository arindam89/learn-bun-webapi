/**
 * LESSON 2: REST Best Practices
 * 
 * Concepts covered:
 * - Resource naming conventions (plural nouns)
 * - Proper status codes (200, 201, 204, 400, 404, 409)
 * - Response consistency
 * - Error handling patterns
 * 
 * Run: bun run 02-rest-fundamentals/02-rest-best-practices.ts
 */

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

let users: User[] = [];
let nextId = 1;

function createResponse<T>(data: T, status = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return Response.json(response, { status });
}

function createErrorResponse(code: string, message: string, status: number): Response {
  const response: ApiResponse<never> = {
    success: false,
    error: { code, message },
  };
  return Response.json(response, { status });
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // GET /api/users - List all users
      if (path === "/api/users" && method === "GET") {
        return createResponse(users);
      }

      // GET /api/users/:id - Get specific user
      const getMatch = path.match(/^\/api\/users\/(\d+)$/);
      if (getMatch && method === "GET") {
        const id = parseInt(getMatch[1]!);
        const user = users.find(u => u.id === id);
        
        if (!user) {
          return createErrorResponse(
            "USER_NOT_FOUND",
            `User with id ${id} not found`,
            404
          );
        }
        
        return createResponse(user);
      }

      // POST /api/users - Create user
      if (path === "/api/users" && method === "POST") {
        const body = await req.json() as any;
        
        // Validation
        if (!body.username || !body.email) {
          return createErrorResponse(
            "VALIDATION_ERROR",
            "Username and email are required",
            400
          );
        }

        // Check for duplicate email
        if (users.some(u => u.email === body.email)) {
          return createErrorResponse(
            "DUPLICATE_EMAIL",
            "User with this email already exists",
            409
          );
        }

        const newUser: User = {
          id: nextId++,
          username: body.username,
          email: body.email,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        
        return createResponse(newUser, 201);
      }

      // PATCH /api/users/:id - Partial update
      const patchMatch = path.match(/^\/api\/users\/(\d+)$/);
      if (patchMatch && method === "PATCH") {
        const id = parseInt(patchMatch[1]!);
        const user = users.find(u => u.id === id);
        
        if (!user) {
          return createErrorResponse(
            "USER_NOT_FOUND",
            `User with id ${id} not found`,
            404
          );
        }

        const body = await req.json() as any;
        
        if (body.username) user.username = body.username;
        if (body.email) user.email = body.email;

        return createResponse(user);
      }

      // DELETE /api/users/:id - Delete user
      const deleteMatch = path.match(/^\/api\/users\/(\d+)$/);
      if (deleteMatch && method === "DELETE") {
        const id = parseInt(deleteMatch[1]!);
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) {
          return createErrorResponse(
            "USER_NOT_FOUND",
            `User with id ${id} not found`,
            404
          );
        }

        users.splice(index, 1);
        
        // 204 No Content - successful deletion with no response body
        return new Response(null, { status: 204 });
      }

      return createErrorResponse("NOT_FOUND", "Endpoint not found", 404);

    } catch (error) {
      return createErrorResponse(
        "INTERNAL_ERROR",
        "An internal server error occurred",
        500
      );
    }
  },
});

console.log(`👥 Users API running at http://localhost:${server.port}`);
console.log(`Endpoints:`);
console.log(`  GET    /api/users`);
console.log(`  GET    /api/users/:id`);
console.log(`  POST   /api/users`);
console.log(`  PATCH  /api/users/:id`);
console.log(`  DELETE /api/users/:id`);
