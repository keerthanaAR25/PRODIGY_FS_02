const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.post('/logout-all', protect, ctrl.logoutAll);
router.get('/profile', protect, ctrl.getProfile);
router.put('/profile', protect, upload.single('avatar'), ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);
router.get('/sessions', protect, ctrl.getSessions);
router.post('/generate-otp', protect, ctrl.generateOTP);
router.post('/verify-otp', protect, ctrl.verifyOTP);

module.exports = router;