
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getDepartments);
router.post('/', adminOnly, ctrl.createDepartment);
router.put('/:id', adminOnly, ctrl.updateDepartment);
router.delete('/:id', adminOnly, ctrl.deleteDepartment);

module.exports = router;