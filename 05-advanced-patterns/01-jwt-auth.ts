/**
 * Advanced Pattern 1: JWT Authentication
 * 
 * Concepts covered:
 * - User registration and login
 * - Password hashing
 * - JWT token generation
 * - Protected routes
 * - Authorization headers
 * 
 * Run: bun run 05-advanced-patterns/01-jwt-auth.ts
 * 
 * Note: This is a simplified example. In production:
 * - Use a proper secret management system
 * - Store tokens securely (httpOnly cookies)
 * - Implement refresh tokens
 * - Use environment variables for secrets
 */

interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

// Simple in-memory users (use a database in production)
let users: User[] = [];
let nextUserId = 1;

const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = 3600; // 1 hour in seconds

// Simple password hashing (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(password);
  return hasher.digest("hex");
}

// Simple JWT encoding (use a library like jose in production)
function createJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRY,
  };
  
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data = btoa(JSON.stringify(fullPayload));
  const signature = btoa(
    new Bun.CryptoHasher("sha256")
      .update(`${header}.${data}.${JWT_SECRET}`)
      .digest("hex")
  );
  
  return `${header}.${data}.${signature}`;
}

// Verify and decode JWT
function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, data, signature] = parts;
    
    // Verify signature
    const expectedSig = btoa(
      new Bun.CryptoHasher("sha256")
        .update(`${header}.${data}.${JWT_SECRET}`)
        .digest("hex")
    );
    
    if (signature !== expectedSig) return null;

    const payload: JWTPayload = JSON.parse(atob(data!));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// Extract token from Authorization header
function extractToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.substring(7);
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // Public routes
      
      // POST /register
      if (path === "/register" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.username || !body.email || !body.password) {
          return Response.json(
            { error: "Username, email, and password are required" },
            { status: 400 }
          );
        }

        if (body.password.length < 6) {
          return Response.json(
            { error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }

        // Check if user already exists
        if (users.find(u => u.email === body.email)) {
          return Response.json(
            { error: "User with this email already exists" },
            { status: 409 }
          );
        }

        const passwordHash = await hashPassword(body.password);
        
        const newUser: User = {
          id: nextUserId++,
          username: body.username,
          email: body.email,
          passwordHash,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);

        const token = createJWT({
          userId: newUser.id,
          username: newUser.username,
        });

        return Response.json({
          message: "User registered successfully",
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          },
        }, { status: 201 });
      }

      // POST /login
      if (path === "/login" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.email || !body.password) {
          return Response.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }

        const user = users.find(u => u.email === body.email);
        if (!user) {
          return Response.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        const passwordHash = await hashPassword(body.password);
        if (passwordHash !== user.passwordHash) {
          return Response.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        const token = createJWT({
          userId: user.id,
          username: user.username,
        });

        return Response.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      }

      // Protected routes (require authentication)

      const token = extractToken(req);
      if (!token) {
        return Response.json(
          { error: "No token provided" },
          { status: 401 }
        );
      }

      const payload = verifyJWT(token);
      if (!payload) {
        return Response.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      // GET /profile - Get current user profile
      if (path === "/profile" && method === "GET") {
        const user = users.find(u => u.id === payload.userId);
        if (!user) {
          return Response.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        return Response.json({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        });
      }

      // PATCH /profile - Update current user profile
      if (path === "/profile" && method === "PATCH") {
        const user = users.find(u => u.id === payload.userId);
        if (!user) {
          return Response.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const body = await req.json() as any;

        if (body.username) user.username = body.username;
        if (body.email) user.email = body.email;

        return Response.json({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        });
      }

      // GET /protected - Example protected endpoint
      if (path === "/protected" && method === "GET") {
        return Response.json({
          message: "This is a protected route",
          user: {
            id: payload.userId,
            username: payload.username,
          },
        });
      }

      return Response.json({ error: "Not found" }, { status: 404 });

    } catch (error) {
      console.error("Error:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
});

console.log(`🔐 JWT Auth API running at http://localhost:${server.port}`);
console.log(`\nPublic endpoints:`);
console.log(`  POST /register`);
console.log(`  POST /login`);
console.log(`\nProtected endpoints (require Bearer token):`);
console.log(`  GET  /profile`);
console.log(`  PATCH /profile`);
console.log(`  GET  /protected`);
console.log(`\nExample flow:`);
console.log(`1. Register: curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"username":"john","email":"john@example.com","password":"secret123"}'`);
console.log(`2. Save the token from the response`);
console.log(`3. Access protected route: curl http://localhost:3000/profile -H "Authorization: Bearer YOUR_TOKEN"`);
