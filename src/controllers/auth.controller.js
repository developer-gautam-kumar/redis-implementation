import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import {
  generateTokens, storeSession, storeRefreshToken,
  blacklistToken, clearSession
} from '../services/token.service.js';

// ── REGISTER ──────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user (password auto-hashed by model hook)
    const user = await User.create({ name, email, password });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save session and refresh token in Redis
    await storeSession(user._id, { id: user._id, name, email });
    await storeRefreshToken(user._id, refreshToken);

    res.status(201).json({
      message: 'Registered successfully',
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store session in Redis
    await storeSession(user._id, { id: user._id, name: user.name, email });
    await storeRefreshToken(user._id, refreshToken);

    res.json({
      message: 'Logged in successfully',
      accessToken,
      refreshToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    await blacklistToken(token);       // Block this token
    await clearSession(req.user.id);   // Remove session from Redis

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};