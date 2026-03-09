const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Activity = require('../models/Activity');

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [total, active, inactive, onLeave, terminated, newThisMonth, newLastMonth, deptStats, monthlyTrend, recentActivity] = await Promise.all([
      Employee.countDocuments({ isDeleted: false }),
      Employee.countDocuments({ isDeleted: false, status: 'Active' }),
      Employee.countDocuments({ isDeleted: false, status: 'Inactive' }),
      Employee.countDocuments({ isDeleted: false, status: 'On Leave' }),
      Employee.countDocuments({ isDeleted: false, status: 'Terminated' }),
      Employee.countDocuments({ isDeleted: false, createdAt: { $gte: thisMonth } }),
      Employee.countDocuments({ isDeleted: false, createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      Employee.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),
      Employee.aggregate([
        { $match: { isDeleted: false, joiningDate: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
        { $group: { _id: { year: { $year: '$joiningDate' }, month: { $month: '$joiningDate' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Activity.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const growthRate = newLastMonth > 0 ? (((newThisMonth - newLastMonth) / newLastMonth) * 100).toFixed(1) : newThisMonth > 0 ? 100 : 0;

    res.json({
      stats: { total, active, inactive, onLeave, terminated, newThisMonth, growthRate: parseFloat(growthRate) },
      deptStats,
      monthlyTrend,
      recentActivity
    });
  } catch (err) { next(err); }
};
