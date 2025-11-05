/**
 * LESSON 3: HTTP Methods
 * 
 * Concepts covered:
 * - GET, POST, PUT, DELETE methods
 * - Method-based routing
 * - Appropriate status codes for different methods
 * 
 * Run: bun run 01-basics/03-http-methods.ts
 * Test:
 *   curl http://localhost:3000/resource
 *   curl -X POST http://localhost:3000/resource
 *   curl -X PUT http://localhost:3000/resource
 *   curl -X DELETE http://localhost:3000/resource
 */

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/resource") {
      switch (method) {
        case "GET":
          return new Response("Reading resource", { status: 200 });
        
        case "POST":
          return new Response("Resource created", { status: 201 });
        
        case "PUT":
          return new Response("Resource updated", { status: 200 });
        
        case "DELETE":
          return new Response("Resource deleted", { status: 200 });
        
        default:
          return new Response("Method not allowed", { status: 405 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
