/**
 * LESSON 4: JSON Responses
 * 
 * Concepts covered:
 * - Returning JSON data
 * - Setting Content-Type headers
 * - Structuring API responses
 * 
 * Run: bun run 01-basics/04-json-responses.ts
 * Test:
 *   curl http://localhost:3000/user
 *   curl http://localhost:3000/users
 */

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/user") {
      const user = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "developer"
      };
      
      return Response.json(user);
    }

    if (url.pathname === "/users") {
      const users = [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob@example.com" }
      ];
      
      return Response.json(users);
    }

    return Response.json(
      { error: "Not found", message: "The requested endpoint does not exist" },
      { status: 404 }
    );
  },
});

console.log(`Server running at http://localhost:${server.port}`);
