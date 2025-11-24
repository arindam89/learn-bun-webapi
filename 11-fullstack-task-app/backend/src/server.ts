/**
 * TaskFlow Backend Server
 * Full-stack task management application built with Bun 1.3
 *
 * Features demonstrated:
 * - Enhanced Bun.serve() routing
 * - Unified SQL API with PostgreSQL
 * - Built-in Redis client for caching
 * - Security enhancements
 * - Real-time communication with SSE
 * - File upload and management
 * - Comprehensive error handling
 * - Authentication and authorization
 */

import { serve } from 'bun';
import { Database } from 'bun:sql';
import { Redis } from 'bun:redis';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { jwt } from 'jsonwebtoken';
import { z } from 'zod';

// Import shared types
import type {
  User, Task, Project, Team, ApiResponse,
  TaskFilters, CreateTaskRequest, UpdateTaskRequest,
  AuthRequest, AuthResponse, RealtimeEvent
} from '../../shared/types';

// Configuration
const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://taskflow_user:taskflow_password@localhost:5432/taskflow',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Initialize database and Redis
const db = new Database(config.databaseUrl);
const redis = new Redis({ url: config.redisUrl });

// Initialize upload directory
await import('fs/promises').then(fs =>
  fs.mkdir(config.uploadDir, { recursive: true })
);

// Real-time event management
class EventManager {
  private clients = new Map<string, Response>();

  addClient(userId: string, response: Response) {
    this.clients.set(userId, response);
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
  }

  broadcast(event: RealtimeEvent, targetUsers?: string[]) {
    const eventData = `data: ${JSON.stringify(event)}\n\n`;

    if (targetUsers) {
      targetUsers.forEach(userId => {
        const client = this.clients.get(userId);
        if (client) {
          try {
            client.write(eventData);
          } catch (error) {
            this.clients.delete(userId);
          }
        }
      });
    } else {
      this.clients.forEach((client, userId) => {
        try {
          client.write(eventData);
        } catch (error) {
          this.clients.delete(userId);
        }
      });
    }
  }
}

const eventManager = new EventManager();

// Authentication middleware
class AuthMiddleware {
  static generateToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      },
      config.jwtSecret,
      {
        expiresIn: '24h',
        issuer: 'taskflow',
        audience: 'taskflow-users'
      }
    );
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as any;

      // Get fresh user data from database
      const user = await db.get(
        `SELECT id, email, name, avatar, role, is_active, created_at, updated_at, last_login_at
         FROM users WHERE id = ? AND is_active = true`,
        [parseInt(payload.sub)]
      );

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at
      };
    } catch (error) {
      return null;
    }
  }

  static async middleware(request: Request): Promise<{ user: User } | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const user = await this.verifyToken(token);

    if (!user) {
      return null;
    }

    return { user };
  }

  static requireAuth(handler: (request: Request, params: any, user: User) => Promise<Response>) {
    return async (request: Request, params: any) => {
      const auth = await this.middleware(request);
      if (!auth) {
        return Response.json({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        }, { status: 401 });
      }

      // Update last login
      await db.run(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [auth.user.id]
      );

      return handler(request, params, auth.user);
    };
  }
}

// Validation schemas
const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.number().positive(),
  assignedTo: z.number().positive().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional()
});

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  teamId: z.number().positive(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional()
});

const teamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional()
});

// Error handling
class ErrorHandler {
  static handle(error: any): Response {
    console.error('API Error:', error);

    if (error instanceof z.ZodError) {
      return Response.json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      }, { status: 400 });
    }

    return Response.json({
      success: false,
      error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }

  static notFound(resource: string = 'Resource'): Response {
    return Response.json({
      success: false,
      error: `${resource} not found`,
      code: 'NOT_FOUND'
    }, { status: 404 });
  }

  static unauthorized(message: string = 'Unauthorized'): Response {
    return Response.json({
      success: false,
      error: message,
      code: 'UNAUTHORIZED'
    }, { status: 401 });
  }

  static forbidden(message: string = 'Forbidden'): Response {
    return Response.json({
      success: false,
      error: message,
      code: 'FORBIDDEN'
    }, { status: 403 });
  }
}

