const Activity = require('../models/Activity');
const logger = require('./logger');

const logActivity = async ({ userId, userName, action, target, targetId, details = {}, status = 'success', ip = '' }) => {
  try {
    await Activity.create({ userId, userName, action, target, targetId, details, status, ip });
  } catch (err) {
    logger.error('Activity log failed:', err.message);
  }
};

module.exports = { logActivity };