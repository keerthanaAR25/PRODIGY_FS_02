const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  changedBy: String,
  changedAt: { type: Date, default: Date.now },
  reason: String
});

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  department: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  role: { type: String, required: true },
  salary: { type: Number, default: 0 },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'], default: 'Active' },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Remote'], default: 'Full-time' },
  avatar: { type: String, default: '' },
  skills: [String],
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  managerName: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { name: String, phone: String, relation: String },
  notes: [{ text: String, addedBy: String, addedAt: { type: Date, default: Date.now } }],
  statusHistory: [statusHistorySchema],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  performance: { rating: { type: Number, default: 0 }, lastReview: Date }
}, { timestamps: true });

// Auto-generate name and employeeId
employeeSchema.pre('save', async function (next) {
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);