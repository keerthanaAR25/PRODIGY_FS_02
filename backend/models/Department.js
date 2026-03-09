const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  headName: { type: String, default: '' },
  budget: { type: Number, default: 0 },
  location: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  isActive: { type: Boolean, default: true },
  employeeCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
