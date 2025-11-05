/**
 * Module 8: Concurrency & Reliability - Double Voting Prevention
 * 
 * Prevent duplicate votes, likes, and other single-action operations.
 * Essential for social features, polls, and user interactions.
 * 
 * Key Concepts:
 * - Duplicate action detection
 * - Composite keys (user + resource)
 * - Transaction-like operations
 * - Atomic check-and-set
 * - Time-based limits
 * 
 * Use Cases:
 * - Voting systems
 * - Like/favorite buttons
 * - Poll responses
 * - One-time actions
 * - Form submissions
 * 
 * Run: bun run 08-concurrency-reliability/03-double-voting.ts
 * Test:
 *   # Try to vote twice (should be prevented)
 *   curl -X POST http://localhost:3000/polls/1/vote -H "Content-Type: application/json" -H "X-User-ID: user1" -d '{"option":"A"}'
 *   curl -X POST http://localhost:3000/polls/1/vote -H "Content-Type: application/json" -H "X-User-ID: user1" -d '{"option":"B"}'
 *   
 *   # Change vote (if allowed)
 *   curl -X PUT http://localhost:3000/polls/1/vote -H "Content-Type: application/json" -H "X-User-ID: user1" -d '{"option":"B"}'
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================================================
// Voting System with Double-Vote Prevention
// ============================================================================

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Map<string, string>; // userId -> option
  allowChangeVote: boolean;
  voteCounts: Record<string, number>;
  createdAt: string;
}

const polls = new Map<string, Poll>([
  ['1', {
    id: '1',
    question: 'What is your favorite programming language?',
    options: ['JavaScript', 'TypeScript', 'Python', 'Rust'],
    votes: new Map(),
    allowChangeVote: false,
    voteCounts: { JavaScript: 0, TypeScript: 0, Python: 0, Rust: 0 },
    createdAt: new Date().toISOString()
  }],
  ['2', {
    id: '2',
    question: 'Best web framework?',
    options: ['Express', 'Hono', 'Fastify', 'Koa'],
    votes: new Map(),
    allowChangeVote: true,
    voteCounts: { Express: 0, Hono: 0, Fastify: 0, Koa: 0 },
    createdAt: new Date().toISOString()
  }]
]);

app.get('/polls/:id', (c) => {
  const id = c.req.param('id');
  const poll = polls.get(id);
  
  if (!poll) {
    return c.json({ error: 'Poll not found' }, 404);
  }
  
  return c.json({
    id: poll.id,
    question: poll.question,
    options: poll.options,
    voteCounts: poll.voteCounts,
    totalVotes: poll.votes.size,
    allowChangeVote: poll.allowChangeVote
  });
});

app.post('/polls/:id/vote', async (c) => {
  const pollId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  const body = await c.req.json();
  const option = body.option;
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const poll = polls.get(pollId);
  
  if (!poll) {
    return c.json({ error: 'Poll not found' }, 404);
  }
  
  if (!poll.options.includes(option)) {
    return c.json({
      error: 'Invalid option',
      validOptions: poll.options
    }, 400);
  }
  
  // Check if user already voted
  const existingVote = poll.votes.get(userId);
  
  if (existingVote) {
    return c.json({
      error: 'Already voted',
      message: 'You have already voted in this poll',
      yourVote: existingVote,
      hint: poll.allowChangeVote ? 'Use PUT /polls/:id/vote to change your vote' : 'Vote cannot be changed'
    }, 409); // 409 Conflict
  }
  
  // Record vote
  poll.votes.set(userId, option);
  poll.voteCounts[option]++;
  
  return c.json({
    success: true,
    message: 'Vote recorded',
    vote: {
      poll: pollId,
      option,
      userId
    },
    currentResults: poll.voteCounts
  }, 201);
});

app.put('/polls/:id/vote', async (c) => {
  const pollId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  const body = await c.req.json();
  const newOption = body.option;
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const poll = polls.get(pollId);
  
  if (!poll) {
    return c.json({ error: 'Poll not found' }, 404);
  }
  
  if (!poll.allowChangeVote) {
    return c.json({
      error: 'Vote changes not allowed',
      message: 'This poll does not allow changing votes'
    }, 403);
  }
  
  if (!poll.options.includes(newOption)) {
    return c.json({
      error: 'Invalid option',
      validOptions: poll.options
    }, 400);
  }
  
  const oldOption = poll.votes.get(userId);
  
  if (!oldOption) {
    return c.json({
      error: 'No existing vote',
      message: 'You must vote first before changing',
      hint: 'Use POST /polls/:id/vote'
    }, 404);
  }
  
  if (oldOption === newOption) {
    return c.json({
      message: 'Vote unchanged',
      vote: newOption
    });
  }
  
  // Update vote
  poll.votes.set(userId, newOption);
  poll.voteCounts[oldOption]--;
  poll.voteCounts[newOption]++;
  
  return c.json({
    success: true,
    message: 'Vote changed',
    previousVote: oldOption,
    newVote: newOption,
    currentResults: poll.voteCounts
  });
});

app.delete('/polls/:id/vote', (c) => {
  const pollId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const poll = polls.get(pollId);
  
  if (!poll) {
    return c.json({ error: 'Poll not found' }, 404);
  }
  
  const option = poll.votes.get(userId);
  
  if (!option) {
    return c.json({ error: 'No vote to remove' }, 404);
  }
  
  poll.votes.delete(userId);
  poll.voteCounts[option]--;
  
  return c.json({
    success: true,
    message: 'Vote removed',
    removedVote: option
  });
});

// ============================================================================
// Like/Favorite System
// ============================================================================

interface Post {
  id: string;
  content: string;
  likes: Set<string>; // userId set
  likesCount: number;
}

const posts = new Map<string, Post>([
  ['post1', {
    id: 'post1',
    content: 'Learning Bun and Hono!',
    likes: new Set(),
    likesCount: 0
  }]
]);

app.post('/posts/:id/like', (c) => {
  const postId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const post = posts.get(postId);
  
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  
  // Check if already liked
  if (post.likes.has(userId)) {
    return c.json({
      error: 'Already liked',
      message: 'You have already liked this post',
      likesCount: post.likesCount
    }, 409);
  }
  
  // Add like
  post.likes.add(userId);
  post.likesCount = post.likes.size;
  
  return c.json({
    success: true,
    message: 'Post liked',
    likesCount: post.likesCount
  }, 201);
});

app.delete('/posts/:id/like', (c) => {
  const postId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const post = posts.get(postId);
  
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  
  if (!post.likes.has(userId)) {
    return c.json({
      message: 'Already not liked',
      likesCount: post.likesCount
    });
  }
  
  post.likes.delete(userId);
  post.likesCount = post.likes.size;
  
  return c.json({
    success: true,
    message: 'Like removed',
    likesCount: post.likesCount
  });
});

app.get('/posts/:id', (c) => {
  const postId = c.req.param('id');
  const userId = c.req.header('X-User-ID');
  const post = posts.get(postId);
  
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  
  return c.json({
    id: post.id,
    content: post.content,
    likesCount: post.likesCount,
    likedByYou: userId ? post.likes.has(userId) : false
  });
});

// ============================================================================
// Time-Limited Actions (e.g., daily rewards)
// ============================================================================

interface UserAction {
  userId: string;
  action: string;
  timestamp: number;
}

const dailyRewards = new Map<string, UserAction>();

app.post('/daily-reward', (c) => {
  const userId = c.req.header('X-User-ID');
  
  if (!userId) {
    return c.json({ error: 'X-User-ID header required' }, 400);
  }
  
  const key = `${userId}:daily-reward`;
  const lastClaim = dailyRewards.get(key);
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (lastClaim) {
    const timeSinceLastClaim = now - lastClaim.timestamp;
    
    if (timeSinceLastClaim < oneDayMs) {
      const hoursUntilNext = Math.ceil((oneDayMs - timeSinceLastClaim) / (60 * 60 * 1000));
      
      return c.json({
        error: 'Reward already claimed',
        message: 'You have already claimed your daily reward',
        lastClaimed: new Date(lastClaim.timestamp).toISOString(),
        nextAvailable: new Date(lastClaim.timestamp + oneDayMs).toISOString(),
        hoursUntilNext
      }, 429); // 429 Too Many Requests
    }
  }
  
  // Grant reward
  dailyRewards.set(key, {
    userId,
    action: 'daily-reward',
    timestamp: now
  });
  
  return c.json({
    success: true,
    message: 'Daily reward claimed!',
    reward: { coins: 100, gems: 5 },
    claimedAt: new Date(now).toISOString(),
    nextAvailable: new Date(now + oneDayMs).toISOString()
  }, 201);
});

// ============================================================================
// Root Endpoint
// ============================================================================

app.get('/', (c) => {
  return c.json({
    message: 'Double Voting Prevention Examples',
    endpoints: {
      polls: {
        get: 'GET /polls/:id',
        vote: 'POST /polls/:id/vote (requires X-User-ID header)',
        changeVote: 'PUT /polls/:id/vote (if allowed)',
        removeVote: 'DELETE /polls/:id/vote'
      },
      likes: {
        get: 'GET /posts/:id',
        like: 'POST /posts/:id/like (requires X-User-ID)',
        unlike: 'DELETE /posts/:id/like'
      },
      timeLimited: {
        claim: 'POST /daily-reward (once per 24 hours)'
      }
    },
    availablePolls: Array.from(polls.values()).map(p => ({
      id: p.id,
      question: p.question,
      allowChangeVote: p.allowChangeVote
    })),
    techniques: {
      compositeKeys: 'Use userId + resourceId as unique identifier',
      sets: 'Use Set data structure for unique values',
      timeLimits: 'Track timestamp and enforce cooldown periods',
      statusCodes: 'Return 409 Conflict for duplicate actions, 429 for rate limits'
    }
  });
});

console.log('🗳️  Double Voting Prevention server running on http://localhost:3000');
console.log('\nTest voting:');
console.log('  curl -X POST http://localhost:3000/polls/1/vote -H "X-User-ID: user1" -H "Content-Type: application/json" -d \'{"option":"TypeScript"}\'');
console.log('  curl -X POST http://localhost:3000/polls/1/vote -H "X-User-ID: user1" -H "Content-Type: application/json" -d \'{"option":"Rust"}\'  # Will fail');
console.log('\nTest likes:');
console.log('  curl -X POST http://localhost:3000/posts/post1/like -H "X-User-ID: user1"');
console.log('  curl -X POST http://localhost:3000/posts/post1/like -H "X-User-ID: user1"  # Will fail');

export default app;
