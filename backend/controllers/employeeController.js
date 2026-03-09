const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { logActivity } = require('../utils/activityLogger');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

// GET /api/employees
exports.getEmployees = async (req, res, next) => {
  try {
    const { search, department, status, employmentType, sort, page = 1, limit = 10, deleted } = req.query;
    const query = { isDeleted: deleted === 'true' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;

    const sortMap = {
      'newest': { createdAt: -1 }, 'oldest': { createdAt: 1 },
      'name_asc': { name: 1 }, 'name_desc': { name: -1 },
      'salary_high': { salary: -1 }, 'salary_low': { salary: 1 }
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Employee.countDocuments(query);
    let employees = await Employee.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean();

    // Hide salary from non-admins
    if (req.user.role !== 'admin') {
      employees = employees.map(e => { const { salary, ...rest } = e; return rest; });
    }

    res.json({ employees, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// GET /api/employees/:id
exports.getEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id).lean();
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });
    if (req.user.role !== 'admin') { delete emp.salary; delete emp.notes; }
    res.json({ employee: emp });
  } catch (err) { next(err); }
};

// POST /api/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    if (data.firstName && data.lastName) data.name = `${data.firstName} ${data.lastName}`;
    const emp = await Employee.create(data);
    await Department.findOneAndUpdate({ name: data.department }, { $inc: { employeeCount: 1 } });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'CREATE_EMPLOYEE', target: emp.name, targetId: emp._id.toString(), status: 'success', ip: req.ip });
    res.status(201).json({ employee: emp, message: 'Employee created successfully!' });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    if (data.firstName && data.lastName) data.name = `${data.firstName} ${data.lastName}`;
    const existing = await Employee.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Employee not found.' });

    if (data.status && data.status !== existing.status) {
      data.$push = { statusHistory: { status: data.status, changedBy: req.user.name, reason: data.statusReason || '' } };
    }
    const emp = await Employee.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'UPDATE_EMPLOYEE', target: emp.name, targetId: emp._id.toString(), status: 'success', ip: req.ip });
    res.json({ employee: emp, message: 'Employee updated successfully!' });
  } catch (err) { next(err); }
};

// DELETE /api/employees/:id (soft delete)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });
    await Department.findOneAndUpdate({ name: emp.department }, { $inc: { employeeCount: -1 } });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'DELETE_EMPLOYEE', target: emp.name, targetId: emp._id.toString(), status: 'success', ip: req.ip });
    res.json({ message: `${emp.name} moved to trash.` });
  } catch (err) { next(err); }
};

// PATCH /api/employees/:id/restore
exports.restoreEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, { isDeleted: false, deletedAt: null }, { new: true });
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });
    await Department.findOneAndUpdate({ name: emp.department }, { $inc: { employeeCount: 1 } });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'RESTORE_EMPLOYEE', target: emp.name, status: 'success', ip: req.ip });
    res.json({ employee: emp, message: `${emp.name} restored successfully!` });
  } catch (err) { next(err); }
};

// DELETE /api/employees/:id/hard
exports.hardDelete = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'HARD_DELETE', target: emp.name, status: 'success', ip: req.ip });
    res.json({ message: `${emp.name} permanently deleted.` });
  } catch (err) { next(err); }
};

// POST /api/employees/:id/notes
exports.addNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    const emp = await Employee.findByIdAndUpdate(req.params.id,
      { $push: { notes: { text, addedBy: req.user.name } } }, { new: true });
    res.json({ employee: emp, message: 'Note added.' });
  } catch (err) { next(err); }
};

// POST /api/employees/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided.' });
    const result = await Employee.updateMany({ _id: { $in: ids } }, { isDeleted: true, deletedAt: new Date() });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'BULK_DELETE', details: { count: result.modifiedCount }, status: 'success', ip: req.ip });
    res.json({ message: `${result.modifiedCount} employees moved to trash.` });
  } catch (err) { next(err); }
};

// POST /api/employees/bulk-update
exports.bulkUpdate = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided.' });
    const result = await Employee.updateMany({ _id: { $in: ids } }, updates);
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'BULK_UPDATE', details: { count: result.modifiedCount, updates }, status: 'success', ip: req.ip });
    res.json({ message: `${result.modifiedCount} employees updated.` });
  } catch (err) { next(err); }
};

// POST /api/employees/bulk-import
exports.bulkImport = async (req, res, next) => {
  try {
    const { employees } = req.body;
    if (!employees || !employees.length) return res.status(400).json({ error: 'No data provided.' });
    let imported = 0, failed = 0, errors = [];
    for (const empData of employees) {
      try {
        if (empData.firstName && empData.lastName) empData.name = `${empData.firstName} ${empData.lastName}`;
        else if (empData.name && !empData.firstName) {
          const parts = empData.name.split(' ');
          empData.firstName = parts[0];
          empData.lastName = parts.slice(1).join(' ') || parts[0];
        }
        await Employee.create(empData);
        imported++;
      } catch (e) {
        failed++;
        errors.push({ row: empData.email || empData.name, error: e.message });
      }
    }
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'IMPORT', details: { imported, failed }, status: 'success', ip: req.ip });
    res.json({ imported, failed, errors, message: `Imported ${imported} employees${failed ? `, ${failed} failed` : ''}.` });
  } catch (err) { next(err); }
};

// GET /api/employees/export?format=csv|excel|json
exports.exportEmployees = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    const employees = await Employee.find({ isDeleted: false }).lean();
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'EXPORT', details: { format, count: employees.length }, status: 'success', ip: req.ip });

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename=employees_${Date.now()}.json`);
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify(employees, null, 2));
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Employees');
      ws.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 14 },
        { header: 'Name', key: 'name', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Phone', key: 'phone', width: 16 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Role', key: 'role', width: 22 },
        { header: 'Salary', key: 'salary', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Employment Type', key: 'employmentType', width: 16 },
        { header: 'Joining Date', key: 'joiningDate', width: 14 }
      ];
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      employees.forEach(e => ws.addRow({ ...e, joiningDate: e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '' }));
      res.setHeader('Content-Disposition', `attachment; filename=employees_${Date.now()}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return await wb.xlsx.write(res);
    }

    // CSV
    const headers = ['employeeId','name','email','phone','department','role','salary','status','employmentType','joiningDate'];
    const csv = [
      headers.join(','),
      ...employees.map(e => headers.map(h => `"${(e[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    res.setHeader('Content-Disposition', `attachment; filename=employees_${Date.now()}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/employees/dept-stats
exports.getDeptStats = async (req, res, next) => {
  try {
    const stats = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' }, activeCount: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ stats });
  } catch (err) { next(err); }
};
