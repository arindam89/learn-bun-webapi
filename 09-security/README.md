# Module 9: Security

## Overview

This module covers essential security practices for building secure web APIs. Learn to defend against common attacks including injection, XSS, CSRF, DDoS, and implement proper authentication and authorization.

## Files in This Module

### 1. `01-injection-prevention.ts`
**Preventing injection attacks**

**Concepts:**
- SQL injection prevention
- XSS (Cross-Site Scripting) prevention
- Command injection prevention
- Path traversal prevention
- Input validation and sanitization
- Output encoding

**Defenses:**
- Parameterized queries (never string concatenation)
- HTML entity encoding
- Input allowlisting
- Filename sanitization

### 2. `02-password-security.ts`
**Secure password handling**

**Concepts:**
- Password hashing (bcrypt)
- Salt generation (automatic with bcrypt)
- Timing-safe comparison
- Password strength validation
- Secure token generation
- Password reset flows

**Best Practices:**
- Use bcrypt/argon2/scrypt (not MD5/SHA1)
- Cost factor of 12+ for bcrypt
- Enforce strong password requirements
- Prevent timing attacks

### 3. `03-csrf-cors-headers.ts`
**CSRF, CORS, and security headers**

**Concepts:**
- CSRF token generation and validation
- Double-submit cookie pattern
- CORS configuration
- Security headers (CSP, HSTS, etc.)
- Same-origin policy

**Headers Implemented:**
- Content-Security-Policy
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 4. `04-ddos-protection.ts`
**DDoS mitigation and rate limiting**

**Concepts:**
- IP blocklisting/allowlisting
- Advanced rate limiting (per-IP, per-endpoint)
- Request size limits
- Connection timeouts (slowloris protection)
- Security event monitoring
- Exponential backoff

## Key Takeaways

### SQL Injection Prevention

**❌ Vulnerable (NEVER DO THIS):**
```typescript
const query = `SELECT * FROM users WHERE username = '${username}'`;
// Attack: username = "'; DROP TABLE users; --"
```

**✅ Safe (Parameterized Query):**
```typescript
const query = db.prepare('SELECT * FROM users WHERE username = ?');
const results = query.all(username);
// Input is escaped and treated as data, not code
```

### XSS Prevention

**❌ Dangerous:**
```typescript
app.get('/comment/:id', (c) => {
  const comment = getComment(id);
  return c.html(`<p>${comment.text}</p>`); // XSS!
});
```

**✅ Safe:**
```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.get('/comment/:id', (c) => {
  const comment = getComment(id);
  return c.html(`<p>${escapeHtml(comment.text)}</p>`);
});
```

### Password Security

**✅ Proper Implementation:**
```typescript
// Hashing
const hash = await Bun.password.hash(password, {
  algorithm: "bcrypt",
  cost: 12
});

// Verification (timing-safe)
const isValid = await Bun.password.verify(password, hash);
```

**Password Requirements:**
- Minimum 8 characters
- Uppercase + lowercase + numbers + symbols
- No common passwords
- Optional: check against breach databases (Have I Been Pwned)

### CSRF Protection

**Token-Based:**
```typescript
// 1. Generate token
const csrfToken = generateSecureToken();

// 2. Send to client
return c.json({ csrfToken });

// 3. Verify on state-changing requests
const token = c.req.header('X-CSRF-Token');
if (!isValidToken(token)) {
  return c.json({ error: 'CSRF validation failed' }, 403);
}
```

**Double-Submit Cookie:**
```typescript
// 1. Set token in cookie
c.header('Set-Cookie', `csrf=${token}; HttpOnly; Secure; SameSite=Strict`);

// 2. Require same token in header
const cookieToken = getCookieToken(c);
const headerToken = c.req.header('X-CSRF-Token');

if (cookieToken !== headerToken) {
  return c.json({ error: 'CSRF validation failed' }, 403);
}
```

### CORS Configuration

**Strict (Recommended):**
```typescript
cors({
  origin: ['https://example.com'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})
```

**Permissive (Public APIs only):**
```typescript
cors({
  origin: '*',
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type']
})
```

### Security Headers

```typescript
// Content Security Policy
'Content-Security-Policy': "default-src 'self'; script-src 'self'"

// Force HTTPS
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'

// Prevent clickjacking
'X-Frame-Options': 'DENY'

// Prevent MIME sniffing
'X-Content-Type-Options': 'nosniff'
```

### Rate Limiting

