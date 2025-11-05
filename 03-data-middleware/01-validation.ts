/**
 * LESSON 1: Input Validation
 * 
 * Concepts covered:
 * - Request body validation
 * - Type checking
 * - Required fields
 * - Format validation (email, etc.)
 * - Custom validation functions
 * 
 * Run: bun run 03-data-middleware/01-validation.ts
 */

interface CreateUserRequest {
  username: string;
  email: string;
  age?: number;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUser(data: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.username || typeof data.username !== "string") {
    errors.push({ field: "username", message: "Username is required and must be a string" });
  } else if (data.username.length < 3) {
    errors.push({ field: "username", message: "Username must be at least 3 characters" });
  } else if (data.username.length > 20) {
    errors.push({ field: "username", message: "Username must be at most 20 characters" });
  }

  if (!data.email || typeof data.email !== "string") {
    errors.push({ field: "email", message: "Email is required and must be a string" });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  // Optional fields
  if (data.age !== undefined) {
    if (typeof data.age !== "number") {
      errors.push({ field: "age", message: "Age must be a number" });
    } else if (data.age < 0 || data.age > 150) {
      errors.push({ field: "age", message: "Age must be between 0 and 150" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

let users: CreateUserRequest[] = [];

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/users" && req.method === "POST") {
      try {
        const body = await req.json();
        const validation = validateUser(body);

        if (!validation.valid) {
          return Response.json(
            {
              error: "Validation failed",
              details: validation.errors,
            },
            { status: 400 }
          );
        }

        const newUser: CreateUserRequest = {
          username: (body as any).username,
          email: (body as any).email,
          age: (body as any).age,
        };

        users.push(newUser);

        return Response.json(
          {
            message: "User created successfully",
            user: newUser,
          },
          { status: 201 }
        );
      } catch (error) {
        return Response.json(
          { error: "Invalid JSON" },
          { status: 400 }
        );
      }
    }

    if (url.pathname === "/users" && req.method === "GET") {
      return Response.json(users);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`✅ Validation API running at http://localhost:${server.port}`);
console.log(`\nTry these:`);
console.log(`# Valid user`);
console.log(`curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"username":"johndoe","email":"john@example.com","age":25}'`);
console.log(`\n# Invalid - short username`);
console.log(`curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"username":"jo","email":"john@example.com"}'`);
console.log(`\n# Invalid - bad email`);
console.log(`curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"username":"johndoe","email":"notanemail"}'`);
