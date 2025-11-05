/**
 * LESSON 4: Router Pattern
 * 
 * Concepts covered:
 * - Building a simple router
 * - Route matching
 * - Path parameters
 * - Method-based routing
 * - Route groups/prefixes
 * 
 * Run: bun run 03-data-middleware/04-router.ts
 */

type RouteHandler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];

  private addRoute(method: string, path: string, handler: RouteHandler) {
    // Convert path pattern to regex and extract param names
    const paramNames: string[] = [];
    const pattern = path.replace(/:([^\/]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });

    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    });
  }

  get(path: string, handler: RouteHandler) {
    this.addRoute("GET", path, handler);
  }

  post(path: string, handler: RouteHandler) {
    this.addRoute("POST", path, handler);
  }

  put(path: string, handler: RouteHandler) {
    this.addRoute("PUT", path, handler);
  }

  patch(path: string, handler: RouteHandler) {
    this.addRoute("PATCH", path, handler);
  }

  delete(path: string, handler: RouteHandler) {
    this.addRoute("DELETE", path, handler);
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (!match) continue;

      // Extract parameters
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1]!;
      });

      return await route.handler(req, params);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

// Create router instance
const router = new Router();

// In-memory database
interface Task {
  id: number;
  title: string;
  completed: boolean;
}

let tasks: Task[] = [
  { id: 1, title: "Learn Bun", completed: false },
  { id: 2, title: "Build API", completed: true },
];
let nextId = 3;

// Define routes
router.get("/", async () => {
  return Response.json({ message: "Task API", version: "1.0" });
});

router.get("/tasks", async () => {
  return Response.json(tasks);
});

router.get("/tasks/:id", async (req, params) => {
  const id = parseInt(params.id!);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  
  return Response.json(task);
});

router.post("/tasks", async (req) => {
  const body = await req.json() as any;
  
  if (!body.title) {
    return Response.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const task: Task = {
    id: nextId++,
    title: body.title,
    completed: body.completed || false,
  };

  tasks.push(task);
  return Response.json(task, { status: 201 });
});

router.patch("/tasks/:id", async (req, params) => {
  const id = parseInt(params.id!);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json() as any;
  
  if (body.title !== undefined) task.title = body.title;
  if (body.completed !== undefined) task.completed = body.completed;

  return Response.json(task);
});

router.delete("/tasks/:id", async (req, params) => {
  const id = parseInt(params.id!);
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  tasks.splice(index, 1);
  return Response.json({ message: "Task deleted" });
});

const server = Bun.serve({
  port: 3000,
  fetch: (req) => router.handle(req),
});

console.log(`🛣️  Router API running at http://localhost:${server.port}`);
console.log(`\nRoutes:`);
console.log(`  GET    /`);
console.log(`  GET    /tasks`);
console.log(`  GET    /tasks/:id`);
console.log(`  POST   /tasks`);
console.log(`  PATCH  /tasks/:id`);
console.log(`  DELETE /tasks/:id`);