```typescript
class RateLimiter {
  isAllowed(ip: string): boolean {
    const requests = this.getRequests(ip);
    const recentRequests = requests.filter(
      ts => Date.now() - ts < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    this.recordRequest(ip);
    return true;
  }
}
```

## OWASP Top 10 Coverage

### A01 - Broken Access Control
- ✅ Proper authentication checks
- ✅ Role-based access control (RBAC)
- ✅ Resource ownership validation

### A02 - Cryptographic Failures
- ✅ Strong password hashing (bcrypt)
- ✅ Secure token generation
- ✅ HTTPS enforcement (HSTS header)

### A03 - Injection
- ✅ Parameterized queries
- ✅ Input validation
- ✅ Output encoding
- ✅ Command injection prevention

### A04 - Insecure Design
- ✅ Rate limiting
- ✅ Security headers
- ✅ Defense in depth

### A05 - Security Misconfiguration
- ✅ Secure default configurations
- ✅ Security headers
- ✅ CORS policies

### A07 - Identification and Authentication Failures
- ✅ Strong password requirements
- ✅ Secure session management
- ✅ Multi-factor authentication ready

### A08 - Software and Data Integrity Failures
- ✅ Input validation
- ✅ CSRF protection
- ✅ Secure dependencies

### A09 - Security Logging and Monitoring Failures
- ✅ Security event logging
- ✅ Failed login tracking
- ✅ Anomaly detection

## Best Practices Checklist

### Input Validation
- ✅ Validate all user input
- ✅ Use allowlists, not blocklists
- ✅ Validate on server-side (client-side is bypassable)
- ✅ Reject invalid input, don't try to "fix" it

### Authentication & Sessions
- ✅ Use bcrypt/argon2 for password hashing
- ✅ Implement rate limiting on login endpoints
- ✅ Use secure, HTTP-only cookies for sessions
- ✅ Implement account lockout after failed attempts
- ✅ Require re-authentication for sensitive operations

### API Security
- ✅ Implement CORS correctly
- ✅ Require CSRF tokens for state-changing operations
- ✅ Use HTTPS everywhere
- ✅ Rate limit all endpoints
- ✅ Validate Content-Type headers

### Data Protection
- ✅ Never log sensitive data (passwords, tokens)
- ✅ Encrypt data at rest and in transit
- ✅ Use parameterized queries
- ✅ Sanitize output to prevent XSS

### Error Handling
- ✅ Don't leak sensitive information in errors
- ✅ Use generic error messages for auth failures
- ✅ Log detailed errors server-side
- ✅ Return appropriate HTTP status codes

## Common Vulnerabilities to Avoid

### 1. SQL Injection
```typescript
// ❌ Bad
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good
const query = db.prepare('SELECT * FROM users WHERE id = ?');
query.get(userId);
```

### 2. XSS
```typescript
// ❌ Bad
return `<div>${userInput}</div>`;

// ✅ Good
return `<div>${escapeHtml(userInput)}</div>`;
```

### 3. Hardcoded Secrets
```typescript
// ❌ Bad
const apiKey = 'sk_live_12345';

// ✅ Good
const apiKey = process.env.API_KEY;
```

### 4. Weak Password Hashing
```typescript
// ❌ Bad
const hash = md5(password);

// ✅ Good
const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
```

### 5. Missing Rate Limiting
```typescript
// ❌ Bad
app.post('/login', handleLogin);

// ✅ Good
app.post('/login', rateLimiter(5, 300000), handleLogin);
```

## Security Testing

### Manual Testing
```bash
# SQL Injection
curl "http://localhost:3000/users?name=admin'; DROP TABLE users;--"

# XSS
curl -X POST http://localhost:3000/comments \
  -d '{"text":"<script>alert(\"XSS\")</script>"}'

# CSRF
curl -X POST http://localhost:3000/transfer \
  -d '{"amount":1000}' # Should fail without CSRF token

# Rate Limiting
for i in {1..100}; do curl http://localhost:3000/api/data; done
```

### Automated Tools
- **OWASP ZAP** - Web application security scanner
- **Burp Suite** - Security testing platform
- **SQLMap** - SQL injection testing
- **Nikto** - Web server scanner

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Bun Security Best Practices](https://bun.sh/docs)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Have I Been Pwned](https://haveibeenpwned.com/)

---

**Remember:** Security is a continuous process, not a one-time implementation. Stay updated on new vulnerabilities and best practices!
