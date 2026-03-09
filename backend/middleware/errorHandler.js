const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} | ${req.method} ${req.path}`);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${field} already exists.` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
