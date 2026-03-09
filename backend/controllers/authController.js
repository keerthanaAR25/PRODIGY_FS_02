const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logActivity } = require('../utils/activityLogger');
const logger = require('../utils/logger');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });

    // Only allow admin to create admin accounts; default new signups to 'employee'
    const assignedRole = ['manager', 'hr', 'employee'].includes(role) ? role : 'employee';

    const user = await User.create({ name, email, password, role: assignedRole, isActive: true });
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    user.refreshTokens.push({ token: refreshToken, device: req.headers['user-agent'] || 'unknown' });
    await user.save();

    await logActivity({ userId: user._id, userName: user.name, action: 'LOGIN', status: 'success', ip: req.ip });
    logger.info(`New user registered: ${email} (${assignedRole})`);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      message: 'Account created successfully!'
    });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} minutes.` });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      await user.incLoginAttempts();
      const remaining = 5 - (user.loginAttempts + 1);
      await logActivity({ userId: user._id, userName: user.name, action: 'LOGIN', status: 'failed', ip: req.ip });
      if (remaining <= 0) return res.status(423).json({ error: 'Account locked for 2 hours due to too many failed attempts.' });
      return res.status(401).json({ error: `Invalid credentials. ${remaining} attempts remaining.` });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens.push({ token: refreshToken, device: req.headers['user-agent'] || 'unknown' });
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    await logActivity({ userId: user._id, userName: user.name, action: 'LOGIN', status: 'success', ip: req.ip });

    res.json({
      accessToken,
      refreshToken: rememberMe ? refreshToken : undefined,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required.' });
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    const tokenExists = user.refreshTokens.find(t => t.token === refreshToken);
    if (!tokenExists) return res.status(401).json({ error: 'Invalid refresh token.' });
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id);
    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save();
    }
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'LOGOUT', status: 'success', ip: req.ip });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

// POST /api/auth/logout-all
exports.logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshTokens: [] } });
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) { next(err); }
};

// GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens -twoFactorOTP');
    res.json({ user });
  } catch (err) { next(err); }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -refreshTokens -twoFactorOTP');
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'UPDATE_PROFILE', status: 'success', ip: req.ip });
    res.json({ user, message: 'Profile updated!' });
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    await logActivity({ userId: user._id, userName: user.name, action: 'CHANGE_PASSWORD', status: 'success', ip: req.ip });
    res.json({ message: 'Password changed successfully!' });
  } catch (err) { next(err); }
};

// GET /api/auth/sessions
exports.getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('refreshTokens lastLogin');
    res.json({ sessions: user.refreshTokens, lastLogin: user.lastLogin });
  } catch (err) { next(err); }
};

// POST /api/auth/generate-otp
exports.generateOTP = async (req, res, next) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(req.user._id, { twoFactorOTP: { code: otp, expiresAt } });
    logger.info(`OTP for ${req.user.email}: ${otp}`);
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'GENERATE_OTP', status: 'success', ip: req.ip });
    res.json({ message: 'OTP generated!', otp, expiresAt });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.twoFactorOTP?.code) return res.status(400).json({ error: 'No OTP generated.' });
    if (user.twoFactorOTP.expiresAt < new Date()) return res.status(400).json({ error: 'OTP has expired.' });
    if (user.twoFactorOTP.code !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    await User.findByIdAndUpdate(req.user._id, { $unset: { twoFactorOTP: 1 } });
    await logActivity({ userId: req.user._id, userName: req.user.name, action: 'VERIFY_OTP', status: 'success', ip: req.ip });
    res.json({ message: 'OTP verified! 2FA confirmed.' });
  } catch (err) { next(err); }
};