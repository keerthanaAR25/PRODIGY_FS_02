const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshTokens -twoFactorOTP');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
    logger.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

const managerOrAdmin = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Manager or Admin only.' });
  }
  next();
};

const hrOrAdmin = (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
};

module.exports = { protect, adminOnly, managerOrAdmin, hrOrAdmin };

