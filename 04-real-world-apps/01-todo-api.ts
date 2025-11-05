/**
 * Real-World Application 1: Todo List API
 * 
 * A complete todo list API with:
 * - Full CRUD operations
 * - Filtering and sorting
 * - Input validation
 * - Error handling
 * - Proper status codes
 * 
 * Run: bun run 04-real-world-apps/01-todo-api.ts
 */

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  completedAt?: string;
}

let todos: Todo[] = [
  {
    id: 1,
    title: "Learn Bun",
    description: "Complete Bun tutorial",
    completed: false,
    priority: "high",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Build REST API",
    completed: true,
    priority: "medium",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date().toISOString(),
  },
];

let nextId = 3;

function validateTodo(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== "string") {
    errors.push("Title is required and must be a string");
  } else if (data.title.length < 3) {
    errors.push("Title must be at least 3 characters");
  }

  if (data.priority && !["low", "medium", "high"].includes(data.priority)) {
    errors.push("Priority must be low, medium, or high");
  }

  return { valid: errors.length === 0, errors };
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // GET /todos - List todos with filtering
      if (path === "/todos" && method === "GET") {
        let filtered = [...todos];

        // Filter by completion status
        const completed = url.searchParams.get("completed");
        if (completed !== null) {
          filtered = filtered.filter(t => t.completed === (completed === "true"));
        }

        // Filter by priority
        const priority = url.searchParams.get("priority");
        if (priority) {
          filtered = filtered.filter(t => t.priority === priority);
        }

        // Sort
        const sort = url.searchParams.get("sort") || "createdAt";
        const order = url.searchParams.get("order") || "desc";

        filtered.sort((a, b) => {
          let aVal = a[sort as keyof Todo] || "";
          let bVal = b[sort as keyof Todo] || "";
          
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
          
          if (aVal < bVal) return order === "asc" ? -1 : 1;
          if (aVal > bVal) return order === "asc" ? 1 : -1;
          return 0;
        });

        return Response.json({
          total: filtered.length,
          todos: filtered,
        });
      }

      // GET /todos/:id - Get specific todo
      const getMatch = path.match(/^\/todos\/(\d+)$/);
      if (getMatch && method === "GET") {
        const id = parseInt(getMatch[1]!);
        const todo = todos.find(t => t.id === id);

        if (!todo) {
          return Response.json({ error: "Todo not found" }, { status: 404 });
        }

        return Response.json(todo);
      }

      // POST /todos - Create todo
      if (path === "/todos" && method === "POST") {
        const body = await req.json() as any;
        const validation = validateTodo(body);

        if (!validation.valid) {
          return Response.json(
            { error: "Validation failed", details: validation.errors },
            { status: 400 }
          );
        }

        const newTodo: Todo = {
          id: nextId++,
          title: body.title,
          description: body.description,
          completed: false,
          priority: body.priority || "medium",
          createdAt: new Date().toISOString(),
        };

        todos.push(newTodo);
        return Response.json(newTodo, { status: 201 });
      }

      // PATCH /todos/:id - Update todo
      const patchMatch = path.match(/^\/todos\/(\d+)$/);
      if (patchMatch && method === "PATCH") {
        const id = parseInt(patchMatch[1]!);
        const todo = todos.find(t => t.id === id);

        if (!todo) {
          return Response.json({ error: "Todo not found" }, { status: 404 });
        }

        const body = await req.json() as any;

        if (body.title !== undefined) {
          if (body.title.length < 3) {
            return Response.json(
              { error: "Title must be at least 3 characters" },
              { status: 400 }
            );
          }
          todo.title = body.title;
        }

        if (body.description !== undefined) todo.description = body.description;
        if (body.priority !== undefined) todo.priority = body.priority;

        if (body.completed !== undefined) {
          todo.completed = body.completed;
          if (body.completed && !todo.completedAt) {
            todo.completedAt = new Date().toISOString();
          } else if (!body.completed) {
            todo.completedAt = undefined;
          }
        }

        return Response.json(todo);
      }

      // DELETE /todos/:id - Delete todo
      const deleteMatch = path.match(/^\/todos\/(\d+)$/);
      if (deleteMatch && method === "DELETE") {
        const id = parseInt(deleteMatch[1]!);
        const index = todos.findIndex(t => t.id === id);

        if (index === -1) {
          return Response.json({ error: "Todo not found" }, { status: 404 });
        }

        todos.splice(index, 1);
        return new Response(null, { status: 204 });
      }

      // GET /todos/stats - Get statistics
      if (path === "/todos/stats" && method === "GET") {
        const stats = {
          total: todos.length,
          completed: todos.filter(t => t.completed).length,
          pending: todos.filter(t => !t.completed).length,
          byPriority: {
            high: todos.filter(t => t.priority === "high").length,
            medium: todos.filter(t => t.priority === "medium").length,
            low: todos.filter(t => t.priority === "low").length,
          },
        };

        return Response.json(stats);
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

console.log(`✅ Todo API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  GET    /todos`);
console.log(`  GET    /todos/:id`);
console.log(`  GET    /todos/stats`);
console.log(`  POST   /todos`);
console.log(`  PATCH  /todos/:id`);
console.log(`  DELETE /todos/:id`);
console.log(`\nQuery parameters:`);
console.log(`  ?completed=true|false`);
console.log(`  ?priority=low|medium|high`);
console.log(`  ?sort=createdAt|title|priority`);
console.log(`  ?order=asc|desc`);
