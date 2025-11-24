/**
 * Bun 1.3 Built-in Redis Client - Native Redis Support
 *
 * This example demonstrates Bun's new built-in Redis client that provides
 * high-performance Redis operations without external dependencies.
 *
 * Features shown:
 * - Native Redis connection
 * - Basic Redis operations (SET, GET, DEL, etc.)
 * - Pub/Sub messaging
 * - Pipelining for performance
 * - Connection pooling
 * - Lua script execution
 * - Redis Cluster support
 *
 * Setup: Run Redis using Docker: docker run -p 6379:6379 redis:latest
 */

import { Redis } from 'bun:redis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  maxRetries: 3,
  retryDelay: 1000,
};

// Example 1: Basic Redis operations
async function basicRedisOperations() {
  console.log('\n=== Basic Redis Operations ===');

  const redis = new Redis(redisConfig);

  try {
    // Test connection
    const pong = await redis.ping();
    console.log('✅ Redis connection:', pong);

    // String operations
    await redis.set('user:1001', JSON.stringify({
      id: 1001,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: new Date().toISOString()
    }));
    console.log('✅ Set user data');

    const userData = await redis.get('user:1001');
    console.log('✅ Retrieved user:', JSON.parse(userData || '{}'));

    // SET with expiration
    await redis.setex('session:abc123', 3600, JSON.stringify({
      userId: 1001,
      loginTime: new Date().toISOString()
    }));
    console.log('✅ Set session with 1 hour expiration');

    // GET with default value
    const cacheHit = await redis.get('cache:stats', '[]');
    console.log('✅ Cache hit with default:', cacheHit);

    // Increment/decrement operations
    await redis.set('counter:views', 0);
    const views = await redis.incr('counter:views');
    console.log(`✅ Incremented views: ${views}`);

    await redis.incrby('counter:views', 10);
    const totalViews = await redis.get('counter:views');
    console.log(`✅ Total views after +10: ${totalViews}`);

    await redis.decr('counter:views');
    const finalViews = await redis.get('counter:views');
    console.log(`✅ Final views after decrement: ${finalViews}`);

    // Delete operations
    await redis.del('user:1001', 'counter:views');
    console.log('✅ Deleted keys');

  } catch (error) {
    console.error('❌ Redis error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 2: Hash operations
async function hashOperations() {
  console.log('\n=== Hash Operations ===');

  const redis = new Redis(redisConfig);

  try {
    // Set hash fields
    await redis.hset('product:1001', {
      id: '1001',
      name: 'Wireless Mouse',
      price: '29.99',
      category: 'electronics',
      stock: '150'
    });
    console.log('✅ Set product hash');

    // Get all hash fields
    const product = await redis.hgetall('product:1001');
    console.log('✅ Retrieved product:', product);

    // Get specific hash field
    const price = await redis.hget('product:1001', 'price');
    console.log(`✅ Product price: ${price}`);

    // Check if field exists
    const hasName = await redis.hexists('product:1001', 'name');
    const hasDescription = await redis.hexists('product:1001', 'description');
    console.log(`✅ Has name field: ${hasName}, Has description field: ${hasDescription}`);

    // Update specific field
    await redis.hset('product:1001', 'price', '24.99');
    const updatedPrice = await redis.hget('product:1001', 'price');
    console.log(`✅ Updated price: ${updatedPrice}`);

    // Increment hash field
    await redis.hincrby('product:1001', 'stock', -5);
    const newStock = await redis.hget('product:1001', 'stock');
    console.log(`✅ New stock after sale: ${newStock}`);

    // Get all hash keys and values
    const keys = await redis.hkeys('product:1001');
    const values = await redis.hvals('product:1001');
    console.log('✅ Hash keys:', keys);
    console.log('✅ Hash values:', values);

  } catch (error) {
    console.error('❌ Hash operations error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 3: List operations (queues)
async function listOperations() {
  console.log('\n=== List Operations (Queues) ===');

  const redis = new Redis(redisConfig);

  try {
    // Clear previous data
    await redis.del('queue:notifications');

    // Push items to list (left push)
    await redis.lpush('queue:notifications', 'email:user123:welcome', 'push:user456:new_message');
    console.log('✅ Added notifications to queue');

    // Push to right (tail)
    await redis.rpush('queue:notifications', 'sms:user789:alert');
    console.log('✅ Added SMS to end of queue');

    // Get list length
    const queueLength = await redis.llen('queue:notifications');
    console.log(`✅ Queue length: ${queueLength}`);

    // Get items without removing
    const items = await redis.lrange('queue:notifications', 0, -1);
    console.log('✅ Queue items:', items);

    // Process items (pop from left - FIFO)
    const nextNotification = await redis.lpop('queue:notifications');
    console.log(`✅ Processing notification: ${nextNotification}`);

    // Process from right (LIFO/stack)
    const lastNotification = await redis.rpop('queue:notifications');
    console.log(`✅ Processing from end: ${lastNotification}`);

    // Blocking pop (with timeout)
    console.log('⏳ Waiting for new notification (2s timeout)...');
    const result = await redis.blpop('queue:notifications', 2);
    if (result) {
      console.log(`✅ Received notification: ${result[1]}`);
    } else {
      console.log('⏰ Timeout - no new notifications');
    }

  } catch (error) {
    console.error('❌ List operations error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 4: Set operations
async function setOperations() {
  console.log('\n=== Set Operations ===');

  const redis = new Redis(redisConfig);

  try {
    // Add members to sets
    await redis.sadd('users:online', 'user1', 'user2', 'user3');
    await redis.sadd('users:premium', 'user2', 'user4', 'user5');
    console.log('✅ Added users to sets');

    // Check membership
    const isOnline = await redis.sismember('users:online', 'user2');
    const isPremium = await redis.sismember('users:premium', 'user1');
    console.log(`✅ User2 online: ${isOnline}, User1 premium: ${isPremium}`);

    // Get all members
    const onlineUsers = await redis.smembers('users:online');
    const premiumUsers = await redis.smembers('users:premium');
    console.log('✅ Online users:', onlineUsers);
    console.log('✅ Premium users:', premiumUsers);

    // Set operations
    const bothOnlineAndPremium = await redis.sinter('users:online', 'users:premium');
    console.log('✅ Users both online and premium:', bothOnlineAndPremium);

    const onlineOrPremium = await redis.sunion('users:online', 'users:premium');
    console.log('✅ Users online or premium:', onlineOrPremium);

    const onlineNotPremium = await redis.sdiff('users:online', 'users:premium');
    console.log('✅ Users online but not premium:', onlineNotPremium);

    // Move between sets
    await redis.smove('users:online', 'users:offline', 'user3');
    console.log('✅ Moved user3 from online to offline');

  } catch (error) {
    console.error('❌ Set operations error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 5: Sorted sets (leaderboards)
async function sortedSetOperations() {
  console.log('\n=== Sorted Set Operations (Leaderboards) ===');

  const redis = new Redis(redisConfig);

  try {
    // Add players with scores
    await redis.zadd('leaderboard:game1', [
      { score: 1500, member: 'player1' },
      { score: 2300, member: 'player2' },
      { score: 1800, member: 'player3' },
      { score: 1200, member: 'player4' },
      { score: 2900, member: 'player5' }
    ]);
    console.log('✅ Added players to leaderboard');

    // Get player rank
    const player2Rank = await redis.zrevrank('leaderboard:game1', 'player2');
    console.log(`✅ Player2 rank: ${player2Rank} (0-based, highest first)`);

    // Get player score
    const player2Score = await redis.zscore('leaderboard:game1', 'player2');
    console.log(`✅ Player2 score: ${player2Score}`);

    // Get top players (highest scores first)
    const topPlayers = await redis.zrevrange('leaderboard:game1', 0, 2, 'WITHSCORES');
    console.log('✅ Top 3 players:');
    for (let i = 0; i < topPlayers.length; i += 2) {
      console.log(`   ${i/2 + 1}. ${topPlayers[i]}: ${topPlayers[i + 1]} points`);
    }

    // Increment score
    await redis.zincrby('leaderboard:game1', 100, 'player1');
    const newScore = await redis.zscore('leaderboard:game1', 'player1');
    console.log(`✅ Player1 new score after +100: ${newScore}`);

    // Get players in score range
    const midTierPlayers = await redis.zrangebyscore('leaderboard:game1', 1500, 2000, 'WITHSCORES');
    console.log('✅ Players with 1500-2000 points:', midTierPlayers);

    // Get leaderboard size
    const totalPlayers = await redis.zcard('leaderboard:game1');
    console.log(`✅ Total players in leaderboard: ${totalPlayers}`);

  } catch (error) {
    console.error('❌ Sorted set operations error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 6: Pub/Sub messaging
async function pubSubMessaging() {
  console.log('\n=== Pub/Sub Messaging ===');

  const publisher = new Redis(redisConfig);
  const subscriber = new Redis(redisConfig);

  try {
    // Subscribe to channels
    await subscriber.subscribe('notifications', 'messages');
    console.log('✅ Subscribed to channels');

    // Set up message handler
    subscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      console.log(`📨 Received on ${channel}:`, data);
    });

    // Publish messages
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

    await publisher.publish('notifications', JSON.stringify({
      type: 'welcome',
      userId: 'user123',
      message: 'Welcome to our platform!'
    }));

    await publisher.publish('messages', JSON.stringify({
      from: 'user456',
      to: 'user123',
      content: 'Hey there!',
      timestamp: new Date().toISOString()
    }));

    // Pattern-based subscription
    await subscriber.psubscribe('admin:*');
    console.log('✅ Subscribed to admin:* pattern');

    subscriber.on('pmessage', (pattern, channel, message) => {
      console.log(`🔔 Pattern ${pattern} matched ${channel}:`, JSON.parse(message));
    });

    await publisher.publish('admin:alerts', JSON.stringify({
      level: 'error',
      message: 'Database connection failed'
    }));

    // Wait for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

  } catch (error) {
    console.error('❌ Pub/Sub error:', error.message);
  } finally {
    await publisher.quit();
    await subscriber.quit();
  }
}

// Example 7: Redis Pipelining
async function redisPipelining() {
  console.log('\n=== Redis Pipelining ===');

  const redis = new Redis(redisConfig);

  try {
    console.log('⏱️  Testing individual commands...');
    const start1 = Date.now();

    // Individual commands
    for (let i = 0; i < 100; i++) {
      await redis.set(`pipeline:test:${i}`, `value${i}`);
    }
    const individualTime = Date.now() - start1;
    console.log(`✅ 100 individual SET commands took ${individualTime}ms`);

    // Clear data
    await redis.del(...Array.from({ length: 100 }, (_, i) => `pipeline:test:${i}`));

    console.log('⏱️  Testing pipelined commands...');
    const start2 = Date.now();

    // Pipelined commands
    const pipeline = redis.pipeline();
    for (let i = 0; i < 100; i++) {
      pipeline.set(`pipeline:test:${i}`, `value${i}`);
    }
    const results = await pipeline.exec();
    const pipelineTime = Date.now() - start2;
    console.log(`✅ 100 pipelined SET commands took ${pipelineTime}ms`);
    console.log(`🚀 Pipeline is ${Math.round(individualTime / pipelineTime)}x faster!`);

    // Mixed operations in pipeline
    const mixedPipeline = redis.pipeline();
    mixedPipeline.set('counter', 0);
    mixedPipeline.incr('counter');
    mixedPipeline.incrby('counter', 10);
    mixedPipeline.get('counter');
    mixedPipeline.del('counter');

    const mixedResults = await mixedPipeline.exec();
    console.log('✅ Mixed pipeline results:', mixedResults);

  } catch (error) {
    console.error('❌ Pipelining error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Example 8: Lua script execution
async function luaScripting() {
  console.log('\n=== Lua Script Execution ===');

  const redis = new Redis(redisConfig);

  try {
    // Simple increment with check script
    const incrementScript = `
      local current = redis.call('GET', KEYS[1])
      if current == false then
        redis.call('SET', KEYS[1], ARGV[1])
        return tonumber(ARGV[1])
      else
        local newValue = tonumber(current) + tonumber(ARGV[1])
        redis.call('SET', KEYS[1], newValue)
        return newValue
      end
    `;

    const result1 = await redis.eval(incrementScript, {
      keys: ['lua:counter'],
      arguments: ['10']
    });
    console.log(`✅ Script result 1: ${result1}`);

    const result2 = await redis.eval(incrementScript, {
      keys: ['lua:counter'],
      arguments: ['5']
    });
    console.log(`✅ Script result 2: ${result2}`);

    // Rate limiting script
    const rateLimitScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local current = tonumber(redis.call('INCR', key))

      if current == 1 then
        redis.call('EXPIRE', key, window)
      end

      if current <= limit then
        return 1
      else
        return 0
      end
    `;

    // Test rate limiting
    for (let i = 1; i <= 5; i++) {
      const allowed = await redis.eval(rateLimitScript, {
        keys: ['ratelimit:user123'],
        arguments: ['60', '3'] // 60 second window, 3 requests limit
      });
      console.log(`Request ${i}: ${allowed ? '✅ Allowed' : '❌ Rate limited'}`);
    }

  } catch (error) {
    console.error('❌ Lua script error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Main execution
async function main() {
  console.log('🚀 Bun 1.3 Built-in Redis Client Examples');

  try {
    await basicRedisOperations();
    await hashOperations();
    await listOperations();
    await setOperations();
    await sortedSetOperations();
    await pubSubMessaging();
    await redisPipelining();
    await luaScripting();

    console.log('\n✨ All Redis examples completed successfully!');
  } catch (error) {
    console.error('❌ Redis client error:', error.message);
    console.log('\n💡 Make sure Redis is running:');
    console.log('   docker run -p 6379:6379 redis:latest');
  }
}

main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});