/**
 * Bun 1.3 Enhanced Bun.serve() with Built-in Routing
 *
 * This example demonstrates the revolutionary routing capabilities added to Bun.serve()
 * in Bun 1.3, eliminating the need for external routing frameworks and enabling
 * clean, high-performance API development.
 *
 * Features shown:
 * - Built-in route matching with parameter extraction
 * - HTTP method-based routing (GET, POST, PUT, DELETE, PATCH)
 * - Route parameters and query string parsing
 * - Route middleware and handlers
 * - Route groups and nested routing
 * - Static file serving
 * - Route-based caching
 * - Custom error handling for routes
 */

import { serve } from 'bun';
import { exists, mkdir, writeFile, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

// Example 1: Basic routing with parameters
function basicRoutingExample() {
  console.log('\n=== Basic Routing Example ===');

  const server = serve({
    port: 3002,
    // New in Bun 1.3: Built-in routing object
    routes: {
      // Static routes
      '/': () => new Response('Welcome to Bun 1.3 Routing API!'),
      '/health': () => Response.json({ status: 'ok', timestamp: new Date().toISOString() }),

      // Route with parameters
      '/users/:id': (request, params) => {
        const userId = params?.id;
        return Response.json({
          id: userId,
          name: `User ${userId}`,
          email: `user${userId}@example.com`,
          createdAt: new Date().toISOString()
        });
      },

      // Multiple parameters
      '/users/:userId/posts/:postId': (request, params) => {
        const { userId, postId } = params || {};
        return Response.json({
          userId,
          postId,
          title: `Post ${postId} by User ${userId}`,
          content: 'This is the post content...'
        });
      },

      // Query parameter access
      '/search': (request) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const page = url.searchParams.get('page') || '1';

        return Response.json({
          query,
          page,
          results: [`Result 1 for "${query}"`, `Result 2 for "${query}"`]
        });
      },

      // HTTP method-specific routing
      '/api/users': {
        GET: () => Response.json([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]),

        POST: async (request) => {
          const body = await request.json();
          return Response.json({
            id: Date.now(),
            ...body,
            createdAt: new Date().toISOString()
          }, { status: 201 });
        },

        PUT: async (request) => {
          const body = await request.json();
          return Response.json({
            message: 'User updated',
            user: body
          });
        },

        DELETE: () => Response.json({ message: 'User deleted' })
      }
    },

    // Fallback for unmatched routes
    fetch(req) {
      return new Response('Not Found', { status: 404 });
    }
  });

  console.log('✅ Basic routing server running on http://localhost:3002');
  console.log('\nTry these endpoints:');
  console.log('  GET  /                          - Welcome message');
  console.log('  GET  /health                    - Health check');
  console.log('  GET  /users/123                 - User with parameter');
  console.log('  GET  /users/456/posts/789       - Multiple parameters');
  console.log('  GET  /search?q=javascript&page=2 - Query parameters');
  console.log('  GET  /api/users                 - List users (GET)');
  console.log('  POST /api/users                 - Create user (POST)');
  console.log('  PUT  /api/users                 - Update user (PUT)');
  console.log('  DELETE /api/users               - Delete user (DELETE)');

  return server;
}

// Example 2: Advanced API patterns with middleware
class EnhancedAPIServer {
  private routes: any = {};
  private middleware: Array<(req: Request, params?: any) => Promise<Response | void>> = [];

  constructor() {
    this.setupRoutes();
  }

  // Add middleware to all routes
  use(middleware: (req: Request, params?: any) => Promise<Response | void>) {
    this.middleware.push(middleware);
  }

  // Execute middleware chain
  private async executeMiddleware(request: Request, params?: any): Promise<Response | void> {
    for (const middleware of this.middleware) {
      const result = await middleware(request, params);
      if (result) return result;
    }
  }

