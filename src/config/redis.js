import { createClient } from 'redis';

// Create Redis client using URL from .env
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Log errors
redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

// Log success
redisClient.on('connect', () => {
  console.log('✅ Redis Connected');
});

// Actually connect
await redisClient.connect();

export default redisClient;