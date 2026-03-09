
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');
router.get('/stats', protect, getStats);
module.exports = router;
