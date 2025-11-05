/**
 * Module 9: Security - Input Sanitization & Injection Prevention
 * 
 * Learn to prevent common injection attacks including SQL injection, XSS, and command injection.
 * 
 * Key Concepts:
 * - SQL injection prevention
 * - XSS (Cross-Site Scripting) prevention
 * - Command injection prevention
 * - Input validation and sanitization
 * - Parameterized queries
 * - Output encoding
 * 
 * OWASP Top 10:
 * - A03:2021 - Injection
 * 
 * Run: bun run 09-security/01-injection-prevention.ts
 * Test:
 *   # Safe queries
 *   curl "http://localhost:3000/users?name=John"
 *   
 *   # SQL injection attempts (blocked)
 *   curl "http://localhost:3000/users-unsafe?name=John';DROP TABLE users;--"
 *   curl "http://localhost:3000/users-safe?name=John';DROP TABLE users;--"
 *   
 *   # XSS attempts (sanitized)
 *   curl -X POST http://localhost:3000/comments -H "Content-Type: application/json" -d '{"text":"<script>alert(\"XSS\")</script>"}'
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// SQL Injection Prevention
// ============================================================================

// Simulated in-memory "database"
const users = [
  { id: 1, username: 'john', email: 'john@example.com', role: 'user' },
  { id: 2, username: 'admin', email: 'admin@example.com', role: 'admin' },
  { id: 3, username: 'alice', email: 'alice@example.com', role: 'user' }
];

// UNSAFE: String concatenation (vulnerable to SQL injection)
app.get('/users-unsafe', (c) => {
  const name = c.req.query('name') || '';
  
  // This simulates: SELECT * FROM users WHERE username = '${name}'
  // Attack: name = "'; DROP TABLE users; --"
  const unsafeQuery = `SELECT * FROM users WHERE username = '${name}'`;
  
  console.log('[UNSAFE QUERY]', unsafeQuery);
  
  // If this were a real database, the injection would execute!
  return c.json({
    warning: 'THIS IS VULNERABLE TO SQL INJECTION!',
    query: unsafeQuery,
    danger: 'Never use string concatenation for SQL queries',
    exploit: "Try: ?name='; DROP TABLE users; --"
  }, 200);
});

// SAFE: Parameterized queries (prevents SQL injection)
app.get('/users-safe', (c) => {
  const name = c.req.query('name') || '';
  
  // This simulates: db.query('SELECT * FROM users WHERE username = ?', [name])
  // The parameter is escaped and treated as data, not code
  
  // Manual escaping for demonstration
  const safeName = name.replace(/'/g, "''"); // Escape single quotes
  
  // Filter users (simulating parameterized query)
  const filtered = users.filter(u => u.username === name);
  
  return c.json({
    users: filtered,
    message: 'Safe parameterized query used',
    queryPattern: 'SELECT * FROM users WHERE username = ?',
    parameters: [name],
    note: 'Input is treated as data, not executable code'
  });
});

// Input validation for additional safety
function validateUsername(username: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z0-9_]+$/.test(username);
}

app.get('/users-validated', (c) => {
  const name = c.req.query('name') || '';
  
  if (!validateUsername(name)) {
    return c.json({
      error: 'Invalid username format',
      message: 'Username can only contain letters, numbers, and underscores',
      provided: name
    }, 400);
  }
  
  const filtered = users.filter(u => u.username === name);
  
  return c.json({
    users: filtered,
    message: 'Input validated and safe'
  });
});

// ============================================================================
// XSS (Cross-Site Scripting) Prevention
// ============================================================================

interface Comment {
  id: string;
  text: string;
  sanitizedText: string;
  createdAt: string;
}

const comments: Comment[] = [];

// HTML entity encoding to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'\/]/g, (char) => map[char] || char);
}

// Remove dangerous HTML/JavaScript
function sanitizeInput(text: string): string {
  // Remove script tags
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Escape remaining HTML
  return escapeHtml(sanitized);
}

app.post('/comments', async (c) => {
  const body = await c.req.json();
  const text = body.text || '';
  
  const comment: Comment = {
    id: crypto.randomUUID(),
    text: text, // Original (dangerous!)
    sanitizedText: sanitizeInput(text), // Safe for display
    createdAt: new Date().toISOString()
  };
  
  comments.push(comment);
  
  return c.json({
    comment: {
      id: comment.id,
      // Only return sanitized version
      text: comment.sanitizedText,
      createdAt: comment.createdAt
    },
    security: {
      original: text,
      sanitized: comment.sanitizedText,
      xssAttemptDetected: text !== comment.sanitizedText
    }
  }, 201);
});

app.get('/comments', (c) => {
  return c.json({
    comments: comments.map(c => ({
      id: c.id,
      text: c.sanitizedText, // Always return sanitized
      createdAt: c.createdAt
    }))
  });
});

// ============================================================================
// Command Injection Prevention
// ============================================================================

// UNSAFE: Command injection vulnerability
app.post('/ping-unsafe', async (c) => {
  const body = await c.req.json();
  const host = body.host || '';
  
  // NEVER DO THIS: Executing shell commands with user input
  const dangerousCommand = `ping -c 1 ${host}`;
  
  return c.json({
    warning: 'COMMAND INJECTION VULNERABILITY!',
    command: dangerousCommand,
    danger: 'Attacker could run: host="; rm -rf /"',
    note: 'This endpoint does NOT execute the command (demonstration only)'
  }, 200);
});

// SAFE: Input validation for command parameters
function isValidHostname(host: string): boolean {
  // Only allow valid hostname/IP patterns
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  return hostnameRegex.test(host) || ipRegex.test(host);
}

app.post('/ping-safe', async (c) => {
  const body = await c.req.json();
  const host = body.host || '';
  
  if (!isValidHostname(host)) {
    return c.json({
      error: 'Invalid hostname',
      message: 'Hostname must be valid domain or IP address',
      provided: host
    }, 400);
  }
  
  // In production, use allowlist of allowed hosts
  const allowedHosts = ['example.com', '8.8.8.8', 'localhost'];
  
  if (!allowedHosts.includes(host)) {
    return c.json({
      error: 'Host not allowed',
      message: 'Only specific hosts can be pinged',
      allowedHosts
    }, 403);
  }
  
  return c.json({
    message: 'Safe command execution (simulated)',
    host,
    note: 'Input validated against allowlist'
  });
});

// ============================================================================
// Path Traversal Prevention
// ============================================================================

// UNSAFE: Path traversal vulnerability
app.get('/files-unsafe/:filename', (c) => {
  const filename = c.req.param('filename');
  
  // DANGEROUS: Attacker could use "../../../etc/passwd"
  const unsafePath = `/var/www/files/${filename}`;
  
  return c.json({
    warning: 'PATH TRAVERSAL VULNERABILITY!',
    path: unsafePath,
    danger: 'Attacker could access: ../../../../etc/passwd',
    note: 'This endpoint does NOT read files (demonstration only)'
  });
});

// SAFE: Path traversal prevention
function sanitizeFilename(filename: string): string | null {
  // Remove path separators
  const sanitized = filename.replace(/[\/\\]/g, '');
  
  // Remove parent directory references
  if (sanitized.includes('..')) {
    return null;
  }
  
  // Only allow alphanumeric, dash, underscore, and dot
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

app.get('/files-safe/:filename', (c) => {
  const filename = c.req.param('filename');
  const sanitized = sanitizeFilename(filename);
  
  if (!sanitized) {
    return c.json({
      error: 'Invalid filename',
      message: 'Filename contains invalid characters or path traversal attempt',
      provided: filename
    }, 400);
  }
  
  // Safe path construction
  const safePath = `/var/www/files/${sanitized}`;
  
  return c.json({
    message: 'Safe file access (simulated)',
    requestedFile: filename,
    sanitizedFile: sanitized,
    safePath
  });
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Injection Prevention Examples',
    endpoints: {
      sqlInjection: {
        unsafe: 'GET /users-unsafe?name=...',
        safe: 'GET /users-safe?name=...',
        validated: 'GET /users-validated?name=...'
      },
      xss: {
        create: 'POST /comments {"text": "..."}',
        list: 'GET /comments'
      },
      commandInjection: {
        unsafe: 'POST /ping-unsafe {"host": "..."}',
        safe: 'POST /ping-safe {"host": "..."}'
      },
      pathTraversal: {
        unsafe: 'GET /files-unsafe/:filename',
        safe: 'GET /files-safe/:filename'
      }
    },
    defenses: [
      'Use parameterized queries (never string concatenation)',
      'Escape/sanitize all user input before output',
      'Validate input against allowlists',
      'Use secure APIs instead of shell commands',
      'Sanitize filenames and prevent path traversal',
      'Apply principle of least privilege'
    ]
  });
});

console.log('🛡️  Injection Prevention server running on http://localhost:3000');
console.log('\nTest SQL injection:');
console.log("  curl \"http://localhost:3000/users-unsafe?name=admin'; DROP TABLE users;--\"");
console.log('  curl "http://localhost:3000/users-safe?name=admin"');
console.log('\nTest XSS:');
console.log('  curl -X POST http://localhost:3000/comments -H "Content-Type: application/json" -d \'{"text":"<script>alert(\\"XSS\\")</script>"}\'');

export default app;
