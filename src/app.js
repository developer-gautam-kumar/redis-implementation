import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import './config/redis.js'; // Just importing connects Redis
import rateLimiter from './middlewares/rateLimiter.middleware.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';

dotenv.config(); // Load .env variables first

const app = express();

app.use(express.json()); // Parse JSON request bodies

// Global rate limiter — applies to all routes
app.use(rateLimiter({ windowSec: 60, maxRequests: 100 }));

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: '🚀 Server is running' }));

// Connect MongoDB then start server
connectDB().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });
});