# Module 5: Advanced Patterns

Explore advanced API development patterns including authentication, file handling, and real-time communication.

## Lessons

### 01 - JWT Authentication
**File:** `01-jwt-auth.ts`

Implement token-based authentication with JSON Web Tokens.

**Concepts:**
- User registration and login
- Password hashing
- JWT token generation
- Token verification
- Protected routes
- Authorization headers

**Run:**
```bash
bun run 05-advanced-patterns/01-jwt-auth.ts
```

**Example Usage:**
```bash
# Register a new user
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"secret123"}'

# Response includes token:
# { "message": "User registered successfully", "token": "eyJ...", "user": {...} }

# Save the token and use it for protected routes
TOKEN="<your-token-here>"

# Login (get new token)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'

# Access protected route
curl http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"

# Update profile
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"johnupdated"}'

# Access any protected endpoint
curl http://localhost:3000/protected \
  -H "Authorization: Bearer $TOKEN"
```

**Key Points:**
- Store tokens securely (httpOnly cookies in production)
- Use environment variables for secrets
- Implement refresh tokens for production
- Consider using libraries like `jose` for production JWT handling
- Hash passwords with bcrypt/argon2 in production

---

### 02 - File Upload
**File:** `02-file-upload.ts`

Handle file uploads with validation and storage.

**Concepts:**
- Multipart form data handling
- File type validation
- File size limits
- Unique filename generation
- File storage
- Serving uploaded files
- File metadata tracking

**Run:**
```bash
bun run 05-advanced-patterns/02-file-upload.ts
```

**Example Usage:**

**Browser:** Open http://localhost:3000/upload-form

**curl:**
```bash
# Upload a file
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/image.jpg"

# Response:
# {
#   "message": "File uploaded successfully",
#   "file": { "id": "...", "filename": "...", ... },
#   "url": "http://localhost:3000/files/..."
# }

# List all uploaded files
curl http://localhost:3000/files

# Download/view a file
curl http://localhost:3000/files/<filename>

# Delete a file
curl -X DELETE http://localhost:3000/files/<id>
```

**Settings:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, PDF
- Upload directory: `./uploads`

**Production Considerations:**
- Use cloud storage (S3, CloudFlare R2, etc.)
- Implement virus scanning
- Add image processing/thumbnails
- Set up CDN for file delivery
- Implement access control
- Add file cleanup/expiration

---

### 03 - WebSocket Real-time Updates
**File:** `03-websocket.ts`

Build real-time bidirectional communication with WebSockets.

**Concepts:**
- WebSocket server setup
- Connection management
- Broadcasting messages
- Client tracking
- Event handling
- Real-time chat application

**Run:**
```bash
bun run 05-advanced-patterns/03-websocket.ts
```

**Testing:**
1. Open http://localhost:3000 in your browser
2. Enter a username and join the chat
3. Open the same URL in another browser tab/window
4. Enter a different username
5. Send messages and see them appear in real-time!

**WebSocket Events:**
```javascript
// Client to Server
{
  "type": "join",
  "username": "John"
}

{
  "type": "message",
  "content": "Hello everyone!"
}

// Server to Client
{
  "type": "join",
  "username": "John",
  "timestamp": "2025-11-05T10:30:00.000Z"
}

{
  "type": "leave",
  "username": "John",
  "timestamp": "2025-11-05T10:35:00.000Z"
}

{
  "type": "message",
  "username": "John",
  "content": "Hello everyone!",
  "timestamp": "2025-11-05T10:30:00.000Z"
}

{
  "type": "users",
  "users": ["John", "Jane", "Bob"],
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

**Use Cases:**
- Chat applications
- Live notifications
- Real-time dashboards
- Collaborative editing
- Live sports scores
- Stock price updates
- Multiplayer games

**Production Considerations:**
- Implement reconnection logic
- Add message persistence
- Handle authentication
- Use Redis for multi-server scaling
- Implement rate limiting
- Add heartbeat/ping-pong
- Handle disconnections gracefully

---

## Key Takeaways

### Authentication
- **Never store plain text passwords** - always hash them
- **Use secure, random secrets** for JWT signing
- **Set appropriate token expiration** times
- **Validate tokens on every protected route**
- Consider **OAuth2/OpenID Connect** for production
- Implement **refresh tokens** for better UX

### File Handling
- **Always validate file types and sizes**
- **Generate unique filenames** to prevent conflicts
- **Store metadata separately** from files
- Use **cloud storage** in production
- Implement **access control** for files
- Consider **CDN integration** for performance

### WebSockets
- **Track client connections** properly
- **Handle disconnections gracefully**
- **Validate all messages** from clients
- **Broadcast efficiently** to avoid performance issues
- **Implement heartbeats** to detect dead connections
- Use **message queues** for reliability

## Security Best Practices

1. **Input Validation**: Always validate and sanitize user input
2. **Rate Limiting**: Prevent abuse with rate limits
3. **HTTPS**: Use TLS/SSL in production
4. **CORS**: Configure properly for your use case
5. **Error Messages**: Don't expose sensitive information
6. **Logging**: Log security events
7. **Dependencies**: Keep dependencies updated
8. **Secrets**: Never commit secrets to version control

## Performance Tips

1. **Connection Pooling**: For databases
2. **Caching**: Cache frequently accessed data
3. **Compression**: Compress responses
4. **Pagination**: For large datasets
5. **Async Operations**: Use async/await properly
6. **Resource Cleanup**: Close connections, clean up files
7. **Monitoring**: Track performance metrics

## Next Steps

- Explore Module 6 for production-ready features
- Add database integration (SQLite, PostgreSQL)
- Implement comprehensive testing
- Add API documentation (OpenAPI/Swagger)
- Deploy to production
- Set up monitoring and logging
