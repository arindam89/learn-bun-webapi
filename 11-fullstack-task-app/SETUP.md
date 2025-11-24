# TaskFlow Full-Stack Application Setup

This guide will help you set up and run the TaskFlow full-stack application built with Bun 1.3.

## 🚀 Quick Start

### Prerequisites
- **Bun 1.3+** installed
- **Docker & Docker Compose** for database services
- **Git** for version control

### 1. Clone and Install

```bash
# Navigate to the project directory
cd 11-fullstack-task-app

# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd ../frontend
bun install

# Return to root
cd ..
```

### 2. Start Development Environment

```bash
# Start databases with Docker
docker-compose up -d

# Setup database (in a new terminal)
cd backend
bun run migrate
bun run seed

# Start backend server (in a new terminal)
cd backend
bun run dev

# Start frontend server (in a new terminal)
cd frontend
bun run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 🐳 Docker Development (Optional)

### Using Docker for Everything

```bash
# Build and start all services
docker-compose up --build

# This will start:
# - PostgreSQL database
# - Redis cache
# - Backend API server
# - Frontend development server
```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://taskflow_user:taskflow_password@localhost:5432/taskflow"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="http://localhost:3001/events"
VITE_APP_NAME="TaskFlow"
VITE_VERSION="1.0.0"
```

## 🗄️ Database Management

### Database Migrations

```bash
cd backend

# Run pending migrations
bun run migrate

# Rollback last migration
bun run migrate:rollback

# Reset database (all data will be lost)
bun run db:reset
```

### Database Seeding

```bash
cd backend

# Seed database with sample data
bun run seed

# This creates:
# - Sample users
# - Sample teams
# - Sample projects
# - Sample tasks
```

### Connect to Database

```bash
# Connect to PostgreSQL
docker exec -it taskflow-postgres psql -U taskflow_user -d taskflow

# Connect to Redis
docker exec -it taskflow-redis redis-cli
```

## 🔧 Development Commands

### Backend Commands

```bash
cd backend

# Development with hot reload
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run tests
bun test

# Type checking
bun run type-check

# Linting
bun run lint
bun run lint:fix

# Database operations
bun run migrate
bun run seed
bun run db:reset
```

### Frontend Commands

```bash
cd frontend

# Development with hot reload
bun run dev

# Production build
bun run build

# Preview production build
bun run preview

# Run tests
bun test

# Type checking
bun run type-check

# Linting
bun run lint
bun run lint:fix
```

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

```bash
# Create production environment file
cp .env.example .env.production

# Edit production variables
nano .env.production

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Manual Deployment

#### Backend Deployment

```bash
cd backend

# Install production dependencies
bun install --production

# Build application
bun run build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL="your-production-database-url"
export REDIS_URL="your-production-redis-url"
export JWT_SECRET="your-production-jwt-secret"

# Start production server
bun run start
```

#### Frontend Deployment

```bash
cd frontend

# Build for production
bun run build

# Deploy the `dist` folder to your web server
# - Static hosting (Vercel, Netlify, etc.)
# - CDN (Cloudflare, AWS CloudFront)
# - Web server (Nginx, Apache)
```

## 🔍 Testing

### Backend Testing

```bash
cd backend

# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test tests/auth.test.ts
```

### Frontend Testing

```bash
cd frontend

# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### API Testing with curl

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","confirmPassword":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Create task (requires auth token)
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"My First Task","projectId":1,"priority":"medium"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using port 3000, 3001, 5432, 6379
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   lsof -i :6379

   # Kill processes if needed
   kill -9 PID
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres

   # Restart PostgreSQL
   docker-compose restart postgres

   # Check PostgreSQL logs
   docker-compose logs postgres
   ```

3. **Redis connection issues**
   ```bash
   # Check if Redis is running
   docker-compose ps redis

   # Restart Redis
   docker-compose restart redis

   # Test Redis connection
   docker exec -it taskflow-redis redis-cli ping
   ```

4. **Permission issues**
   ```bash
   # Fix file permissions for uploads directory
   sudo chown -R $USER:$USER ./backend/uploads
   chmod -R 755 ./backend/uploads
   ```

5. **Dependencies issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules bun.lockb
   bun install

   # Clear bun cache
   bun pm cache rm
   ```

### Getting Help

- Check the application logs for error messages
- Ensure all environment variables are set correctly
- Verify Docker containers are running and healthy
- Check network connectivity between services

## 📊 Monitoring and Logs

### Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
curl http://localhost:3001/health | jq '.data.database'

# Redis connection
curl http://localhost:3001/health | jq '.data.redis'
```

## 🔒 Security Considerations

1. **Change default passwords** and secrets in production
2. **Use HTTPS** in production environments
3. **Set up proper CORS** origins
4. **Validate and sanitize** all inputs
5. **Implement rate limiting** for APIs
6. **Use environment variables** for sensitive data
7. **Regular updates** of dependencies
8. **Database backups** and recovery plans

## 📈 Performance Optimization

1. **Enable Redis caching** for frequently accessed data
2. **Use database indexes** for query optimization
3. **Implement CDN** for static assets
4. **Enable compression** for API responses
5. **Monitor memory usage** and optimize queries
6. **Use connection pooling** for database connections

---

## 🎯 Success Criteria

You know TaskFlow is running successfully when:

- ✅ Frontend loads at http://localhost:3000
- ✅ You can register a new user
- ✅ You can login with the registered user
- ✅ Tasks can be created, updated, and deleted
- ✅ Real-time updates work between multiple browser tabs
- ✅ File uploads work correctly
- ✅ API endpoints respond with proper data
- ✅ Database persists data across restarts
- ✅ Redis caching improves performance

Congratulations! You now have a fully functional full-stack application built entirely with Bun 1.3! 🎉