/**
 * Real-World Application 2: Blog API
 * 
 * A blogging platform API with:
 * - Posts and Comments
 * - Author management
 * - Search functionality
 * - Nested resources
 * - Timestamps
 * 
 * Run: bun run 04-real-world-apps/02-blog-api.ts
 */

interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

// In-memory databases
let authors: Author[] = [
  { id: 1, name: "Alice Johnson", email: "alice@blog.com", bio: "Tech enthusiast" },
  { id: 2, name: "Bob Smith", email: "bob@blog.com" },
];

let posts: Post[] = [
  {
    id: 1,
    title: "Getting Started with Bun",
    content: "Bun is a fast JavaScript runtime...",
    authorId: 1,
    published: true,
    tags: ["javascript", "bun", "tutorial"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 2,
    title: "Building REST APIs",
    content: "REST APIs are a fundamental part...",
    authorId: 1,
    published: true,
    tags: ["api", "rest", "web-development"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let comments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: "Charlie",
    content: "Great article!",
    createdAt: new Date().toISOString(),
  },
];

let nextAuthorId = 3;
let nextPostId = 3;
let nextCommentId = 2;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // ===== AUTHORS =====
      
      // GET /authors
      if (path === "/authors" && method === "GET") {
        return Response.json(authors);
      }

      // GET /authors/:id
      const getAuthorMatch = path.match(/^\/authors\/(\d+)$/);
      if (getAuthorMatch && method === "GET") {
        const id = parseInt(getAuthorMatch[1]!);
        const author = authors.find(a => a.id === id);
        
        if (!author) {
          return Response.json({ error: "Author not found" }, { status: 404 });
        }
        
        return Response.json(author);
      }

      // POST /authors
      if (path === "/authors" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.name || !body.email) {
          return Response.json(
            { error: "Name and email are required" },
            { status: 400 }
          );
        }

        const newAuthor: Author = {
          id: nextAuthorId++,
          name: body.name,
          email: body.email,
          bio: body.bio,
        };

        authors.push(newAuthor);
        return Response.json(newAuthor, { status: 201 });
      }

      // ===== POSTS =====
      
      // GET /posts - with filtering and search
      if (path === "/posts" && method === "GET") {
        let filtered = [...posts];

        // Filter by published status
        const published = url.searchParams.get("published");
        if (published !== null) {
          filtered = filtered.filter(p => p.published === (published === "true"));
        }

        // Filter by author
        const authorId = url.searchParams.get("authorId");
        if (authorId) {
          filtered = filtered.filter(p => p.authorId === parseInt(authorId));
        }

        // Filter by tag
        const tag = url.searchParams.get("tag");
        if (tag) {
          filtered = filtered.filter(p => p.tags.includes(tag));
        }

        // Search in title and content
        const search = url.searchParams.get("search");
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.content.toLowerCase().includes(searchLower)
          );
        }

        // Populate author info
        const enriched = filtered.map(post => ({
          ...post,
          author: authors.find(a => a.id === post.authorId),
        }));

        return Response.json({
          total: enriched.length,
          posts: enriched,
        });
      }

      // GET /posts/:id
      const getPostMatch = path.match(/^\/posts\/(\d+)$/);
      if (getPostMatch && method === "GET") {
        const id = parseInt(getPostMatch[1]!);
        const post = posts.find(p => p.id === id);
        
        if (!post) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }

        const author = authors.find(a => a.id === post.authorId);
        const postComments = comments.filter(c => c.postId === id);

        return Response.json({
          ...post,
          author,
          comments: postComments,
        });
      }

      // POST /posts
      if (path === "/posts" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.title || !body.content || !body.authorId) {
          return Response.json(
            { error: "Title, content, and authorId are required" },
            { status: 400 }
          );
        }

        // Verify author exists
        if (!authors.find(a => a.id === body.authorId)) {
          return Response.json(
            { error: "Author not found" },
            { status: 404 }
          );
        }

        const now = new Date().toISOString();
        const newPost: Post = {
          id: nextPostId++,
          title: body.title,
          content: body.content,
          authorId: body.authorId,
          published: body.published || false,
          tags: body.tags || [],
          createdAt: now,
          updatedAt: now,
        };

        posts.push(newPost);
        return Response.json(newPost, { status: 201 });
      }

      // PATCH /posts/:id
      const patchPostMatch = path.match(/^\/posts\/(\d+)$/);
      if (patchPostMatch && method === "PATCH") {
        const id = parseInt(patchPostMatch[1]!);
        const post = posts.find(p => p.id === id);
        
        if (!post) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }

        const body = await req.json() as any;

        if (body.title) post.title = body.title;
        if (body.content) post.content = body.content;
        if (body.published !== undefined) post.published = body.published;
        if (body.tags) post.tags = body.tags;
        post.updatedAt = new Date().toISOString();

        return Response.json(post);
      }

      // DELETE /posts/:id
      const deletePostMatch = path.match(/^\/posts\/(\d+)$/);
      if (deletePostMatch && method === "DELETE") {
        const id = parseInt(deletePostMatch[1]!);
        const index = posts.findIndex(p => p.id === id);
        
        if (index === -1) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }

        // Also delete associated comments
        comments = comments.filter(c => c.postId !== id);
        posts.splice(index, 1);

        return new Response(null, { status: 204 });
      }

      // ===== COMMENTS =====
      
      // GET /posts/:postId/comments
      const getCommentsMatch = path.match(/^\/posts\/(\d+)\/comments$/);
      if (getCommentsMatch && method === "GET") {
        const postId = parseInt(getCommentsMatch[1]!);
        
        if (!posts.find(p => p.id === postId)) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }

        const postComments = comments.filter(c => c.postId === postId);
        return Response.json(postComments);
      }

      // POST /posts/:postId/comments
      const postCommentMatch = path.match(/^\/posts\/(\d+)\/comments$/);
      if (postCommentMatch && method === "POST") {
        const postId = parseInt(postCommentMatch[1]!);
        
        if (!posts.find(p => p.id === postId)) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }

        const body = await req.json() as any;
        
        if (!body.author || !body.content) {
          return Response.json(
            { error: "Author and content are required" },
            { status: 400 }
          );
        }

        const newComment: Comment = {
          id: nextCommentId++,
          postId,
          author: body.author,
          content: body.content,
          createdAt: new Date().toISOString(),
        };

        comments.push(newComment);
        return Response.json(newComment, { status: 201 });
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

console.log(`📝 Blog API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  Authors:`);
console.log(`    GET    /authors`);
console.log(`    GET    /authors/:id`);
console.log(`    POST   /authors`);
console.log(`\n  Posts:`);
console.log(`    GET    /posts`);
console.log(`    GET    /posts/:id`);
console.log(`    POST   /posts`);
console.log(`    PATCH  /posts/:id`);
console.log(`    DELETE /posts/:id`);
console.log(`\n  Comments:`);
console.log(`    GET    /posts/:postId/comments`);
console.log(`    POST   /posts/:postId/comments`);
console.log(`\nQuery parameters for /posts:`);
console.log(`  ?published=true|false`);
console.log(`  ?authorId=:id`);
console.log(`  ?tag=:tagname`);
console.log(`  ?search=:query`);
