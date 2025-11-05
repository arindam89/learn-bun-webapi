/**
 * LESSON 2: Basic Routing
 * 
 * Concepts covered:
 * - URL parsing and routing
 * - Handling different endpoints
 * - HTTP status codes (200, 404)
 * 
 * Run: bun run 01-basics/02-basic-routing.ts
 * Test: 
 *   curl http://localhost:3000/
 *   curl http://localhost:3000/about
 *   curl http://localhost:3000/contact
 */

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route handling
    if (path === "/") {
      return new Response("Welcome to the Home Page!");
    }
    
    if (path === "/about") {
      return new Response("This is the About Page");
    }
    
    if (path === "/contact") {
      return new Response("Contact us at: hello@example.com");
    }

    // 404 - Not Found
    return new Response("Page not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
