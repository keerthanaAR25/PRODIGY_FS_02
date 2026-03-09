const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  action: {
    type: String,
    enum: ['LOGIN','LOGOUT','CREATE_EMPLOYEE','UPDATE_EMPLOYEE','DELETE_EMPLOYEE','RESTORE_EMPLOYEE',
           'HARD_DELETE','BULK_DELETE','BULK_UPDATE','EXPORT','IMPORT','CREATE_DEPARTMENT',
           'UPDATE_DEPARTMENT','DELETE_DEPARTMENT','CHANGE_PASSWORD','UPDATE_PROFILE','GENERATE_OTP','VERIFY_OTP'],
    required: true
  },
  target: { type: String, default: '' },
  targetId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  ip: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
