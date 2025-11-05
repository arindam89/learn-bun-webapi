/**
 * Real-World Application 3: E-commerce Product API
 * 
 * An e-commerce API with:
 * - Products with inventory
 * - Categories
 * - Price filtering
 * - Stock management
 * - Order simulation
 * 
 * Run: bun run 04-real-world-apps/03-ecommerce-api.ts
 */

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  stock: number;
  sku: string;
  imageUrl?: string;
  createdAt: string;
}

interface CartItem {
  productId: number;
  quantity: number;
}

interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
}

// In-memory databases
let categories: Category[] = [
  { id: 1, name: "Electronics", description: "Electronic devices and accessories" },
  { id: 2, name: "Books", description: "Physical and digital books" },
  { id: 3, name: "Clothing", description: "Apparel and accessories" },
];

let products: Product[] = [
  {
    id: 1,
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 29.99,
    categoryId: 1,
    stock: 50,
    sku: "ELEC-MOUSE-001",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "USB-C Cable",
    description: "Fast charging USB-C cable",
    price: 12.99,
    categoryId: 1,
    stock: 100,
    sku: "ELEC-CABLE-001",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "JavaScript Guide",
    description: "Complete guide to JavaScript",
    price: 39.99,
    categoryId: 2,
    stock: 25,
    sku: "BOOK-JS-001",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "T-Shirt",
    description: "Cotton t-shirt",
    price: 19.99,
    categoryId: 3,
    stock: 0,
    sku: "CLO-TSHIRT-001",
    createdAt: new Date().toISOString(),
  },
];

