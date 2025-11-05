/**
 * Module 8: Concurrency & Reliability - Circuit Breaker & Load Testing
 * 
 * Implement circuit breaker pattern and demonstrate load testing.
 * 
 * Key Concepts:
 * - Circuit breaker states (Closed, Open, Half-Open)
 * - Failure threshold tracking
 * - Automatic recovery
 * - Load testing with concurrent requests
 * 
 * Run: bun run 08-concurrency-reliability/05-circuit-breaker.ts
 * Test:
 *   curl http://localhost:3000/external-api/stable
 *   curl http://localhost:3000/external-api/unstable  # Triggers failures
 *   curl http://localhost:3000/circuit/status
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 60s
    private halfOpenRequests: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      this.state = 'HALF_OPEN';
      this.successes = 0;
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      
      if (this.successes >= this.halfOpenRequests) {
        this.state = 'CLOSED';
        console.log('[Circuit Breaker] Recovered - state: CLOSED');
      }
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('[Circuit Breaker] Failed during HALF_OPEN - state: OPEN');
      return;
    }
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`[Circuit Breaker] Threshold reached (${this.failures}) - state: OPEN`);
    }
  }
  
  getState(): { state: CircuitState; failures: number; nextAttempt: number } {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt
    };
  }
  
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
  }
}

const externalApiCircuit = new CircuitBreaker(3, 30000, 2); // 3 failures, 30s timeout, 2 successes to recover

// Simulate external API
async function callExternalAPI(mode: 'stable' | 'unstable'): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (mode === 'unstable' && Math.random() > 0.3) {
    throw new Error('External API failed');
  }
  
  return { data: 'Success from external API' };
}

app.get('/external-api/:mode', async (c) => {
  const mode = c.req.param('mode') as 'stable' | 'unstable';
  
  try {
    const result = await externalApiCircuit.execute(() => callExternalAPI(mode));
    
    return c.json({
      success: true,
      data: result,
      circuit: externalApiCircuit.getState()
    });
  } catch (error: any) {
    const circuitState = externalApiCircuit.getState();
    
    if (error.message === 'Circuit breaker is OPEN') {
      const retryAfter = Math.ceil((circuitState.nextAttempt - Date.now()) / 1000);
      
      return c.json({
        error: 'Service Unavailable',
        message: 'Circuit breaker is OPEN',
        retryAfter: `${retryAfter}s`,
        circuit: circuitState
      }, 503);
    }
    
    return c.json({
      error: 'Request failed',
      message: error.message,
      circuit: circuitState
    }, 502);
  }
});

app.get('/circuit/status', (c) => {
  return c.json({
    circuit: externalApiCircuit.getState(),
    explanation: {
      CLOSED: 'Normal operation - requests go through',
      OPEN: 'Too many failures - requests blocked',
      HALF_OPEN: 'Testing if service recovered'
    }
  });
});

app.post('/circuit/reset', (c) => {
  externalApiCircuit.reset();
  return c.json({ message: 'Circuit breaker reset to CLOSED' });
});

// ============================================================================
// Load Testing Simulation
// ============================================================================

interface LoadTestResult {
  totalRequests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

app.post('/load-test', async (c) => {
  const body = await c.req.json();
  const { requests = 100, concurrent = 10 } = body;
  
  const results: number[] = [];
  const errors: number[] = [];
  const startTime = Date.now();
  
  async function makeRequest(): Promise<number> {
    const reqStart = Date.now();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return Date.now() - reqStart;
    } catch {
      return -1;
    }
  }
  
  // Execute requests in batches
  for (let i = 0; i < requests; i += concurrent) {
    const batch = Math.min(concurrent, requests - i);
    const promises = Array(batch).fill(0).map(() => makeRequest());
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(time => {
      if (time > 0) results.push(time);
      else errors.push(1);
    });
  }
  
  const totalTime = Date.now() - startTime;
  
  const loadTestResult: LoadTestResult = {
    totalRequests: requests,
    successful: results.length,
    failed: errors.length,
    avgResponseTime: results.reduce((a, b) => a + b, 0) / results.length,
    minResponseTime: Math.min(...results),
    maxResponseTime: Math.max(...results),
    requestsPerSecond: (requests / totalTime) * 1000
  };
  
  return c.json(loadTestResult);
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Circuit Breaker & Load Testing',
    endpoints: {
      circuitBreaker: {
        stable: 'GET /external-api/stable',
        unstable: 'GET /external-api/unstable (causes failures)',
        status: 'GET /circuit/status',
        reset: 'POST /circuit/reset'
      },
      loadTesting: {
        run: 'POST /load-test {"requests": 100, "concurrent": 10}'
      }
    },
    circuitBreaker: {
      pattern: 'Prevents cascading failures by failing fast',
      states: ['CLOSED (normal)', 'OPEN (blocking)', 'HALF_OPEN (testing)'],
      config: {
        failureThreshold: 3,
        timeout: '30s',
        recoveryRequests: 2
      }
    }
  });
});

console.log('🔌 Circuit Breaker server running on http://localhost:3000');
console.log('\nTest circuit breaker:');
console.log('  curl http://localhost:3000/external-api/unstable  # Trigger failures');
console.log('  curl http://localhost:3000/circuit/status        # Check state');

export default app;