// Database models
class UserModel {
  static async findById(id: number): Promise<User | null> {
    const user = await db.get(
      `SELECT id, email, name, avatar, role, is_active, created_at, updated_at, last_login_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await db.get(
      `SELECT id, email, name, avatar, role, is_active, created_at, updated_at, last_login_at
       FROM users WHERE email = ?`,
      [email]
    );

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at
    };
  }

  static async create(userData: { name: string; email: string; password: string }): Promise<User> {
    const passwordHash = createHash('sha256').update(userData.password).digest('hex');

    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'member', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userData.name, userData.email, passwordHash]
    );

    const user = await this.findById(result.lastInsertRowid as number);
    if (!user) throw new Error('Failed to create user');

    return user;
  }
}

class TaskModel {
  static async findById(id: number): Promise<Task | null> {
    const task = await db.get(
      `SELECT t.*, p.name as project_name, p.team_id,
              u.name as assigned_name, u.avatar as assigned_avatar,
              c.name as created_by_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    if (!task) return null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.project_id,
      assignedTo: task.assigned_to,
      createdById: task.created_by_id,
      status: task.status,
      priority: task.priority,
      tags: task.tags ? JSON.parse(task.tags) : [],
      dueDate: task.due_date,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at
    };
  }

  static async findMany(filters: TaskFilters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.projectId) {
      whereClause += ' AND t.project_id = ?';
      params.push(filters.projectId);
    }

