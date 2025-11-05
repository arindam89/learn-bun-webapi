/**
 * Production Concept 2: API Documentation with OpenAPI
 * 
 * Concepts covered:
 * - OpenAPI/Swagger specification
 * - API documentation structure
 * - Schema definitions
 * - Interactive API documentation
 * 
 * Run: bun run 06-production/02-documentation.ts
 * Then open: http://localhost:3000/docs
 */

// OpenAPI specification
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Sample API",
    version: "1.0.0",
    description: "A sample API demonstrating OpenAPI documentation",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  paths: {
    "/users": {
      get: {
        summary: "List all users",
        tags: ["Users"],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new user",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUser" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get a user by ID",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a user",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "204": {
            description: "User deleted",
          },
          "404": {
            description: "User not found",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateUser: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", minLength: 2, example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          message: { type: "string", example: "Name is required" },
        },
      },
    },
  },
};

// Sample API implementation
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

let users: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date().toISOString(),
  },
];
let nextId = 2;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Serve OpenAPI spec
    if (path === "/openapi.json") {
      return Response.json(openApiSpec);
    }

    // Serve Swagger UI
    if (path === "/docs" || path === "/") {
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = () => {
            SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        };
    </script>
</body>
</html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // API Implementation

    // GET /users
    if (path === "/users" && method === "GET") {
      return Response.json(users);
    }

    // POST /users
    if (path === "/users" && method === "POST") {
      const body = await req.json() as any;

      if (!body.name || !body.email) {
        return Response.json(
          { error: "Validation failed", message: "Name and email are required" },
          { status: 400 }
        );
      }

      const newUser: User = {
        id: nextId++,
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      return Response.json(newUser, { status: 201 });
    }

    // GET /users/:id
    const getMatch = path.match(/^\/users\/(\d+)$/);
    if (getMatch && method === "GET") {
      const id = parseInt(getMatch[1]!);
      const user = users.find(u => u.id === id);

      if (!user) {
        return Response.json(
          { error: "Not found", message: "User not found" },
          { status: 404 }
        );
      }

      return Response.json(user);
    }

    // DELETE /users/:id
    const deleteMatch = path.match(/^\/users\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      const id = parseInt(deleteMatch[1]!);
      const index = users.findIndex(u => u.id === id);

      if (index === -1) {
        return Response.json(
          { error: "Not found" },
          { status: 404 }
        );
      }

      users.splice(index, 1);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`📚 API Documentation Server running at http://localhost:${server.port}`);
console.log(`\nOpen http://localhost:${server.port}/docs to view interactive API documentation`);
console.log(`OpenAPI spec: http://localhost:${server.port}/openapi.json`);
