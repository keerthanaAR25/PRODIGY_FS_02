const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { logActivity } = require('../utils/activityLogger');

// GET /api/departments
exports.getDepartments = async (req, res, next) => {
  try {
    const deps = await Department.find().sort({ name: 1 }).lean();
    // Attach live count
    const counts = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = { count: c.count, avgSalary: Math.round(c.avgSalary || 0) }; });
    const result = deps.map(d => ({ ...d, employeeCount: countMap[d.name]?.count || 0, avgSalary: countMap[d.name]?.avgSalary || 0 }));
    res.json({ departments: result });
  } catch (err) { next(err); }
};

// POST /api/departments
exports.createDepartment = async (req, res, next) => {
  try {
    const dep = await Department.create(req.body);
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'CREATE_DEPARTMENT', target: dep.name, status: 'success', ip: req.ip });
    res.status(201).json({ department: dep, message: 'Department created!' });
  } catch (err) { next(err); }
};

// PUT /api/departments/:id
exports.updateDepartment = async (req, res, next) => {
  try {
    const dep = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dep) return res.status(404).json({ error: 'Department not found.' });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'UPDATE_DEPARTMENT', target: dep.name, status: 'success', ip: req.ip });
    res.json({ department: dep, message: 'Department updated!' });
  } catch (err) { next(err); }
};

// DELETE /api/departments/:id
exports.deleteDepartment = async (req, res, next) => {
  try {
    const dep = await Department.findById(req.params.id);
    if (!dep) return res.status(404).json({ error: 'Department not found.' });
    const empCount = await Employee.countDocuments({ department: dep.name, isDeleted: false });
    if (empCount > 0) return res.status(400).json({ error: `Cannot delete department with ${empCount} active employees.` });
    await dep.deleteOne();
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'DELETE_DEPARTMENT', target: dep.name, status: 'success', ip: req.ip });
    res.json({ message: 'Department deleted.' });
  } catch (err) { next(err); }
};
