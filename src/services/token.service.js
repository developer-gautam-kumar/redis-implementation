import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';

const ACCESS_TTL  = 15 * 60;        // 15 minutes (in seconds)
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days (in seconds)

// ── Generate access + refresh tokens ──────────────────────────
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );

  return { accessToken, refreshToken };
};

// ── Save session data in Redis ─────────────────────────────────
// This way every request doesn't need to hit MongoDB
export const storeSession = async (userId, userData) => {
  await redisClient.setEx(
    `session:${userId}`,      // key name
    REFRESH_TTL,              // TTL in seconds
    JSON.stringify(userData)  // Redis only stores strings
  );
};

// ── Save refresh token in Redis ────────────────────────────────
export const storeRefreshToken = async (userId, token) => {
  await redisClient.setEx(`refresh:${userId}`, REFRESH_TTL, token);
};

// ── Get session from Redis ─────────────────────────────────────
export const getSession = async (userId) => {
  const data = await redisClient.get(`session:${userId}`);
  return data ? JSON.parse(data) : null;
};

// ── Blacklist a token when user logs out ───────────────────────
export const blacklistToken = async (token) => {
  const decoded = jwt.decode(token);
  // Only blacklist until token naturally expires
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redisClient.setEx(`blacklist:${token}`, ttl, '1');
  }
};

// ── Check if token is blacklisted ─────────────────────────────
export const isBlacklisted = async (token) => {
  const result = await redisClient.get(`blacklist:${token}`);
  return result !== null;
};

// ── Remove session + refresh token (on logout) ────────────────
export const clearSession = async (userId) => {
  await redisClient.del(`session:${userId}`);
  await redisClient.del(`refresh:${userId}`);
};