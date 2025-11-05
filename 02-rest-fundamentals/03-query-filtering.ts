/**
 * LESSON 3: Query Parameters and Filtering
 * 
 * Concepts covered:
 * - Filtering with query parameters
 * - Sorting
 * - Search functionality
 * - Multiple query parameters
 * 
 * Run: bun run 02-rest-fundamentals/03-query-filtering.ts
 * 
 * Test:
 *   curl "http://localhost:3000/products"
 *   curl "http://localhost:3000/products?category=electronics"
 *   curl "http://localhost:3000/products?minPrice=500&maxPrice=1500"
 *   curl "http://localhost:3000/products?sort=price&order=desc"
 *   curl "http://localhost:3000/products?search=phone"
 */

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

const products: Product[] = [
  { id: 1, name: "Laptop", category: "electronics", price: 1200, inStock: true },
  { id: 2, name: "Mouse", category: "electronics", price: 25, inStock: true },
  { id: 3, name: "Desk Chair", category: "furniture", price: 300, inStock: false },
  { id: 4, name: "Keyboard", category: "electronics", price: 75, inStock: true },
  { id: 5, name: "Monitor", category: "electronics", price: 450, inStock: true },
  { id: 6, name: "Desk Lamp", category: "furniture", price: 50, inStock: true },
  { id: 7, name: "Phone", category: "electronics", price: 800, inStock: false },
  { id: 8, name: "Headphones", category: "electronics", price: 150, inStock: true },
];

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/products" && req.method === "GET") {
      let filtered = [...products];

      // Filter by category
      const category = url.searchParams.get("category");
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }

      // Filter by stock status
      const inStock = url.searchParams.get("inStock");
      if (inStock !== null) {
        const stockValue = inStock === "true";
        filtered = filtered.filter(p => p.inStock === stockValue);
      }

      // Filter by price range
      const minPrice = url.searchParams.get("minPrice");
      if (minPrice) {
        filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
      }

      const maxPrice = url.searchParams.get("maxPrice");
      if (maxPrice) {
        filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
      }

      // Search by name
      const search = url.searchParams.get("search");
      if (search) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sorting
      const sort = url.searchParams.get("sort");
      const order = url.searchParams.get("order") || "asc";
      
      if (sort) {
        filtered.sort((a, b) => {
          let aVal = a[sort as keyof Product];
          let bVal = b[sort as keyof Product];
          
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
          
          if (aVal < bVal) return order === "asc" ? -1 : 1;
          if (aVal > bVal) return order === "asc" ? 1 : -1;
          return 0;
        });
      }

      return Response.json({
        total: filtered.length,
        products: filtered,
        filters: {
          category,
          inStock,
          minPrice,
          maxPrice,
          search,
          sort,
          order,
        },
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`🛍️  Products API running at http://localhost:${server.port}`);
console.log(`\nTry these queries:`);
console.log(`  curl "http://localhost:${server.port}/products?category=electronics"`);
console.log(`  curl "http://localhost:${server.port}/products?minPrice=100&maxPrice=500"`);
console.log(`  curl "http://localhost:${server.port}/products?sort=price&order=desc"`);
console.log(`  curl "http://localhost:${server.port}/products?search=desk"`);
