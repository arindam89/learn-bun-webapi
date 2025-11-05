# Module 6: Production Concepts

Learn production-ready patterns for deploying and maintaining REST APIs.

## Lessons

### 01 - Structured Logging
**File:** `01-logging.ts`

Implement professional logging for debugging and monitoring.

**Concepts:**
- Log levels (DEBUG, INFO, WARN, ERROR)
- Structured JSON logging
- Request/response logging
- Error logging with stack traces
- Performance tracking
- Request ID correlation

**Run:**
```bash
bun run 06-production/01-logging.ts
```

**Example Usage:**
```bash
# Make some requests and watch the logs
curl http://localhost:3000/counter
curl -X POST http://localhost:3000/increment
curl http://localhost:3000/warn
curl http://localhost:3000/error
```

**Log Output Example:**
```json
{
  "level": "INFO",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "message": "Incoming request",
  "context": {
    "requestId": "uuid-here",
    "method": "POST",
    "path": "/increment",
    "query": {}
  }
}
```

**Production Recommendations:**
- Use a logging service (Datadog, LogDNA, CloudWatch)
- Log to files with rotation
- Include correlation IDs
- Set appropriate log levels per environment
- Sanitize sensitive data (passwords, tokens)
- Aggregate logs from multiple instances

---

### 02 - API Documentation
**File:** `02-documentation.ts`

Generate interactive API documentation with OpenAPI/Swagger.

**Concepts:**
- OpenAPI 3.0 specification
- Schema definitions
- Request/response examples
- Interactive documentation UI
- API versioning
- Tags and grouping

**Run:**
```bash
bun run 06-production/02-documentation.ts
```

**Access:**
- Documentation UI: http://localhost:3000/docs
- OpenAPI Spec: http://localhost:3000/openapi.json

**Features:**
- Try out API endpoints directly
- See request/response schemas
- View example data
- Understand error responses

**Benefits:**
- Self-documenting API
- Easier onboarding
- Client code generation
- Contract testing
- API design validation

**Tools:**
- Swagger UI (used in this example)
- ReDoc (alternative UI)
- Postman (can import OpenAPI spec)
- API client generators

---

### 03 - Health Checks & Metrics
**File:** `03-health-metrics.ts`

Implement health checks and metrics collection for monitoring.

**Concepts:**
- Health check endpoints
- Liveness vs readiness probes
- Metrics collection
- Performance tracking
- System monitoring
- Prometheus compatibility

**Run:**
```bash
bun run 06-production/03-health-metrics.ts
```

**Access:**
- Dashboard: http://localhost:3000/
- Health: http://localhost:3000/health
- Liveness: http://localhost:3000/health/live
- Readiness: http://localhost:3000/health/ready
- Metrics (JSON): http://localhost:3000/metrics
- Metrics (Prometheus): http://localhost:3000/metrics/prometheus

**Health Checks:**
```bash
# Overall health
curl http://localhost:3000/health

# Kubernetes liveness probe
curl http://localhost:3000/health/live

# Kubernetes readiness probe
curl http://localhost:3000/health/ready
```

**Metrics Example:**
```json
{
  "requests": {
    "total": 150,
    "success": 145,
    "errors": 5,
    "byMethod": { "GET": 100, "POST": 50 },
    "byPath": { "/api/users": 75, "/api/posts": 75 }
  },
  "performance": {
    "avgResponseTime": 45.2,
    "minResponseTime": 12,
    "maxResponseTime": 230
  },
  "system": {
    "uptime": 3600000,
    "memory": {
      "used": 50331648,
      "total": 134217728
    }
  }
}
```

**Use Cases:**
- Kubernetes/Docker health checks
- Load balancer health checks
- Monitoring dashboards (Grafana)
- Alerting systems
- Auto-scaling decisions

---

## Production Checklist

### Security
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Sanitize error messages
- [ ] Use environment variables for secrets
- [ ] Implement CORS properly
- [ ] Add security headers (Helmet.js equivalent)
- [ ] Keep dependencies updated

### Performance
- [ ] Enable compression (gzip/brotli)
- [ ] Implement caching strategies
- [ ] Use connection pooling
- [ ] Optimize database queries
- [ ] Add pagination to large datasets
- [ ] Use CDN for static assets
- [ ] Monitor response times

### Reliability
- [ ] Implement health checks
- [ ] Add graceful shutdown
- [ ] Use circuit breakers
- [ ] Implement retry logic
- [ ] Handle timeouts properly
- [ ] Add request timeouts
- [ ] Test failure scenarios

### Observability
- [ ] Structured logging
- [ ] Request correlation IDs
- [ ] Metrics collection
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring (APM)
- [ ] Distributed tracing
- [ ] Alerting setup

### Documentation
- [ ] API documentation (OpenAPI)
- [ ] README with setup instructions
- [ ] Architecture documentation
- [ ] Deployment guides
- [ ] Runbooks for common issues
- [ ] API versioning strategy
- [ ] Changelog

### Deployment
- [ ] Environment configuration
- [ ] Database migrations
- [ ] Zero-downtime deployment
- [ ] Rollback strategy
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Container orchestration

## Deployment Platforms

### Cloud Platforms
1. **Fly.io** - Easy Bun deployment
2. **Railway** - Simple deploy from Git
3. **Render** - Zero-config deploys
4. **AWS** - Full control, more complex
5. **Google Cloud Run** - Serverless containers
6. **Azure Container Apps** - Managed containers

### Example: Deploy to Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

### Example: Dockerfile
```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health/live || exit 1

# Run
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
```

## Monitoring Tools

### Application Performance Monitoring (APM)
- New Relic
- Datadog
- AppDynamics
- Dynatrace

### Error Tracking
- Sentry
- Rollbar
- Bugsnag

### Logging
- Datadog Logs
- CloudWatch Logs
- LogDNA
- Papertrail

### Metrics & Dashboards
- Prometheus + Grafana
- Datadog
- New Relic
- CloudWatch

## Best Practices Summary

1. **Always log important events** with context
2. **Document your API** thoroughly
3. **Monitor everything** - health, metrics, errors
4. **Test in production-like environments**
5. **Plan for failure** - everything will fail eventually
6. **Keep secrets out of code** - use environment variables
7. **Version your API** - /api/v1, /api/v2
8. **Implement graceful degradation**
9. **Use feature flags** for safer deploys
10. **Automate everything** - testing, deployment, monitoring

## Next Steps

You've completed all 6 modules! Here's what to do next:

1. **Build a real project** - Apply what you learned
2. **Add a database** - PostgreSQL, MySQL, or MongoDB
3. **Implement authentication** - OAuth, JWT, sessions
4. **Write tests** - Unit, integration, and E2E tests
5. **Set up CI/CD** - GitHub Actions, GitLab CI, etc.
6. **Deploy to production** - Choose a platform and deploy
7. **Monitor and iterate** - Use the production tools you learned

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [REST API Best Practices](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [The Twelve-Factor App](https://12factor.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)
