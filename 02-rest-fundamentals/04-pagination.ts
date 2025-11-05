/**
 * LESSON 4: Pagination
 * 
 * Concepts covered:
 * - Limit and offset pagination
 * - Page-based pagination
 * - Response metadata
 * - Efficient data slicing
 * 
 * Run: bun run 02-rest-fundamentals/04-pagination.ts
 * 
 * Test:
 *   curl "http://localhost:3000/items"
 *   curl "http://localhost:3000/items?page=2&limit=5"
 *   curl "http://localhost:3000/items?offset=10&limit=5"
 */

interface Item {
  id: number;
  name: string;
}

// Generate 50 items
const items: Item[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
}));

interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    count: number;
    page?: number;
    totalPages?: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function paginate<T>(
  data: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const limit = Math.min(params.limit || 10, 100); // Max 100 items per page
  let offset = params.offset || 0;
  let page = params.page;

  // If page is provided, calculate offset
  if (page !== undefined) {
    page = Math.max(1, page);
    offset = (page - 1) * limit;
  } else {
    // Calculate page from offset
    page = Math.floor(offset / limit) + 1;
  }

  const total = data.length;
  const paginatedData = data.slice(offset, offset + limit);
  const totalPages = Math.ceil(total / limit);

  return {
    data: paginatedData,
    pagination: {
      total,
      count: paginatedData.length,
      page,
      totalPages,
      limit,
      offset,
      hasNext: offset + limit < total,
      hasPrev: offset > 0,
    },
  };
}

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/items" && req.method === "GET") {
      const page = url.searchParams.get("page");
      const limit = url.searchParams.get("limit");
      const offset = url.searchParams.get("offset");

      const result = paginate(items, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return Response.json(result);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`📄 Pagination API running at http://localhost:${server.port}`);
console.log(`\nTry these queries:`);
console.log(`  curl "http://localhost:${server.port}/items"`);
console.log(`  curl "http://localhost:${server.port}/items?page=2"`);
console.log(`  curl "http://localhost:${server.port}/items?page=1&limit=20"`);
console.log(`  curl "http://localhost:${server.port}/items?offset=15&limit=5"`);
