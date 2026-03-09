const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'manager', 'hr', 'employee'], default: 'employee' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  refreshTokens: [{ token: String, device: String, createdAt: { type: Date, default: Date.now } }],
  twoFactorOTP: { code: String, expiresAt: Date },
  lastLogin: { type: Date },
  preferences: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
