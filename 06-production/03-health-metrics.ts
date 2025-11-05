/**
 * Production Concept 3: Health Checks and Metrics
 * 
 * Concepts covered:
 * - Health check endpoints
 * - Readiness vs liveness probes
 * - Basic metrics collection
 * - System monitoring
 * - Uptime tracking
 * 
 * Run: bun run 06-production/03-health-metrics.ts
 */

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: "pass" | "fail";
      message?: string;
    };
  };
}

interface Metrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    byMethod: Record<string, number>;
    byPath: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
  };
}

const startTime = Date.now();
const metrics: Metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byMethod: {},
    byPath: {},
  },
  performance: {
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
  },
  system: {
    uptime: 0,
    memory: {
      used: 0,
      total: 0,
    },
  },
};

const responseTimes: number[] = [];

function updateMetrics(method: string, path: string, duration: number, success: boolean) {
  metrics.requests.total++;
  
  if (success) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + 1;

  responseTimes.push(duration);
  if (responseTimes.length > 100) {
    responseTimes.shift();
  }

  metrics.performance.avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  metrics.performance.minResponseTime = Math.min(
    metrics.performance.minResponseTime,
    duration
  );
  metrics.performance.maxResponseTime = Math.max(
    metrics.performance.maxResponseTime,
    duration
  );
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  metrics.system.uptime = Date.now() - startTime;
  metrics.system.memory.used = memUsage.heapUsed;
  metrics.system.memory.total = memUsage.heapTotal;
}