let orders: Order[] = [];
let nextCategoryId = 4;
let nextProductId = 5;
let nextOrderId = 1;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
      // ===== CATEGORIES =====
      
      if (path === "/categories" && method === "GET") {
        return Response.json(categories);
      }

      if (path === "/categories" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.name) {
          return Response.json(
            { error: "Name is required" },
            { status: 400 }
          );
        }

        const newCategory: Category = {
          id: nextCategoryId++,
          name: body.name,
          description: body.description || "",
        };

        categories.push(newCategory);
        return Response.json(newCategory, { status: 201 });
      }

      // ===== PRODUCTS =====
      
      // GET /products - with advanced filtering
      if (path === "/products" && method === "GET") {
        let filtered = [...products];

        // Filter by category
        const categoryId = url.searchParams.get("categoryId");
        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === parseInt(categoryId));
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

        // Filter by stock availability
        const inStock = url.searchParams.get("inStock");
        if (inStock === "true") {
          filtered = filtered.filter(p => p.stock > 0);
        } else if (inStock === "false") {
          filtered = filtered.filter(p => p.stock === 0);
        }

        // Search by name or description
        const search = url.searchParams.get("search");
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
          );
        }

        // Sort
        const sort = url.searchParams.get("sort") || "name";
        const order = url.searchParams.get("order") || "asc";

        filtered.sort((a, b) => {
          let aVal: any = a[sort as keyof Product];
          let bVal: any = b[sort as keyof Product];
          
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
          
          if (aVal < bVal) return order === "asc" ? -1 : 1;
          if (aVal > bVal) return order === "asc" ? 1 : -1;
          return 0;
        });

        // Enrich with category info
        const enriched = filtered.map(product => ({
          ...product,
          category: categories.find(c => c.id === product.categoryId),
        }));

        return Response.json({
          total: enriched.length,
          products: enriched,
        });
      }

      // GET /products/:id
      const getProductMatch = path.match(/^\/products\/(\d+)$/);
      if (getProductMatch && method === "GET") {
        const id = parseInt(getProductMatch[1]!);
        const product = products.find(p => p.id === id);
        
        if (!product) {
          return Response.json({ error: "Product not found" }, { status: 404 });
        }

        const category = categories.find(c => c.id === product.categoryId);

        return Response.json({
          ...product,
          category,
        });
      }

      // POST /products
      if (path === "/products" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.name || !body.price || !body.categoryId || !body.sku) {
          return Response.json(
            { error: "Name, price, categoryId, and SKU are required" },
            { status: 400 }
          );
        }

        // Verify category exists
        if (!categories.find(c => c.id === body.categoryId)) {
          return Response.json(
            { error: "Category not found" },
            { status: 404 }
          );
        }

        // Check SKU uniqueness
        if (products.find(p => p.sku === body.sku)) {
          return Response.json(
            { error: "Product with this SKU already exists" },
            { status: 409 }
          );
        }

        const newProduct: Product = {
          id: nextProductId++,
          name: body.name,
          description: body.description || "",
          price: parseFloat(body.price),
          categoryId: body.categoryId,
          stock: body.stock || 0,
          sku: body.sku,
          imageUrl: body.imageUrl,
          createdAt: new Date().toISOString(),
        };

        products.push(newProduct);
        return Response.json(newProduct, { status: 201 });
      }

      // PATCH /products/:id
      const patchProductMatch = path.match(/^\/products\/(\d+)$/);
      if (patchProductMatch && method === "PATCH") {
        const id = parseInt(patchProductMatch[1]!);
        const product = products.find(p => p.id === id);
        
        if (!product) {
          return Response.json({ error: "Product not found" }, { status: 404 });
        }

        const body = await req.json() as any;

        if (body.name) product.name = body.name;
        if (body.description) product.description = body.description;
        if (body.price) product.price = parseFloat(body.price);
        if (body.stock !== undefined) product.stock = body.stock;

        return Response.json(product);
      }

      // PATCH /products/:id/stock - Update stock
      const stockMatch = path.match(/^\/products\/(\d+)\/stock$/);
      if (stockMatch && method === "PATCH") {
        const id = parseInt(stockMatch[1]!);
        const product = products.find(p => p.id === id);
        
        if (!product) {
          return Response.json({ error: "Product not found" }, { status: 404 });
        }

        const body = await req.json() as any;

        if (body.quantity === undefined) {
          return Response.json(
            { error: "Quantity is required" },
            { status: 400 }
          );
        }

        product.stock = Math.max(0, product.stock + body.quantity);

        return Response.json({
          productId: product.id,
          newStock: product.stock,
        });
      }

      // ===== ORDERS =====
      
      // POST /orders - Create order
      if (path === "/orders" && method === "POST") {
        const body = await req.json() as any;
        
        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
          return Response.json(
            { error: "Items array is required and must not be empty" },
            { status: 400 }
          );
        }

        // Validate items and calculate total
        let total = 0;
        const orderItems: CartItem[] = [];

        for (const item of body.items) {
          const product = products.find(p => p.id === item.productId);
          
          if (!product) {
            return Response.json(
              { error: `Product ${item.productId} not found` },
              { status: 404 }
            );
          }

          if (product.stock < item.quantity) {
            return Response.json(
              { error: `Insufficient stock for ${product.name}` },
              { status: 400 }
            );
          }

          // Reduce stock
          product.stock -= item.quantity;
          total += product.price * item.quantity;
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        }

        const newOrder: Order = {
          id: nextOrderId++,
          items: orderItems,
          total: Math.round(total * 100) / 100,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        orders.push(newOrder);
        return Response.json(newOrder, { status: 201 });
      }

      // GET /orders
      if (path === "/orders" && method === "GET") {
        return Response.json(orders);
      }

      // GET /orders/:id
      const getOrderMatch = path.match(/^\/orders\/(\d+)$/);
      if (getOrderMatch && method === "GET") {
        const id = parseInt(getOrderMatch[1]!);
        const order = orders.find(o => o.id === id);
        
        if (!order) {
          return Response.json({ error: "Order not found" }, { status: 404 });
        }

        // Enrich with product details
        const enrichedOrder = {
          ...order,
          items: order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              ...item,
              product,
            };
          }),
        };

        return Response.json(enrichedOrder);
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

console.log(`🛒 E-commerce API running at http://localhost:${server.port}`);
console.log(`\nEndpoints:`);
console.log(`  Categories:`);
console.log(`    GET    /categories`);
console.log(`    POST   /categories`);
console.log(`\n  Products:`);
console.log(`    GET    /products`);
console.log(`    GET    /products/:id`);
console.log(`    POST   /products`);
console.log(`    PATCH  /products/:id`);
console.log(`    PATCH  /products/:id/stock`);
console.log(`\n  Orders:`);
console.log(`    GET    /orders`);
console.log(`    GET    /orders/:id`);
console.log(`    POST   /orders`);
console.log(`\nQuery parameters for /products:`);
console.log(`  ?categoryId=:id`);
console.log(`  ?minPrice=:price`);
console.log(`  ?maxPrice=:price`);
console.log(`  ?inStock=true|false`);
console.log(`  ?search=:query`);
console.log(`  ?sort=name|price|stock`);
console.log(`  ?order=asc|desc`);
