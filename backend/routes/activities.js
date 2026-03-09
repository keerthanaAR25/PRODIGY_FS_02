const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/activityController');
router.get('/', protect, adminOnly, ctrl.getActivities);
router.get('/mine', protect, ctrl.getMyActivities);
module.exports = router;
