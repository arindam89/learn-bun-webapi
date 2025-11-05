/**
 * LESSON 3: Middleware Pattern
 * 
 * Concepts covered:
 * - Middleware functions
 * - Request/response interceptors
 * - CORS handling
 * - Request logging
 * - Composing middleware
 * 
 * Run: bun run 03-data-middleware/03-middleware.ts
 */

type Handler = (req: Request) => Response | Promise<Response>;
type Middleware = (req: Request, next: Handler) => Response | Promise<Response>;

// Middleware: Logger
const logger: Middleware = async (req, next) => {
  const start = Date.now();
  const url = new URL(req.url);
  
  console.log(`→ ${req.method} ${url.pathname}`);
  
  const response = await next(req);
  
  const duration = Date.now() - start;
  console.log(`← ${req.method} ${url.pathname} ${response.status} (${duration}ms)`);
  
  return response;
};

// Middleware: CORS
const cors: Middleware = async (req, next) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const response = await next(req);
  
  // Add CORS headers to response
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// Middleware: Request ID
const requestId: Middleware = async (req, next) => {
  const id = crypto.randomUUID();
  
  // In a real app, you'd attach this to the request context
  console.log(`Request ID: ${id}`);
  
  const response = await next(req);
  
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", id);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// Middleware: Rate limiting (simple in-memory version)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (maxRequests: number, windowMs: number): Middleware => {
  return async (req, next) => {
    const clientId = req.headers.get("X-Client-ID") || "anonymous";
    const now = Date.now();
    
    const record = rateLimitMap.get(clientId);
    
    if (!record || now > record.resetAt) {
      rateLimitMap.set(clientId, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next(req);
    }
    
    if (record.count >= maxRequests) {
      return Response.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
    
    record.count++;
    return next(req);
  };
};

// Compose middleware
function compose(...middlewares: Middleware[]): Middleware {
  return (req, handler) => {
    let index = 0;

    const dispatch = (i: number): Response | Promise<Response> => {
      if (i >= middlewares.length) {
        return handler(req);
      }

      const middleware = middlewares[i]!;
      return middleware(req, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}

// Application handler
const appHandler: Handler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return Response.json({ message: "Hello with middleware!" });
  }

  if (url.pathname === "/data") {
    return Response.json({ data: [1, 2, 3, 4, 5] });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

// Combine all middleware
const middleware = compose(
  logger,
  cors,
  requestId,
  rateLimit(10, 60000) // 10 requests per minute
);

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return middleware(req, appHandler);
  },
});

console.log(`⚙️  Middleware API running at http://localhost:${server.port}`);
console.log(`\nMiddleware enabled:`);
console.log(`  ✓ Request logging`);
console.log(`  ✓ CORS headers`);
console.log(`  ✓ Request ID tracking`);
console.log(`  ✓ Rate limiting (10 req/min)`);
console.log(`\nTry: curl http://localhost:3000/data`);
