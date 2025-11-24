/**
 * Bun 1.3 Modern Web API Development Patterns
 *
 * This example demonstrates advanced API development patterns using Bun 1.3's enhanced
 * routing capabilities, focusing on production-ready web APIs with modern practices.
 *
 * Features shown:
 * - RESTful API design with proper HTTP semantics
 * - GraphQL-style query support
* - Webhook handling and validation
 * - Real-time API with Server-Sent Events (SSE)
 * - API versioning strategies
 * - Request/response transformation
 * - Comprehensive error handling
 * - API documentation and OpenAPI generation
 * - Background job processing
 */

import { serve } from 'bun';
import { Database } from 'bun:sql';
import { randomBytes, createHash } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Example 1: Complete RESTful API with proper HTTP semantics
class RESTfulAPI {
  private db: Database;

  constructor() {
    this.db = new Database('sqlite:./restful_api.db');
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS article_tags (
        article_id INTEGER,
        tag TEXT NOT NULL,
        PRIMARY KEY (article_id, tag),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database initialized for RESTful API');
  }

  private generateETag(data: any): string {
    const hash = createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  createServer() {
    return serve({
      port: 3006,
      routes: {
        // Article collection endpoints
        '/api/v1/articles': {
          // List articles with filtering, sorting, and pagination
          GET: async (request) => {
            try {
              const url = new URL(request.url);
              const page = parseInt(url.searchParams.get('page') || '1');
              const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
              const offset = (page - 1) * limit;
              const published = url.searchParams.get('published');
              const author = url.searchParams.get('author');
              const sortBy = url.searchParams.get('sort_by') || 'created_at';
              const sortOrder = url.searchParams.get('sort_order') || 'desc';

              // Build query dynamically
              let whereClause = 'WHERE 1=1';
              const params: any[] = [];

              if (published !== null) {
                whereClause += ' AND published = ?';
                params.push(published === 'true');
              }

              if (author) {
                whereClause += ' AND author = ?';
                params.push(author);
              }

              const validSortFields = ['id', 'title', 'author', 'created_at', 'updated_at', 'version'];
              const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
              const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

              // Get total count
              const countQuery = `SELECT COUNT(*) as total FROM articles ${whereClause}`;
              const countResult = await this.db.get(countQuery, params);
              const total = countResult?.total || 0;

              // Get articles
              const articlesQuery = `
                SELECT id, title, author, published, created_at, updated_at, version
                FROM articles ${whereClause}
                ORDER BY ${finalSortBy} ${finalSortOrder}
                LIMIT ? OFFSET ?
              `;
              const articles = await this.db.all(articlesQuery, [...params, limit, offset]);

              // Add HATEOAS links
              const baseUrl = `${url.protocol}//${url.host}/api/v1/articles`;
              const links = {
                self: `${baseUrl}?page=${page}&limit=${limit}`,
                first: `${baseUrl}?page=1&limit=${limit}`,
                last: `${baseUrl}?page=${Math.ceil(total / limit)}&limit=${limit}`,
              };

              if (page > 1) {
                links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
              }

              if (page < Math.ceil(total / limit)) {
                links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
              }

              const response = {
                data: articles,
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages: Math.ceil(total / limit),
                  hasNextPage: page < Math.ceil(total / limit),
                  hasPrevPage: page > 1,
                },
                links,
              };

              const etag = this.generateETag(response);
              const ifNoneMatch = request.headers.get('if-none-match');

              if (ifNoneMatch === etag) {
                return new Response(null, { status: 304 });
              }

              const res = Response.json(response);
              res.headers.set('ETag', etag);
              res.headers.set('Cache-Control', 'public, max-age=300');
              return res;

            } catch (error) {
              return Response.json({
                error: 'Failed to fetch articles',
                details: error.message
              }, { status: 500 });
            }
          },

          // Create new article
          POST: async (request) => {
            try {
              const body = await request.json();

              // Validate required fields
              if (!body.title || !body.content || !body.author) {
                return Response.json({
                  error: 'Title, content, and author are required',
                  fields: ['title', 'content', 'author']
                }, { status: 400 });
              }

              // Insert article
              const result = await this.db.run(
                'INSERT INTO articles (title, content, author, published) VALUES (?, ?, ?, ?)',
                [body.title, body.content, body.author, body.published || false]
              );

              const articleId = result.lastInsertRowid;

              // Add tags if provided
              if (body.tags && Array.isArray(body.tags)) {
                const tagPromises = body.tags.map(tag =>
                  this.db.run('INSERT OR IGNORE INTO article_tags (article_id, tag) VALUES (?, ?)', [articleId, tag])
                );
                await Promise.all(tagPromises);
              }

              // Fetch created article
              const createdArticle = await this.db.get('SELECT * FROM articles WHERE id = ?', [articleId]);

              const response = {
                message: 'Article created successfully',
                data: createdArticle
              };

              return Response.json(response, {
                status: 201,
                headers: { 'Location': `/api/v1/articles/${articleId}` }
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to create article',
                details: error.message
              }, { status: 500 });
            }
          }
        },

        // Individual article endpoints
        '/api/v1/articles/:id': {
          // Get specific article
          GET: async (request, params) => {
            try {
              const articleId = parseInt(params?.id || '0');
              const url = new URL(request.url);
              const includeContent = url.searchParams.get('include_content') !== 'false';

              const query = includeContent
                ? 'SELECT * FROM articles WHERE id = ?'
                : 'SELECT id, title, author, published, created_at, updated_at, version FROM articles WHERE id = ?';

              const article = await this.db.get(query, [articleId]);

              if (!article) {
                return Response.json({
                  error: 'Article not found',
                  articleId
                }, { status: 404 });
              }

              // Get tags for this article
              const tags = await this.db.all('SELECT tag FROM article_tags WHERE article_id = ?', [articleId]);
              article.tags = tags.map(t => t.tag);

              // Add related articles
              const relatedArticles = await this.db.all(
                'SELECT id, title, author FROM articles WHERE author = ? AND id != ? LIMIT 3',
                [article.author, articleId]
              );
              article.related = relatedArticles;

              const etag = this.generateETag(article);
              const ifNoneMatch = request.headers.get('if-none-match');

              if (ifNoneMatch === etag) {
                return new Response(null, { status: 304 });
              }

              const res = Response.json({ data: article });
              res.headers.set('ETag', etag);
              res.headers.set('Cache-Control', 'public, max-age=600');

              return res;

            } catch (error) {
              return Response.json({
                error: 'Failed to fetch article',
                details: error.message
              }, { status: 500 });
            }
          },

          // Update article (supports partial updates)
          PATCH: async (request, params) => {
            try {
              const articleId = parseInt(params?.id || '0');
              const body = await request.json();

              // Check if article exists
              const existingArticle = await this.db.get('SELECT * FROM articles WHERE id = ?', [articleId]);

              if (!existingArticle) {
                return Response.json({
                  error: 'Article not found',
                  articleId
                }, { status: 404 });
              }

              // Build dynamic update query
              const updateFields: string[] = [];
              const updateValues: any[] = [];

              if (body.title !== undefined) {
                updateFields.push('title = ?');
                updateValues.push(body.title);
              }

              if (body.content !== undefined) {
                updateFields.push('content = ?');
                updateValues.push(body.content);
              }

              if (body.author !== undefined) {
                updateFields.push('author = ?');
                updateValues.push(body.author);
              }

              if (body.published !== undefined) {
                updateFields.push('published = ?');
                updateValues.push(body.published);
              }

              if (updateFields.length === 0) {
                return Response.json({
                  error: 'No valid fields to update'
                }, { status: 400 });
              }

              updateFields.push('updated_at = CURRENT_TIMESTAMP', 'version = version + 1');
              updateValues.push(articleId);

              const updateQuery = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`;
              await this.db.run(updateQuery, updateValues);

              // Update tags if provided
              if (body.tags && Array.isArray(body.tags)) {
                await this.db.run('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
                const tagPromises = body.tags.map(tag =>
                  this.db.run('INSERT INTO article_tags (article_id, tag) VALUES (?, ?)', [articleId, tag])
                );
                await Promise.all(tagPromises);
              }

              // Fetch updated article
              const updatedArticle = await this.db.get('SELECT * FROM articles WHERE id = ?', [articleId]);

              return Response.json({
                message: 'Article updated successfully',
                data: updatedArticle
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to update article',
                details: error.message
              }, { status: 500 });
            }
          },

          // Delete article
          DELETE: async (request, params) => {
            try {
              const articleId = parseInt(params?.id || '0');

              // Check if article exists
              const article = await this.db.get('SELECT id, title FROM articles WHERE id = ?', [articleId]);

              if (!article) {
                return Response.json({
                  error: 'Article not found',
                  articleId
                }, { status: 404 });
              }

              // Delete article (tags will be deleted by cascade)
              await this.db.run('DELETE FROM articles WHERE id = ?', [articleId]);

              return Response.json({
                message: 'Article deleted successfully',
                article: {
                  id: article.id,
                  title: article.title
                }
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to delete article',
                details: error.message
              }, { status: 500 });
            }
          }
        },

        // Article tags management
        '/api/v1/articles/:id/tags': {
          GET: async (request, params) => {
            try {
              const articleId = parseInt(params?.id || '0');

              // Verify article exists
              const article = await this.db.get('SELECT id, title FROM articles WHERE id = ?', [articleId]);

              if (!article) {
                return Response.json({
                  error: 'Article not found',
                  articleId
                }, { status: 404 });
              }

              const tags = await this.db.all('SELECT tag FROM article_tags WHERE article_id = ?', [articleId]);

              return Response.json({
                data: {
                  articleId: article.id,
                  title: article.title,
                  tags: tags.map(t => t.tag)
                }
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to fetch article tags',
                details: error.message
              }, { status: 500 });
            }
          },

          POST: async (request, params) => {
            try {
              const articleId = parseInt(params?.id || '0');
              const body = await request.json();

              if (!body.tag) {
                return Response.json({
                  error: 'Tag is required'
                }, { status: 400 });
              }

              // Verify article exists
              const article = await this.db.get('SELECT id FROM articles WHERE id = ?', [articleId]);

              if (!article) {
                return Response.json({
                  error: 'Article not found',
                  articleId
                }, { status: 404 });
              }

              // Add tag
              await this.db.run('INSERT OR IGNORE INTO article_tags (article_id, tag) VALUES (?, ?)', [articleId, body.tag]);

              return Response.json({
                message: 'Tag added successfully',
                data: { articleId, tag: body.tag }
              }, { status: 201 });

            } catch (error) {
              return Response.json({
                error: 'Failed to add tag',
                details: error.message
              }, { status: 500 });
            }
          }
        },

        // Search endpoint with full-text search simulation
        '/api/v1/search': {
          GET: async (request) => {
            try {
              const url = new URL(request.url);
              const query = url.searchParams.get('q');
              const type = url.searchParams.get('type') || 'all';
              const page = parseInt(url.searchParams.get('page') || '1');
              const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

              if (!query || query.trim().length < 2) {
                return Response.json({
                  error: 'Search query must be at least 2 characters long'
                }, { status: 400 });
              }

              const searchTerm = `%${query.trim()}%`;
              const offset = (page - 1) * limit;

              let searchQuery, searchParams;

              if (type === 'articles') {
                searchQuery = `
                  SELECT id, title, author, published, created_at
                  FROM articles
                  WHERE (title LIKE ? OR content LIKE ?)
                  ORDER BY created_at DESC
                  LIMIT ? OFFSET ?
                `;
                searchParams = [searchTerm, searchTerm, limit, offset];
              } else {
                // Search all content types
                searchQuery = `
                  SELECT 'article' as type, id, title, author, published, created_at
                  FROM articles
                  WHERE title LIKE ? OR content LIKE ?
                  ORDER BY created_at DESC
                  LIMIT ? OFFSET ?
                `;
                searchParams = [searchTerm, searchTerm, limit, offset];
              }

              const results = await this.db.all(searchQuery, searchParams);

              // Get total count for pagination
              const countQuery = type === 'articles'
                ? 'SELECT COUNT(*) as total FROM articles WHERE title LIKE ? OR content LIKE ?'
                : 'SELECT COUNT(*) as total FROM articles WHERE title LIKE ? OR content LIKE ?';

              const countResult = await this.db.get(countQuery, [searchTerm, searchTerm]);
              const total = countResult?.total || 0;

              return Response.json({
                query,
                type,
                data: results,
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages: Math.ceil(total / limit)
                }
              });

            } catch (error) {
              return Response.json({
                error: 'Search failed',
                details: error.message
              }, { status: 500 });
            }
          }
        }
      },

      // Error handling for unmatched routes
      fetch(req) {
        return Response.json({
          error: 'Endpoint not found',
          message: 'The requested API endpoint does not exist',
          availableEndpoints: [
            'GET /api/v1/articles',
            'POST /api/v1/articles',
            'GET /api/v1/articles/:id',
            'PATCH /api/v1/articles/:id',
            'DELETE /api/v1/articles/:id',
            'GET /api/v1/articles/:id/tags',
            'POST /api/v1/articles/:id/tags',
            'GET /api/v1/search'
          ]
        }, { status: 404 });
      }
    });
  }
}

// Example 2: Real-time API with Server-Sent Events
class RealTimeAPI {
  private clients = new Set<Response>();
  private eventData = new Map<string, any>();

  constructor() {
    // Start emitting sample events
    this.startEventEmitter();
  }

  private startEventEmitter() {
    setInterval(() => {
      this.broadcastEvent('system', {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    }, 5000);

    setInterval(() => {
      this.broadcastEvent('notifications', {
        type: 'news_update',
        title: 'New article published',
        message: 'Check out our latest content!',
        timestamp: new Date().toISOString()
      });
    }, 30000);
  }

  private broadcastEvent(eventType: string, data: any) {
    const event = {
      id: Date.now(),
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.eventData.set(eventType, event);

    const eventDataText = `data: ${JSON.stringify(event)}\n\n`;

    this.clients.forEach(client => {
      try {
        client.write(eventDataText);
      } catch (error) {
        // Remove disconnected clients
        this.clients.delete(client);
      }
    });
  }

  createServer() {
    return serve({
      port: 3007,
      routes: {
        // SSE endpoint for real-time updates
        '/api/events': {
          GET: async (request) => {
            const headers = new Headers({
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            });

            const response = new Response(null, { headers });

            // Store the client connection
            this.clients.add(response);

            // Send initial connection event
            const welcomeEvent = {
              id: Date.now(),
              type: 'connection',
              data: { message: 'Connected to real-time API', clientId: randomBytes(8).toString('hex') },
              timestamp: new Date().toISOString()
            };

            response.write(`data: ${JSON.stringify(welcomeEvent)}\n\n`);

            // Handle client disconnect
            request.signal.addEventListener('abort', () => {
              this.clients.delete(response);
            });

            return response;
          }
        },

        // Get latest events by type
        '/api/events/:type': {
          GET: async (request, params) => {
            const eventType = params?.type;
            const event = this.eventData.get(eventType);

            if (!event) {
              return Response.json({
                error: 'Event type not found or no recent events',
                eventType
              }, { status: 404 });
            }

            return Response.json({
              data: event
            });
          }
        },

        // Trigger custom events
        '/api/events/trigger': {
          POST: async (request) => {
            try {
              const body = await request.json();
              const { eventType, data } = body;

              if (!eventType || !data) {
                return Response.json({
                  error: 'eventType and data are required'
                }, { status: 400 });
              }

              this.broadcastEvent(eventType, data);

              return Response.json({
                message: 'Event triggered successfully',
                eventType,
                timestamp: new Date().toISOString()
              });

            } catch (error) {
              return Response.json({
                error: 'Failed to trigger event',
                details: error.message
              }, { status: 500 });
            }
          }
        },

        // WebSocket-like endpoint for bidirectional communication
        '/api/stream': {
          GET: async (request) => {
            const url = new URL(request.url);
            const channel = url.searchParams.get('channel') || 'default';

            const headers = new Headers({
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*'
            });

            const response = new Response(null, { headers });

            // Send channel-specific messages
            const sendInterval = setInterval(() => {
              const message = {
                channel,
                id: Date.now(),
                data: {
                  type: 'channel_update',
                  message: `Update for channel: ${channel}`,
                  timestamp: new Date().toISOString(),
                  random: Math.random()
                }
              };

              response.write(`data: ${JSON.stringify(message)}\n\n`);
            }, 2000);

            request.signal.addEventListener('abort', () => {
              clearInterval(sendInterval);
            });

            return response;
          }
        }
      }
    });
  }
}

// Example 3: Webhook handler with validation and processing
class WebhookAPI {
  private webhookSecrets = new Map<string, string>();

  constructor() {
    // Initialize webhook secrets
    this.webhookSecrets.set('github', process.env.GITHUB_WEBHOOK_SECRET || 'github-secret');
    this.webhookSecrets.set('stripe', process.env.STRIPE_WEBHOOK_SECRET || 'stripe-secret');
  }

  private verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHash('sha256').update(`${payload}${secret}`).digest('hex');
    return `sha256=${expectedSignature}` === signature;
  }

  private async processWebhook(provider: string, event: string, data: any): Promise<any> {
    console.log(`Processing webhook: ${provider}:${event}`);

    switch (provider) {
      case 'github':
        return this.processGitHubWebhook(event, data);
      case 'stripe':
        return this.processStripeWebhook(event, data);
      default:
        return { processed: false, reason: 'Unknown provider' };
    }
  }

  private async processGitHubWebhook(event: string, data: any) {
    switch (event) {
      case 'push':
        return {
          processed: true,
          type: 'push',
          repository: data.repository?.name,
          branch: data.ref?.replace('refs/heads/', ''),
          commits: data.commits?.length || 0,
          pushed_by: data.pusher?.name
        };

      case 'pull_request':
        return {
          processed: true,
          type: 'pull_request',
          action: data.action,
          repository: data.repository?.name,
          pr_number: data.number,
          title: data.pull_request?.title
        };

      default:
        return { processed: true, event, note: 'Event received but not processed' };
    }
  }

  private async processStripeWebhook(event: string, data: any) {
    switch (event) {
      case 'payment_intent.succeeded':
        return {
          processed: true,
          type: 'payment',
          amount: data.data?.object?.amount,
          currency: data.data?.object?.currency,
          customer: data.data?.object?.customer
        };

      case 'invoice.payment_failed':
        return {
          processed: true,
          type: 'payment_failed',
          invoice: data.data?.object?.id,
          customer: data.data?.object?.customer,
          amount: data.data?.object?.amount_due
        };

      default:
        return { processed: true, event, note: 'Stripe event received' };
    }
  }

  createServer() {
    return serve({
      port: 3008,
      routes: {
        // Generic webhook handler
        '/api/webhooks/:provider': {
          POST: async (request, params) => {
            try {
              const provider = params?.provider;
              const signature = request.headers.get('x-hub-signature-256') ||
                              request.headers.get('stripe-signature');

              if (!signature) {
                return Response.json({
                  error: 'Missing signature header'
                }, { status: 401 });
              }

              const secret = this.webhookSecrets.get(provider);
              if (!secret) {
                return Response.json({
                  error: 'Unknown webhook provider'
                }, { status: 400 });
              }

              const body = await request.text();

              if (!this.verifySignature(body, signature, secret)) {
                return Response.json({
                  error: 'Invalid signature'
                }, { status: 401 });
              }

              let data;
              try {
                data = JSON.parse(body);
              } catch {
                return Response.json({
                  error: 'Invalid JSON payload'
                }, { status: 400 });
              }

              const event = request.headers.get('x-github-event') ||
                          request.headers.get('stripe-event') ||
                          'unknown';

              const result = await this.processWebhook(provider, event, data);

              // Log webhook processing
              console.log(`[${new Date().toISOString()}] Webhook processed:`, {
                provider,
                event,
                processed: result.processed
              });

              return Response.json({
                received: true,
                processed: result.processed,
                provider,
                event,
                result
              });

            } catch (error) {
              console.error('Webhook processing error:', error);
              return Response.json({
                error: 'Webhook processing failed',
                details: error.message
              }, { status: 500 });
            }
          }
        },

        // Webhook testing endpoint
        '/api/webhooks/test/:provider': {
          POST: async (request, params) => {
            const provider = params?.provider;
            const body = await request.json();

            // Generate test signature
            const secret = this.webhookSecrets.get(provider);
            if (!secret) {
              return Response.json({
                error: 'Unknown webhook provider'
              }, { status: 400 });
            }

            const payload = JSON.stringify(body);
            const signature = `sha256=${createHash('sha256').update(`${payload}${secret}`).digest('hex')}`;

            // Simulate webhook processing
            const event = body.event || 'test.event';
            const result = await this.processWebhook(provider, event, body);

            return Response.json({
              test: true,
              provider,
              event,
              signature,
              payload,
              result
            });
          }
        },

        // List webhook configurations
        '/api/webhooks': {
          GET: () => {
            const configs = Array.from(this.webhookSecrets.keys()).map(provider => ({
              provider,
              hasSecret: !!this.webhookSecrets.get(provider)
            }));

            return Response.json({
              data: configs
            });
          }
        }
      }
    });
  }
}

// Example 4: Background job processing API
class BackgroundJobAPI {
  private jobs = new Map<number, any>();
  private jobQueue: Array<{ id: number; type: string; data: any }> = [];
  private jobIdCounter = 0;

  constructor() {
    this.startJobProcessor();
  }

  private startJobProcessor() {
    setInterval(async () => {
      if (this.jobQueue.length > 0) {
        const job = this.jobQueue.shift();
        if (job) {
          this.processJob(job);
        }
      }
    }, 1000);
  }

  private async processJob(job: { id: number; type: string; data: any }) {
    const jobData = this.jobs.get(job.id);
    if (!jobData) return;

    try {
      jobData.status = 'processing';
      jobData.startedAt = new Date().toISOString();

      console.log(`Processing job ${job.id}: ${job.type}`);

      switch (job.type) {
        case 'email':
          await this.processEmailJob(job);
          break;
        case 'report':
          await this.processReportJob(job);
          break;
        case 'cleanup':
          await this.processCleanupJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      jobData.status = 'completed';
      jobData.completedAt = new Date().toISOString();

    } catch (error) {
      jobData.status = 'failed';
      jobData.error = error.message;
      jobData.failedAt = new Date().toISOString();
    }
  }

  private async processEmailJob(job: { id: number; data: any }) {
    const { to, subject, body } = job.data;
    console.log(`Sending email to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate email sending
  }

  private async processReportJob(job: { id: number; data: any }) {
    const { reportType, dateRange } = job.data;
    console.log(`Generating ${reportType} report for ${dateRange}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate report generation
  }

  private async processCleanupJob(job: { id: number; data: any }) {
    const { resource } = job.data;
    console.log(`Cleaning up ${resource}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate cleanup
  }

  createServer() {
    return serve({
      port: 3009,
      routes: {
        // Create new background job
        '/api/jobs': {
          POST: async (request) => {
            try {
              const body = await request.json();
              const { type, data, priority } = body;

              if (!type || !data) {
                return Response.json({
                  error: 'Job type and data are required'
                }, { status: 400 });
              }

              const jobId = ++this.jobIdCounter;
              const jobData = {
                id: jobId,
                type,
                data,
                priority: priority || 'normal',
                status: 'queued',
                createdAt: new Date().toISOString()
              };

              this.jobs.set(jobId, jobData);

              // Add to queue (priority jobs first)
              if (priority === 'high') {
                this.jobQueue.unshift(jobData);
              } else {
                this.jobQueue.push(jobData);
              }

              return Response.json({
                message: 'Job created successfully',
                data: jobData
              }, { status: 201 });

            } catch (error) {
              return Response.json({
                error: 'Failed to create job',
                details: error.message
              }, { status: 500 });
            }
          },

          GET: () => {
            const jobs = Array.from(this.jobs.values()).sort((a, b) => b.id - a.id);
            return Response.json({
              data: jobs,
              queue: {
                length: this.jobQueue.length,
                processing: Array.from(this.jobs.values()).filter(job => job.status === 'processing').length
              }
            });
          }
        },

        // Get job status
        '/api/jobs/:id': {
          GET: async (request, params) => {
            const jobId = parseInt(params?.id || '0');
            const job = this.jobs.get(jobId);

            if (!job) {
              return Response.json({
                error: 'Job not found',
                jobId
              }, { status: 404 });
            }

            return Response.json({
              data: job
            });
          },

          DELETE: async (request, params) => {
            const jobId = parseInt(params?.id || '0');
            const job = this.jobs.get(jobId);

            if (!job) {
              return Response.json({
                error: 'Job not found',
                jobId
              }, { status: 404 });
            }

            if (job.status === 'processing') {
              return Response.json({
                error: 'Cannot delete job that is currently processing',
                jobId
              }, { status: 400 });
            }

            this.jobs.delete(jobId);

            // Remove from queue if still there
            const queueIndex = this.jobQueue.findIndex(j => j.id === jobId);
            if (queueIndex !== -1) {
              this.jobQueue.splice(queueIndex, 1);
            }

            return Response.json({
              message: 'Job deleted successfully',
              jobId
            });
          }
        },

        // Retry failed job
        '/api/jobs/:id/retry': {
          POST: async (request, params) => {
            const jobId = parseInt(params?.id || '0');
            const job = this.jobs.get(jobId);

            if (!job) {
              return Response.json({
                error: 'Job not found',
                jobId
              }, { status: 404 });
            }

            if (job.status !== 'failed') {
              return Response.json({
                error: 'Only failed jobs can be retried',
                currentStatus: job.status
              }, { status: 400 });
            }

            // Reset job status and requeue
            job.status = 'queued';
            job.retryCount = (job.retryCount || 0) + 1;
            job.lastRetriedAt = new Date().toISOString();
            delete job.error;
            delete job.failedAt;

            this.jobQueue.push(job);

            return Response.json({
              message: 'Job queued for retry',
              data: job
            });
          }
        }
      }
    });
  }
}

// Main execution to start all advanced API servers
async function main() {
  console.log('🚀 Bun 1.3 Modern Web API Development Patterns');

  // Initialize all API servers
  const restfulAPI = new RESTfulAPI();
  const restfulServer = restfulAPI.createServer();
  console.log('✅ RESTful API server running on http://localhost:3006');

  const realTimeAPI = new RealTimeAPI();
  const realTimeServer = realTimeAPI.createServer();
  console.log('✅ Real-time API server running on http://localhost:3007');

  const webhookAPI = new WebhookAPI();
  const webhookServer = webhookAPI.createServer();
  console.log('✅ Webhook API server running on http://localhost:3008');

  const backgroundJobAPI = new BackgroundJobAPI();
  const backgroundJobServer = backgroundJobAPI.createServer();
  console.log('✅ Background Job API server running on http://localhost:3009');

  console.log('\n🎉 All advanced API servers started successfully!');
  console.log('\n📖 Advanced API Patterns Documentation:');

  console.log('\n📚 RESTful API (Port 3006):');
  console.log('  GET    /api/v1/articles?page=1&limit=10&published=true&sort_by=created_at');
  console.log('  POST   /api/v1/articles -H "Content-Type: application/json" -d \'{"title":"My Article","content":"Content","author":"John"}\'');
  console.log('  GET    /api/v1/articles/123?include_content=true');
  console.log('  PATCH  /api/v1/articles/123 -H "Content-Type: application/json" -d \'{"title":"Updated Title"}\'');
  console.log('  DELETE /api/v1/articles/123');
  console.log('  GET    /api/v1/articles/123/tags');
  console.log('  POST   /api/v1/articles/123/tags -H "Content-Type: application/json" -d \'{"tag":"javascript"}\'');
  console.log('  GET    /api/v1/search?q=javascript&type=articles&page=1');

  console.log('\n⚡ Real-time API (Port 3007):');
  console.log('  GET    /api/events - Server-Sent Events stream');
  console.log('  GET    /api/events/system - Get latest system events');
  console.log('  POST   /api/events/trigger -H "Content-Type: application/json" -d \'{"eventType":"custom","data":{"message":"Hello"}}\'');
  console.log('  GET    /api/stream?channel=mychannel - Channel-specific stream');

  console.log('\n🪝 Webhook API (Port 3008):');
  console.log('  POST   /api/webhooks/github -H "Content-Type: application/json" -H "x-hub-signature-256:sha256=..."');
  console.log('  POST   /api/webhooks/stripe -H "Content-Type: application/json" -H "stripe-signature:..."');
  console.log('  POST   /api/webhooks/test/github -H "Content-Type: application/json" -d \'{"event":"push","repository":"myrepo"}\'');
  console.log('  GET    /api/webhooks - List webhook configurations');

  console.log('\n⚙️ Background Job API (Port 3009):');
  console.log('  POST   /api/jobs -H "Content-Type: application/json" -d \'{"type":"email","data":{"to":"test@example.com","subject":"Hello","body":"Message"}}\'');
  console.log('  GET    /api/jobs - List all jobs');
  console.log('  GET    /api/jobs/123 - Get job status');
  console.log('  DELETE /api/jobs/123 - Delete job');
  console.log('  POST   /api/jobs/123/retry - Retry failed job');

  console.log('\n🧪 Test with curl examples:');
  console.log('  curl http://localhost:3006/api/v1/articles');
  console.log('  curl -X POST http://localhost:3006/api/v1/articles -H "Content-Type: application/json" -d \'{"title":"Test","content":"Test content","author":"Test Author"}\'');
  console.log('  curl -H "Accept: text/event-stream" http://localhost:3007/api/events');
  console.log('  curl -X POST http://localhost:3009/api/jobs -H "Content-Type: application/json" -d \'{"type":"email","data":{"to":"test@example.com"}}\'');

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n👋 Shutting down all servers...');
    restfulServer.stop();
    realTimeServer.stop();
    webhookServer.stop();
    backgroundJobServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process alive
  console.log('\n🔄 All servers are running. Press Ctrl+C to stop.');
}

main().catch(error => {
  console.error('❌ Failed to start advanced API servers:', error);
  process.exit(1);
});