async function performHealthChecks(): Promise<HealthCheck> {
  const checks: HealthCheck["checks"] = {};

  // Check 1: Memory usage
  getSystemMetrics();
  const memoryUsagePercent =
    (metrics.system.memory.used / metrics.system.memory.total) * 100;
  checks.memory = {
    status: memoryUsagePercent < 90 ? "pass" : "fail",
    message: `${memoryUsagePercent.toFixed(2)}% used`,
  };

  // Check 2: Error rate
  const errorRate =
    metrics.requests.total > 0
      ? (metrics.requests.errors / metrics.requests.total) * 100
      : 0;
  checks.errorRate = {
    status: errorRate < 10 ? "pass" : "fail",
    message: `${errorRate.toFixed(2)}% errors`,
  };

  // Check 3: Response time
  checks.responseTime = {
    status: metrics.performance.avgResponseTime < 1000 ? "pass" : "fail",
    message: `${metrics.performance.avgResponseTime.toFixed(2)}ms average`,
  };

  const allPassing = Object.values(checks).every((check) => check.status === "pass");

  return {
    status: allPassing ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: metrics.system.uptime,
    checks,
  };
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const startTime = Date.now();
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // Health check endpoints

      // GET /health - Overall health status
      if (path === "/health") {
        const health = await performHealthChecks();
        const status = health.status === "healthy" ? 200 : 503;
        return Response.json(health, { status });
      }

      // GET /health/live - Liveness probe (is the app running?)
      if (path === "/health/live") {
        return Response.json({
          status: "alive",
          timestamp: new Date().toISOString(),
        });
      }

      // GET /health/ready - Readiness probe (can it serve traffic?)
      if (path === "/health/ready") {
        const health = await performHealthChecks();
        const isReady = health.status === "healthy";
        
        return Response.json(
          {
            status: isReady ? "ready" : "not-ready",
            timestamp: new Date().toISOString(),
          },
          { status: isReady ? 200 : 503 }
        );
      }

      // GET /metrics - Prometheus-style metrics
      if (path === "/metrics") {
        getSystemMetrics();
        return Response.json(metrics);
      }

      // GET /metrics/prometheus - Prometheus text format
      if (path === "/metrics/prometheus") {
        getSystemMetrics();
        const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requests.total}

# HELP http_requests_success Total number of successful HTTP requests
# TYPE http_requests_success counter
http_requests_success ${metrics.requests.success}

# HELP http_requests_errors Total number of failed HTTP requests
# TYPE http_requests_errors counter
http_requests_errors ${metrics.requests.errors}

# HELP http_response_time_avg Average response time in milliseconds
# TYPE http_response_time_avg gauge
http_response_time_avg ${metrics.performance.avgResponseTime}

# HELP http_response_time_min Minimum response time in milliseconds
# TYPE http_response_time_min gauge
http_response_time_min ${metrics.performance.minResponseTime === Infinity ? 0 : metrics.performance.minResponseTime}

# HELP http_response_time_max Maximum response time in milliseconds
# TYPE http_response_time_max gauge
http_response_time_max ${metrics.performance.maxResponseTime}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${metrics.system.uptime / 1000}

# HELP process_heap_bytes Process heap memory in bytes
# TYPE process_heap_bytes gauge
process_heap_bytes ${metrics.system.memory.used}
        `.trim();

        return new Response(prometheusMetrics, {
          headers: { "Content-Type": "text/plain" },
        });
      }

      // Sample API endpoints for testing

      if (path === "/api/fast") {
        return Response.json({ message: "Fast response" });
      }

      if (path === "/api/slow") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return Response.json({ message: "Slow response" });
      }

      if (path === "/api/error") {
        throw new Error("Intentional error");
      }

      if (path === "/") {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Health & Metrics Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .healthy { background: #d4edda; color: #155724; }
        .unhealthy { background: #f8d7da; color: #721c24; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🏥 Health & Metrics Dashboard</h1>
    
    <div class="section">
        <h2>Quick Actions</h2>
        <button onclick="testEndpoint('/api/fast')">Test Fast Endpoint</button>
        <button onclick="testEndpoint('/api/slow')">Test Slow Endpoint</button>
        <button onclick="testEndpoint('/api/error')">Test Error Endpoint</button>
        <button onclick="refreshMetrics()">Refresh Metrics</button>
    </div>

    <div class="section">
        <h2>Health Status</h2>
        <div id="health">Loading...</div>
    </div>

    <div class="section">
        <h2>Metrics</h2>
        <div id="metrics">Loading...</div>
    </div>

    <script>
        async function fetchHealth() {
            const response = await fetch('/health');
            const data = await response.json();
            
            let html = \`<div class="status \${data.status === 'healthy' ? 'healthy' : 'unhealthy'}">\`;
            html += \`Status: \${data.status.toUpperCase()}</div>\`;
            html += \`<p>Uptime: \${(data.uptime / 1000).toFixed(0)}s</p>\`;
            html += '<h3>Checks:</h3><ul>';
            
            for (const [name, check] of Object.entries(data.checks)) {
                html += \`<li><strong>\${name}</strong>: \${check.status} - \${check.message || ''}</li>\`;
            }
            html += '</ul>';
            
            document.getElementById('health').innerHTML = html;
        }

        async function fetchMetrics() {
            const response = await fetch('/metrics');
            const data = await response.json();
            
            let html = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            document.getElementById('metrics').innerHTML = html;
        }

        async function testEndpoint(path) {
            try {
                await fetch(path);
            } catch (e) {
                // Ignore errors
            }
            refreshMetrics();
        }

        async function refreshMetrics() {
            await fetchHealth();
            await fetchMetrics();
        }

        // Initial load
        refreshMetrics();
        
        // Auto-refresh every 5 seconds
        setInterval(refreshMetrics, 5000);
    </script>
</body>
</html>
        `;

        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      const duration = Date.now() - startTime;
      updateMetrics(method, path, duration, true);

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateMetrics(method, path, duration, false);

      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
});

console.log(`🏥 Health & Metrics API running at http://localhost:${server.port}`);
console.log(`\nHealth endpoints:`);
console.log(`  GET /health - Overall health check`);
console.log(`  GET /health/live - Liveness probe`);
console.log(`  GET /health/ready - Readiness probe`);
console.log(`\nMetrics endpoints:`);
console.log(`  GET /metrics - JSON metrics`);
console.log(`  GET /metrics/prometheus - Prometheus format`);
console.log(`\nDashboard: http://localhost:${server.port}/`);
