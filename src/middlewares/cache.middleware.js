import redisClient from '../config/redis.js';

// ── Cache GET responses ────────────────────────────────────────
const cacheMiddleware = (ttl = 60) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await redisClient.get(key);

    if (cached) {
      // Data found in Redis — return immediately, skip MongoDB
      console.log(`🔵 Cache HIT: ${key}`);
      return res.status(200).json(JSON.parse(cached));
    }

    // Not in Redis — let the request continue to MongoDB
    console.log(`🟡 Cache MISS: ${key}`);

    // Intercept res.json to save response into Redis
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode === 200) {
        await redisClient.setEx(key, ttl, JSON.stringify(body));
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error('Cache error:', err);
    next(); // If Redis fails, still serve from MongoDB
  }
};

// ── Delete all cache keys matching a pattern ───────────────────
export const invalidateCache = async (pattern) => {
  const keys = await redisClient.keys(`cache:${pattern}*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
    console.log(`🗑️  Cache cleared:`, keys);
  }
};

export default cacheMiddleware;