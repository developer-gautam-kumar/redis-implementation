import redisClient from '../config/redis.js';

const rateLimiter = ({
  windowSec = 60,     // Time window
  maxRequests = 100,  // Max allowed requests in window
  keyPrefix = 'rl'    // Prefix to organize Redis keys
} = {}) => async (req, res, next) => {

  // Use userId if logged in, otherwise use IP address
  const identifier = req.user?.id || req.ip;
  const key = `${keyPrefix}:${identifier}`;

  try {
    const count = await redisClient.incr(key); // Add 1 to counter

    // Set expiry only on first request
    if (count === 1) {
      await redisClient.expire(key, windowSec);
    }

    // Tell client how many requests they have left
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

    if (count > maxRequests) {
      const retryAfter = await redisClient.ttl(key);
      return res.status(429).json({
        message: `Too many requests. Try again in ${retryAfter} seconds.`
      });
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    next(); // If Redis fails, allow the request
  }
};

export default rateLimiter;