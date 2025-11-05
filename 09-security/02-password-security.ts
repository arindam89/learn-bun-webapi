/**
 * Module 9: Security - Password Hashing & Authentication
 * 
 * Secure password storage and authentication best practices.
 * 
 * Key Concepts:
 * - Password hashing (bcrypt, argon2, scrypt)
 * - Salt generation
 * - Hash comparison
 * - Password strength validation
 * - Timing attack prevention
 * 
 * Run: bun run 09-security/02-password-security.ts
 * Test:
 *   curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"username":"alice","password":"SecurePass123!"}'
 *   curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"username":"alice","password":"SecurePass123!"}'
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Password Hashing with Bun's built-in crypto
// ============================================================================

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

const users = new Map<string, User>();

// Hash password using Bun.password (uses bcrypt)
async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 12 // Higher = more secure but slower
  });
}

// Verify password against hash (timing-safe)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  // Check against common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Register endpoint
app.post('/register', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }
  
  // Check if user exists
  if (users.has(username)) {
    return c.json({ error: 'Username already exists' }, 409);
  }
  
  // Validate password strength
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return c.json({
      error: 'Weak password',
      requirements: validation.errors
    }, 400);
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  
  users.set(username, user);
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    },
    note: 'Password securely hashed with bcrypt'
  }, 201);
});

// Login endpoint
app.post('/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }
  
  const user = users.get(username);
  
  // Timing-safe comparison (always hash even if user doesn't exist)
  const isValid = user 
    ? await verifyPassword(password, user.passwordHash)
    : await Bun.password.hash(password).then(() => false); // Prevent timing attacks
  
  if (!isValid) {
    return c.json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
    }, 401);
  }
  
  return c.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user!.id,
      username: user!.username
    }
  });
});

// ============================================================================
// Password Reset Token Generation
// ============================================================================

interface ResetToken {
  userId: string;
  token: string;
  expiresAt: number;
}

const resetTokens = new Map<string, ResetToken>();

function generateSecureToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

app.post('/forgot-password', (c) => {
  const body: any = c.req.json();
  const { username } = body;
  
  const user = users.get(username);
  
  // Always return success (don't leak if user exists)
  if (!user) {
    return c.json({
      message: 'If user exists, reset email will be sent'
    });
  }
  
  const token = generateSecureToken();
  
  resetTokens.set(token, {
    userId: user.id,
    token,
    expiresAt: Date.now() + 3600000 // 1 hour
  });
  
  return c.json({
    message: 'If user exists, reset email will be sent',
    // In production, send email. For demo:
    resetLink: `http://localhost:3000/reset-password?token=${token}`
  });
});

app.post('/reset-password', async (c) => {
  const body = await c.req.json();
  const { token, newPassword } = body;
  
  const resetToken = resetTokens.get(token);
  
  if (!resetToken || Date.now() > resetToken.expiresAt) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }
  
  // Validate new password
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return c.json({
      error: 'Weak password',
      requirements: validation.errors
    }, 400);
  }
  
  // Find user and update password
  const user = Array.from(users.values()).find(u => u.id === resetToken.userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  user.passwordHash = await hashPassword(newPassword);
  
  // Invalidate token
  resetTokens.delete(token);
  
  return c.json({
    success: true,
    message: 'Password reset successful'
  });
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Password Security Examples',
    endpoints: {
      register: 'POST /register {"username": "...", "password": "..."}',
      login: 'POST /login {"username": "...", "password": "..."}',
      forgotPassword: 'POST /forgot-password {"username": "..."}',
      resetPassword: 'POST /reset-password {"token": "...", "newPassword": "..."}'
    },
    security: {
      hashing: 'bcrypt with cost factor 12',
      validation: 'Enforces strong password requirements',
      timing: 'Timing-attack resistant login',
      tokens: 'Cryptographically secure reset tokens'
    },
    passwordRequirements: [
      'At least 8 characters',
      'Lowercase letter',
      'Uppercase letter',
      'Number',
      'Special character',
      'Not a common password'
    ]
  });
});

console.log('🔐 Password Security server running on http://localhost:3000');
console.log('\nTest registration:');
console.log('  curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d \'{"username":"alice","password":"SecurePass123!"}\'');

export default app;
