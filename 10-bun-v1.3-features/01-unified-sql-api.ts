/**
 * Bun 1.3 Unified SQL API - Cross-database Example
 *
 * This example demonstrates Bun's new unified SQL API that provides
 * a consistent interface across different databases (PostgreSQL, MySQL, SQLite).
 *
 * Features shown:
 * - Unified connection interface
 * - Cross-database query execution
 * - Parameterized queries
 * - Transaction support
 * - Connection pooling
 *
 * Setup: Run the docker-compose file in this directory first
 */

import { Database } from 'bun:sql';

// Database configurations for different providers
const configs = {
  postgresql: {
    url: process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5432/testdb',
  },
  mysql: {
    url: process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/testdb',
  },
  sqlite: {
    url: process.env.SQLITE_URL || 'sqlite:./database.sqlite',
  },
};

// Example 1: Basic database operations with unified API
async function basicDatabaseOperations(dbType: 'postgresql' | 'mysql' | 'sqlite') {
  console.log(`\n=== ${dbType.toUpperCase()} Database Operations ===`);

  try {
    // Connect to database using unified API
    const db = new Database(configs[dbType].url);
    console.log(`✅ Connected to ${dbType} database`);

    // Create users table (uses appropriate SQL dialect)
    const createTableSQL = dbType === 'sqlite'
      ? `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    await db.run(createTableSQL);
    console.log('✅ Users table created');

    // Insert data with parameterized queries
    const insertResult = await db.run(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING id',
      ['John Doe', 'john@example.com']
    );
    console.log(`✅ Inserted user with ID: ${insertResult.lastInsertRowid}`);

    // Query data
    const users = await db.all('SELECT * FROM users WHERE name = ?', ['John Doe']);
    console.log('✅ Retrieved users:', users);

    // Get single value
    const count = await db.get('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Total users: ${count?.count}`);

    // Update data
    await db.run('UPDATE users SET name = ? WHERE id = ?', ['John Smith', insertResult.lastInsertRowid]);
    console.log('✅ Updated user name');

    // Delete data
    await db.run('DELETE FROM users WHERE id = ?', [insertResult.lastInsertRowid]);
    console.log('✅ Deleted user');

    await db.close();
    console.log(`✅ Closed ${dbType} connection`);

  } catch (error) {
    console.error(`❌ ${dbType} error:`, error.message);
  }
}

// Example 2: Transaction support
async function transactionExample() {
  console.log('\n=== Transaction Example (SQLite) ===');

  const db = new Database(configs.sqlite.url);

  try {
    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // Multiple operations within transaction
    await db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com']);
    await db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Bob', 'bob@example.com']);

    // Commit transaction
    await db.run('COMMIT');
    console.log('✅ Transaction committed successfully');

    // Verify data
    const users = await db.all('SELECT * FROM users');
    console.log('✅ Users after transaction:', users);

  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK');
    console.error('❌ Transaction rolled back:', error.message);
  }

  await db.close();
}

// Example 3: Connection pooling for high-throughput applications
class DatabasePool {
  private pools: Map<string, Database[]> = new Map();
  private maxConnections = 10;

  async getConnection(dbType: 'postgresql' | 'mysql' | 'sqlite'): Promise<Database> {
    const key = dbType;

    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }

    const pool = this.pools.get(key)!;

    // Return existing connection from pool
    if (pool.length > 0) {
      return pool.pop()!;
    }

    // Create new connection if pool not full
    if (pool.length < this.maxConnections) {
      return new Database(configs[dbType].url);
    }

    // Wait for available connection (simplified)
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getConnection(dbType);
  }

  releaseConnection(dbType: 'postgresql' | 'mysql' | 'sqlite', connection: Database) {
    const key = dbType;
    const pool = this.pools.get(key);
    if (pool && pool.length < this.maxConnections) {
      pool.push(connection);
    } else {
      connection.close();
    }
  }
}

async function connectionPoolExample() {
  console.log('\n=== Connection Pool Example ===');

  const pool = new DatabasePool();
  const promises: Promise<any>[] = [];

  // Simulate multiple concurrent requests
  for (let i = 0; i < 5; i++) {
    promises.push(
      (async (id: number) => {
        const db = await pool.getConnection('sqlite');
        try {
          await db.run('INSERT INTO users (name, email) VALUES (?, ?)',
            [`User ${id}`, `user${id}@example.com`]);
          console.log(`✅ Inserted user ${id}`);
        } finally {
          pool.releaseConnection('sqlite', db);
        }
      })(i)
    );
  }

  await Promise.all(promises);
  console.log('✅ All concurrent operations completed');
}

// Example 4: Database migration system
class DatabaseMigrator {
  private db: Database;

  constructor(dbType: 'postgresql' | 'mysql' | 'sqlite') {
    this.db = new Database(configs[dbType].url);
  }

  async migrate() {
    console.log('\n=== Database Migration Example ===');

    // Create migrations table
    const createMigrationsSQL = this.db.url.startsWith('sqlite')
      ? `CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    await this.db.run(createMigrationsSQL);

    // Define migrations
    const migrations = [
      {
        name: '001_create_products_table',
        up: `CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        down: 'DROP TABLE IF EXISTS products'
      },
      {
        name: '002_create_orders_table',
        up: `CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        down: 'DROP TABLE IF EXISTS orders'
      }
    ];

    // Run pending migrations
    for (const migration of migrations) {
      const executed = await this.db.get(
        'SELECT * FROM migrations WHERE name = ?',
        [migration.name]
      );

      if (!executed) {
        console.log(`🔄 Running migration: ${migration.name}`);
        await this.db.run(migration.up);
        await this.db.run(
          'INSERT INTO migrations (name) VALUES (?)',
          [migration.name]
        );
        console.log(`✅ Migration ${migration.name} completed`);
      }
    }
  }

  async close() {
    await this.db.close();
  }
}

// Main execution
async function main() {
  console.log('🚀 Bun 1.3 Unified SQL API Examples');

  // Test basic operations with different databases
  await basicDatabaseOperations('sqlite');
  await basicDatabaseOperations('postgresql').catch(() =>
    console.log('⚠️  PostgreSQL not available, skipping...')
  );
  await basicDatabaseOperations('mysql').catch(() =>
    console.log('⚠️  MySQL not available, skipping...')
  );

  // Transaction example
  await transactionExample();

  // Connection pool example
  await connectionPoolExample();

  // Migration example
  const migrator = new DatabaseMigrator('sqlite');
  await migrator.migrate();
  await migrator.close();

  console.log('\n✨ All SQL examples completed successfully!');
}

// Error handling for the main function
main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});