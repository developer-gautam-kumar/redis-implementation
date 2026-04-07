import express from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';
import rateLimiter from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', rateLimiter({ windowSec: 60, maxRequests: 5, keyPrefix: 'rl:login' }), login);
router.post('/logout', protect, logout);

export default router;