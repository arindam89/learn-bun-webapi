/**
 * Production Concept 1: Structured Logging
 * 
 * Concepts covered:
 * - Structured logging with levels
 * - Request/response logging
 * - Error logging
 * - Performance monitoring
 * - Log formatting
 * 
 * Run: bun run 06-production/01-logging.ts
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level: LogLevel[level],
      timestamp: new Date().toISOString(),
      message,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    const output = JSON.stringify(entry);

    if (level >= LogLevel.ERROR) {
      console.error(output);
    } else if (level >= LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

const logger = new Logger(LogLevel.DEBUG);

// Request logging middleware
async function logRequest(req: Request, handler: () => Promise<Response>): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const requestId = crypto.randomUUID();

  logger.info("Incoming request", {
    requestId,
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: req.headers.get("user-agent"),
  });

  try {
    const response = await handler();
    const duration = Date.now() - startTime;

    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: url.pathname,
      status: response.status,
      duration: `${duration}ms`,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Request failed", error as Error, {
      requestId,
      method: req.method,
      path: url.pathname,
      duration: `${duration}ms`,
    });

    throw error;
  }
}

// Sample API with logging
let counter = 0;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    return logRequest(req, async () => {
      const url = new URL(req.url);

      if (url.pathname === "/increment" && req.method === "POST") {
        counter++;
        logger.debug("Counter incremented", { counter });
        return Response.json({ counter });
      }

      if (url.pathname === "/counter" && req.method === "GET") {
        return Response.json({ counter });
      }

      if (url.pathname === "/warn" && req.method === "GET") {
        logger.warn("Warning endpoint accessed", {
          message: "This is a test warning",
        });
        return Response.json({ message: "Warning logged" });
      }

      if (url.pathname === "/error" && req.method === "GET") {
        try {
          throw new Error("Intentional error for testing");
        } catch (error) {
          logger.error("Test error occurred", error as Error, {
            endpoint: "/error",
          });
          return Response.json(
            { error: "An error occurred" },
            { status: 500 }
          );
        }
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    });
  },
});

logger.info("Server started", {
  port: server.port,
  environment: "development",
});

console.log(`\n📊 Logging API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  POST /increment`);
console.log(`  GET  /counter`);
console.log(`  GET  /warn`);
console.log(`  GET  /error`);
console.log(`\nAll requests and responses are logged in structured JSON format.`);