  private setupRoutes() {
    // CORS middleware
    this.use(async (request) => {
      const response = new Response(null);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (request.method === 'OPTIONS') {
        return response;
      }
    });

    // Request logging middleware
    this.use(async (request, params) => {
      const timestamp = new Date().toISOString();
      const method = request.method;
      const url = new URL(request.url);
      console.log(`[${timestamp}] ${method} ${url.pathname}`, params || '');
    });

    // API Key authentication middleware
    this.use(async (request) => {
      const apiKey = request.headers.get('x-api-key');
      if (!apiKey || apiKey !== 'your-secret-api-key') {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    });

    // Rate limiting middleware
    const rateLimiter = new Map<string, { count: number; resetTime: number }>();
    this.use(async (request) => {
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      const record = rateLimiter.get(clientIP);

      if (!record || now > record.resetTime) {
        rateLimiter.set(clientIP, { count: 1, resetTime: now + 60000 }); // 1 minute window
      } else if (record.count >= 100) { // 100 requests per minute
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        record.count++;
      }
    });

    this.routes = {
      // Product management API
      '/api/products': {
        GET: async () => {
          // Simulate database query
          const products = [
            { id: 1, name: 'Laptop', price: 999.99, category: 'electronics' },
            { id: 2, name: 'Mouse', price: 29.99, category: 'electronics' },
            { id: 3, name: 'Keyboard', price: 79.99, category: 'electronics' }
          ];

          return Response.json({
            data: products,
            total: products.length,
            page: 1,
            limit: 10
          });
        },

        POST: async (request) => {
          try {
            const body = await request.json();

            // Validate required fields
            if (!body.name || !body.price) {
              return Response.json({
                error: 'Name and price are required'
              }, { status: 400 });
            }

            // Simulate creating product
            const newProduct = {
              id: Date.now(),
              name: body.name,
              price: parseFloat(body.price),
              category: body.category || 'uncategorized',
              createdAt: new Date().toISOString()
            };

            return Response.json({
              message: 'Product created successfully',
              product: newProduct
            }, { status: 201 });

          } catch (error) {
            return Response.json({
              error: 'Invalid JSON format'
            }, { status: 400 });
          }
        }
      },

      // Product with ID parameter
      '/api/products/:id': {
        GET: async (request, params) => {
          const productId = parseInt(params?.id || '0');

          // Simulate database lookup
          const products = {
            1: { id: 1, name: 'Laptop', price: 999.99, category: 'electronics' },
            2: { id: 2, name: 'Mouse', price: 29.99, category: 'electronics' }
          };

          const product = products[productId as keyof typeof products];

          if (!product) {
            return Response.json({
              error: 'Product not found'
            }, { status: 404 });
          }

          return Response.json({ data: product });
        },

        PUT: async (request, params) => {
          const productId = parseInt(params?.id || '0');
          const body = await request.json();

          // Simulate updating product
          return Response.json({
            message: 'Product updated successfully',
            productId,
            updates: body
          });
        },

        DELETE: async (request, params) => {
          const productId = parseInt(params?.id || '0');

          return Response.json({
            message: 'Product deleted successfully',
            productId
          });
        }
      },

      // Complex API endpoints
      '/api/reports/:type/:dateRange': {
        GET: async (request, params) => {
          const { type, dateRange } = params || {};
          const url = new URL(request.url);
          const format = url.searchParams.get('format') || 'json';

          // Simulate generating different reports
          const reportData = {
            type,
            dateRange,
            generatedAt: new Date().toISOString(),
            data: {
              totalSales: 150000,
              orderCount: 450,
              averageOrderValue: 333.33,
              topProducts: ['Laptop', 'Mouse', 'Keyboard']
            }
          };

          if (format === 'csv') {
            const csv = 'metric,value\nTotal Sales,150000\nOrder Count,450\nAverage Order Value,333.33';
            return new Response(csv, {
              headers: { 'Content-Type': 'text/csv' }
            });
          }

          return Response.json(reportData);
        }
      }
    };
  }

  createServer() {
    return serve({
      port: 3003,
      routes: this.routes,

      async fetch(req, server) {
        // Execute middleware chain
        const middlewareResponse = await this.executeMiddleware(req);
        if (middlewareResponse) return middlewareResponse;

        // Let built-in router handle the request
        return null;
      }
    });
  }
}

// Example 3: File upload and download server
class FileServer {
  private uploadDir: string;

