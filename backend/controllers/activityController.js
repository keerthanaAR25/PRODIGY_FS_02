const Activity = require('../models/Activity');

exports.getActivities = async (req, res, next) => {
  try {
    const { action, page = 1, limit = 20 } = req.query;
    const query = {};
    if (action) query.action = action;
    const total = await Activity.countDocuments(query);
    const activities = await Activity.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean();
    res.json({ activities, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getMyActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ activities });
  } catch (err) { next(err); }
};