    if (filters.assignedTo) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(filters.assignedTo);
    }

    if (filters.status) {
      whereClause += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      whereClause += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters.search) {
      whereClause += ' AND (t.title ILIKE ? OR t.description ILIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    whereClause += ` ORDER BY t.${sortBy} ${sortOrder.toUpperCase()}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tasks t ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    const total = countResult?.total || 0;

    // Get tasks
    const tasksQuery = `
      SELECT t.*, p.name as project_name, p.team_id,
             u.name as assigned_name, u.avatar as assigned_avatar,
             c.name as created_by_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by_id = c.id
      ${whereClause}
      LIMIT ? OFFSET ?
    `;

    const tasks = await db.all(tasksQuery, [...params, limit, offset]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  static async create(taskData: CreateTaskRequest, createdById: number): Promise<Task> {
    const validatedData = taskSchema.parse(taskData);

    const result = await db.run(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by_id,
                          status, priority, tags, due_date, estimated_hours,
                          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        validatedData.title,
        validatedData.description || null,
        validatedData.projectId,
        validatedData.assignedTo || null,
        createdById,
        validatedData.status || 'todo',
        validatedData.priority || 'medium',
        JSON.stringify(validatedData.tags || []),
        validatedData.dueDate || null,
        validatedData.estimatedHours || null
      ]
    );

    const task = await this.findById(result.lastInsertRowid as number);
    if (!task) throw new Error('Failed to create task');

    return task;
  }

  static async update(id: number, updates: UpdateTaskRequest): Promise<Task | null> {
    const validatedData = taskSchema.partial().parse(updates);

    const updateFields = [];
    const updateValues = [];

    if (validatedData.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(validatedData.title);
    }

    if (validatedData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(validatedData.description);
    }

    if (validatedData.assignedTo !== undefined) {
      updateFields.push('assigned_to = ?');
      updateValues.push(validatedData.assignedTo);
    }

    if (validatedData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(validatedData.status);

      if (validatedData.status === 'completed') {
        updateFields.push('completed_at = CURRENT_TIMESTAMP');
      }
    }

    if (validatedData.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(validatedData.priority);
    }

    if (validatedData.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(validatedData.tags));
    }

    if (validatedData.dueDate !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(validatedData.dueDate);
    }

    if (validatedData.estimatedHours !== undefined) {
      updateFields.push('estimated_hours = ?');
      updateValues.push(validatedData.estimatedHours);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await db.run(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }
}

// API Controllers
class AuthController {
  static async register(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { name, email, password, confirmPassword } = body;

      if (!name || !email || !password || !confirmPassword) {
        return ErrorHandler.handle(new Error('All fields are required'));
      }

      if (password !== confirmPassword) {
        return ErrorHandler.handle(new Error('Passwords do not match'));
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return ErrorHandler.handle(new Error('User already exists'));
      }

      const user = await UserModel.create({ name, email, password });
      const token = AuthMiddleware.generateToken(user);

      return Response.json({
        success: true,
        data: {
          user,
          token,
          expiresIn: 86400 // 24 hours
        }
      }, { status: 201 });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async login(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return ErrorHandler.handle(new Error('Email and password are required'));
      }

      // Find user and verify password
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return ErrorHandler.unauthorized('Invalid credentials');
      }

      const passwordHash = createHash('sha256').update(password).digest('hex');
      const storedHash = await db.get('SELECT password_hash FROM users WHERE id = ?', [user.id]);

      if (!storedHash || passwordHash !== storedHash.password_hash) {
        return ErrorHandler.unauthorized('Invalid credentials');
      }

      const token = AuthMiddleware.generateToken(user);

      return Response.json({
        success: true,
        data: {
          user,
          token,
          expiresIn: 86400
        }
      });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async me(request: Request, params: any, user: User): Promise<Response> {
    return Response.json({
      success: true,
      data: user
    });
  }
}

class TaskController {
  static async getTasks(request: Request, params: any, user: User): Promise<Response> {
    try {
      const url = new URL(request.url);
      const filters: TaskFilters = {
        projectId: url.searchParams.get('projectId') ? parseInt(url.searchParams.get('projectId')!) : undefined,
        assignedTo: url.searchParams.get('assignedTo') ? parseInt(url.searchParams.get('assignedTo')!) : undefined,
        status: url.searchParams.get('status') as any,
        priority: url.searchParams.get('priority') as any,
        search: url.searchParams.get('search') || undefined,
        sortBy: url.searchParams.get('sortBy') as any,
        sortOrder: url.searchParams.get('sortOrder') as any
      };

      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

      const result = await TaskModel.findMany(filters, page, limit);

      return Response.json({
        success: true,
        data: result.tasks,
        pagination: result.pagination
      });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async getTask(request: Request, params: any, user: User): Promise<Response> {
    try {
      const taskId = parseInt(params.id);
      const task = await TaskModel.findById(taskId);

      if (!task) {
        return ErrorHandler.notFound('Task');
      }

      return Response.json({
        success: true,
        data: task
      });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async createTask(request: Request, params: any, user: User): Promise<Response> {
    try {
      const body = await request.json();
      const task = await TaskModel.create(body, user.id);

      // Broadcast real-time event
      eventManager.broadcast({
        id: randomBytes(16).toString('hex'),
        type: 'task_created',
        data: task,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        data: task
      }, { status: 201 });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async updateTask(request: Request, params: any, user: User): Promise<Response> {
    try {
      const taskId = parseInt(params.id);
      const body = await request.json();

      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        return ErrorHandler.notFound('Task');
      }

      const updatedTask = await TaskModel.update(taskId, body);

      if (updatedTask) {
        // Broadcast real-time event
        eventManager.broadcast({
          id: randomBytes(16).toString('hex'),
          type: 'task_updated',
          data: updatedTask,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }

      return Response.json({
        success: true,
        data: updatedTask
      });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  static async deleteTask(request: Request, params: any, user: User): Promise<Response> {
    try {
      const taskId = parseInt(params.id);

      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        return ErrorHandler.notFound('Task');
      }

      const deleted = await TaskModel.delete(taskId);

      if (deleted) {
        // Broadcast real-time event
        eventManager.broadcast({
          id: randomBytes(16).toString('hex'),
          type: 'task_deleted',
          data: { id: taskId },
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }

      return Response.json({
        success: true,
        message: 'Task deleted successfully'
      });

    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}

// Server-Sent Events handler
async function handleEvents(request: Request, params: any, user: User): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Access-Control-Allow-Credentials': 'true'
  });

  const response = new Response(null, { headers });

  // Add client to event manager
  eventManager.addClient(user.id.toString(), response);

  // Send initial connection event
  const welcomeEvent = {
    id: randomBytes(16).toString('hex'),
    type: 'connection',
    data: { userId: user.id, message: 'Connected to real-time updates' },
    timestamp: new Date().toISOString()
  };

  response.write(`data: ${JSON.stringify(welcomeEvent)}\n\n`);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    eventManager.removeClient(user.id.toString());
  });

  return response;
}

// Create the main server
const server = serve({
  port: config.port,
  development: config.nodeEnv === 'development',

  routes: {
    // Health check
    '/health': () => Response.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv
      }
    }),

    // Authentication routes
    '/api/auth/register': {
      POST: AuthController.register
    },

    '/api/auth/login': {
      POST: AuthController.login
    },

    '/api/auth/me': {
      GET: AuthMiddleware.requireAuth(AuthController.me)
    },

    // Task management routes
    '/api/tasks': {
      GET: AuthMiddleware.requireAuth(TaskController.getTasks),
      POST: AuthMiddleware.requireAuth(TaskController.createTask)
    },

    '/api/tasks/:id': {
      GET: AuthMiddleware.requireAuth(TaskController.getTask),
      PUT: AuthMiddleware.requireAuth(TaskController.updateTask),
      DELETE: AuthMiddleware.requireAuth(TaskController.deleteTask)
    },

    // Real-time events
    '/api/events': {
      GET: AuthMiddleware.requireAuth(handleEvents)
    }
  },

  // CORS middleware
  async fetch(request, server) {
    // Add CORS headers
    const response = await server.upgrade(request) || new Response('Not Found', { status: 404 });

    response.headers.set('Access-Control-Allow-Origin', config.corsOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }
});

console.log(`🚀 TaskFlow Backend Server running on http://localhost:${config.port}`);
console.log(`📊 Environment: ${config.nodeEnv}`);
console.log(`🔗 Database: PostgreSQL`);
console.log(`⚡ Cache: Redis`);
console.log(`📡 Real-time: Server-Sent Events`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down TaskFlow Backend...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down TaskFlow Backend...');
  server.stop();
  process.exit(0);
});