  constructor(uploadDir: string = './uploads') {
    this.uploadDir = uploadDir;
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  private generateFileName(originalName: string): string {
    const ext = extname(originalName);
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  private validateFileType(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json'
    ];
    return allowedTypes.includes(file.type);
  }

  createServer() {
    return serve({
      port: 3004,
      routes: {
        // File upload endpoint
        '/api/upload': {
          POST: async (request) => {
            try {
              const formData = await request.formData();
              const file = formData.get('file') as File;

              if (!file) {
                return Response.json({
                  error: 'No file provided'
                }, { status: 400 });
              }

              // Validate file type
              if (!this.validateFileType(file)) {
                return Response.json({
                  error: 'File type not allowed'
                }, { status: 400 });
              }

              // Validate file size (max 10MB)
              if (file.size > 10 * 1024 * 1024) {
                return Response.json({
                  error: 'File size exceeds 10MB limit'
                }, { status: 400 });
              }

              // Generate unique filename
              const fileName = this.generateFileName(file.name);
              const filePath = join(this.uploadDir, fileName);

              // Save file
              await writeFile(filePath, await file.arrayBuffer());

              return Response.json({
                message: 'File uploaded successfully',
                file: {
                  originalName: file.name,
                  fileName,
                  size: file.size,
                  type: file.type,
                  url: `/api/files/${fileName}`
                }
              });

            } catch (error) {
              console.error('Upload error:', error);
              return Response.json({
                error: 'Upload failed'
              }, { status: 500 });
            }
          }
        },

        // Multiple file upload
        '/api/upload/multiple': {
          POST: async (request) => {
            try {
              const formData = await request.formData();
              const files: File[] = [];

              // Extract all files from form data
              for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                  files.push(value);
                }
              }

              if (files.length === 0) {
                return Response.json({
                  error: 'No files provided'
                }, { status: 400 });
              }

              const uploadedFiles = [];

              for (const file of files) {
                if (!this.validateFileType(file)) {
                  continue; // Skip invalid files
                }

                const fileName = this.generateFileName(file.name);
                const filePath = join(this.uploadDir, fileName);

                await writeFile(filePath, await file.arrayBuffer());

                uploadedFiles.push({
                  originalName: file.name,
                  fileName,
                  size: file.size,
                  type: file.type,
                  url: `/api/files/${fileName}`
                });
              }

              return Response.json({
                message: `Successfully uploaded ${uploadedFiles.length} files`,
                files: uploadedFiles
              });

            } catch (error) {
              console.error('Multiple upload error:', error);
              return Response.json({
                error: 'Upload failed'
              }, { status: 500 });
            }
          }
        },

        // File download endpoint
        '/api/files/:fileName': {
          GET: async (request, params) => {
            try {
              const fileName = params?.fileName;
              if (!fileName) {
                return Response.json({
                  error: 'Filename required'
                }, { status: 400 });
              }

              const filePath = join(this.uploadDir, fileName);
              const fileExists = await exists(filePath);

              if (!fileExists) {
                return Response.json({
                  error: 'File not found'
                }, { status: 404 });
              }

              const file = Bun.file(filePath);
              const fileSize = await file.size;

              // Handle range requests for large files
              const rangeHeader = request.headers.get('range');
              if (rangeHeader) {
                const range = rangeHeader.replace('bytes=', '').split('-');
                const start = parseInt(range[0] || '0');
                const end = parseInt(range[1] || String(fileSize - 1));

                const chunkSize = (end - start) + 1;
                const chunk = await file.slice(start, end + 1).arrayBuffer();

                return new Response(chunk, {
                  status: 206, // Partial Content
                  headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': String(chunkSize),
                    'Content-Type': file.type || 'application/octet-stream'
                  }
                });
              }

              // Regular file download
              return new Response(file, {
                headers: {
                  'Content-Disposition': `attachment; filename="${fileName}"`,
                  'Content-Length': String(fileSize),
                  'Content-Type': file.type || 'application/octet-stream'
                }
              });

            } catch (error) {
              console.error('Download error:', error);
              return Response.json({
                error: 'Download failed'
              }, { status: 500 });
            }
          }
        },

        // File listing
        '/api/files': {
          GET: async () => {
            try {
              // In a real implementation, you'd read the directory
              // For this example, we'll return mock data
              return Response.json({
                files: [
                  { name: 'example.pdf', size: 1024000, type: 'application/pdf' },
                  { name: 'image.jpg', size: 2048000, type: 'image/jpeg' }
                ],
                totalFiles: 2
              });
            } catch (error) {
              return Response.json({
                error: 'Failed to list files'
              }, { status: 500 });
            }
          }
        },

        // File deletion
        '/api/files/:fileName': {
          DELETE: async (request, params) => {
            try {
              const fileName = params?.fileName;
              if (!fileName) {
                return Response.json({
                  error: 'Filename required'
                }, { status: 400 });
              }

              const filePath = join(this.uploadDir, fileName);
              const fileExists = await exists(filePath);

              if (!fileExists) {
                return Response.json({
                  error: 'File not found'
                }, { status: 404 });
              }

              // In a real implementation, you'd delete the file here
              // await unlink(filePath);

              return Response.json({
                message: 'File deleted successfully',
                fileName
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to delete file'
              }, { status: 500 });
            }
          }
        }
      },

      // Serve static files from uploads directory
      static: {
        '/uploads': this.uploadDir
      }
    });
  }
}

