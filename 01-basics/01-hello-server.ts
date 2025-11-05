/**
 * LESSON 1: Your First HTTP Server
 * 
 * Concepts covered:
 * - Creating a basic HTTP server with Bun
 * - Understanding Request and Response
 * - Returning plain text responses
 * 
 * Run: bun run 01-basics/01-hello-server.ts
 * Test: curl http://localhost:3000
 */

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello from Bun! 🚀");
  },
});

console.log(`Server running at http://localhost:${server.port}`);
