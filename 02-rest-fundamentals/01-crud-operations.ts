/**
 * LESSON 1: CRUD Operations - In-Memory Store
 * 
 * Concepts covered:
 * - Create, Read, Update, Delete operations
 * - REST conventions for resources
 * - Appropriate HTTP methods and status codes
 * - URL parameter extraction (/:id patterns)
 * 
 * Run: bun run 02-rest-fundamentals/01-crud-operations.ts
 * 
 * Test:
 *   # Create
 *   curl -X POST http://localhost:3000/books -H "Content-Type: application/json" -d '{"title":"1984","author":"George Orwell"}'
 *   
 *   # Read all
 *   curl http://localhost:3000/books
 *   
 *   # Read one
 *   curl http://localhost:3000/books/1
 *   
 *   # Update
 *   curl -X PUT http://localhost:3000/books/1 -H "Content-Type: application/json" -d '{"title":"1984","author":"George Orwell","year":1949}'
 *   
 *   # Delete
 *   curl -X DELETE http://localhost:3000/books/1
 */

interface Book {
  id: number;
  title: string;
  author: string;
  year?: number;
}

// In-memory database
let books: Book[] = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 },
];

let nextId = 3;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // GET /books - List all books
    if (path === "/books" && method === "GET") {
      return Response.json(books);
    }

    // GET /books/:id - Get a specific book
    const getMatch = path.match(/^\/books\/(\d+)$/);
    if (getMatch && method === "GET") {
      const id = parseInt(getMatch[1]!);
      const book = books.find(b => b.id === id);
      
      if (!book) {
        return Response.json({ error: "Book not found" }, { status: 404 });
      }
      
      return Response.json(book);
    }

    // POST /books - Create a new book
    if (path === "/books" && method === "POST") {
      try {
        const body = await req.json() as any;
        
        if (!body.title || !body.author) {
          return Response.json(
            { error: "Title and author are required" },
            { status: 400 }
          );
        }

        const newBook: Book = {
          id: nextId++,
          title: body.title,
          author: body.author,
          year: body.year,
        };

        books.push(newBook);
        
        return Response.json(newBook, { status: 201 });
      } catch (error) {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    // PUT /books/:id - Update a book
    const putMatch = path.match(/^\/books\/(\d+)$/);
    if (putMatch && method === "PUT") {
      const id = parseInt(putMatch[1]!);
      const index = books.findIndex(b => b.id === id);
      
      if (index === -1) {
        return Response.json({ error: "Book not found" }, { status: 404 });
      }

      try {
        const body = await req.json() as any;
        
        books[index] = {
          ...books[index]!,
          title: body.title || books[index]!.title,
          author: body.author || books[index]!.author,
          year: body.year || books[index]!.year,
        };

        return Response.json(books[index]);
      } catch (error) {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    // DELETE /books/:id - Delete a book
    const deleteMatch = path.match(/^\/books\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      const id = parseInt(deleteMatch[1]!);
      const index = books.findIndex(b => b.id === id);
      
      if (index === -1) {
        return Response.json({ error: "Book not found" }, { status: 404 });
      }

      books.splice(index, 1);
      
      return Response.json({ message: "Book deleted successfully" }, { status: 200 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`📚 Books API running at http://localhost:${server.port}`);
console.log(`Try: curl http://localhost:${server.port}/books`);