// Example 4: Caching and performance optimization
class CachedAPIServer {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private setCache(key: string, data: any, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  createServer() {
    return serve({
      port: 3005,
      routes: {
        // Cached public API
        '/api/public/stats': {
          GET: async () => {
            const cacheKey = 'public_stats';

            // Check cache first
            const cached = this.getCache(cacheKey);
            if (cached) {
              return Response.json({
                ...cached,
                cached: true,
                timestamp: new Date().toISOString()
              });
            }

            // Simulate expensive database query
            await new Promise(resolve => setTimeout(resolve, 1000));

            const stats = {
              totalUsers: 10000,
              totalProducts: 500,
              totalOrders: 25000,
              revenue: 1250000,
              generatedAt: new Date().toISOString()
            };

            // Cache the result
            this.setCache(cacheKey, stats);

            return Response.json({
              ...stats,
              cached: false
            });
          }
        },

        // Cache invalidation endpoint
        '/api/cache/clear': {
          POST: async (request) => {
            const body = await request.json();
            const { pattern } = body;

            if (pattern) {
              // Clear cache entries matching pattern
              for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                  this.cache.delete(key);
                }
              }
            } else {
              // Clear all cache
              this.cache.clear();
            }

            return Response.json({
              message: 'Cache cleared successfully',
              remainingEntries: this.cache.size
            });
          }
        },

        // Conditional requests with ETag
        '/api/public/config': {
          GET: async (request) => {
            const config = {
              version: '1.0.0',
              features: ['search', 'filtering', 'pagination'],
              maintenance: false,
              lastUpdated: new Date().toISOString()
            };

            // Generate ETag
            const etag = `"${Buffer.from(JSON.stringify(config)).toString('base64')}"`;

            // Check if client has cached version
            const ifNoneMatch = request.headers.get('if-none-match');
            if (ifNoneMatch === etag) {
              return new Response(null, { status: 304 }); // Not Modified
            }

            const response = Response.json(config);
            response.headers.set('ETag', etag);
            response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes

            return response;
          }
        }
      }
    });
  }
}

// Main execution to start all servers
async function main() {
  console.log('🚀 Bun 1.3 Enhanced Bun.serve() Routing Examples');

  // Start all example servers
  const basicServer = basicRoutingExample();
  await new Promise(resolve => setTimeout(resolve, 100)); // Prevent port conflicts

  const enhancedAPI = new EnhancedAPIServer();
  const enhancedServer = enhancedAPI.createServer();
  console.log('✅ Enhanced API server running on http://localhost:3003');

  const fileServer = new FileServer();
  const fileUploadServer = fileServer.createServer();
  console.log('✅ File upload/download server running on http://localhost:3004');

  const cachedAPI = new CachedAPIServer();
  const cachedServer = cachedAPI.createServer();
  console.log('✅ Cached API server running on http://localhost:3005');

  console.log('\n🎉 All servers started successfully!');
  console.log('\n📖 API Documentation:');
  console.log('\n🔧 Basic Routing (Port 3002):');
  console.log('  GET  /health');
  console.log('  GET  /users/123');
  console.log('  GET  /api/users');
  console.log('  POST /api/users (with JSON body)');

  console.log('\n🔐 Enhanced API (Port 3003):');
  console.log('  Headers: x-api-key: your-secret-api-key');
  console.log('  GET  /api/products');
  console.log('  POST /api/products (with JSON body)');
  console.log('  GET  /api/products/1');
  console.log('  GET  /api/reports/sales/last30days?format=csv');

  console.log('\n📁 File Server (Port 3004):');
  console.log('  POST /api/upload (multipart/form-data)');
  console.log('  POST /api/upload/multiple');
  console.log('  GET  /api/files/:filename');
  console.log('  DELETE /api/files/:filename');

  console.log('\n⚡ Cached API (Port 3005):');
  console.log('  GET  /api/public/stats (cached for 5 minutes)');
  console.log('  GET  /api/public/config (ETag support)');
  console.log('  POST /api/cache/clear (clear cache)');

  console.log('\n💡 Test with curl examples:');
  console.log('  curl http://localhost:3002/users/123');
  console.log('  curl -X POST http://localhost:3003/api/products -H "x-api-key: your-secret-api-key" -H "Content-Type: application/json" -d \'{"name":"Test Product","price":99.99}\'');
  console.log('  curl -X POST http://localhost:3004/api/upload -F "file=@example.txt"');

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n👋 Shutting down servers...');
    basicServer.stop();
    enhancedServer.stop();
    fileUploadServer.stop();
    cachedServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Error handling
main().catch(error => {
  console.error('❌ Failed to start servers:', error);
  process.exit(1);
});