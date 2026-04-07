import jwt from 'jsonwebtoken';
import { getSession, isBlacklisted } from '../services/token.service.js';

const protect = async (req, res, next) => {
  try {
    // Get token from header: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, please login' });
    }

    // Is this token blacklisted (logged out)?
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ message: 'Token revoked, please login again' });
    }

    // Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user data from Redis (avoids MongoDB call on every request)
    const session = await getSession(decoded.id);
    if (!session) {
      return res.status(401).json({ message: 'Session expired, please login' });
    }

    req.user = session; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default protect;