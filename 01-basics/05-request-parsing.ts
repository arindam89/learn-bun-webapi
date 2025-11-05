/**
 * LESSON 5: Request Parsing
 * 
 * Concepts covered:
 * - Reading request body (JSON)
 * - URL query parameters
 * - Request headers
 * 
 * Run: bun run 01-basics/05-request-parsing.ts
 * Test:
 *   curl "http://localhost:3000/greet?name=Alice"
 *   curl -X POST http://localhost:3000/echo -H "Content-Type: application/json" -d '{"message": "Hello World"}'
 *   curl http://localhost:3000/headers -H "X-Custom-Header: MyValue"
 */

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Query parameters
    if (url.pathname === "/greet") {
      const name = url.searchParams.get("name") || "Guest";
      return Response.json({ greeting: `Hello, ${name}!` });
    }

    // Request body (JSON)
    if (url.pathname === "/echo" && req.method === "POST") {
      try {
        const body = await req.json();
        return Response.json({
          received: body,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json(
          { error: "Invalid JSON" },
          { status: 400 }
        );
      }
    }

    // Request headers
    if (url.pathname === "/headers") {
      const customHeader = req.headers.get("X-Custom-Header");
      return Response.json({
        userAgent: req.headers.get("User-Agent"),
        customHeader: customHeader || "Not provided",
        contentType: req.headers.get("Content-Type")
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
