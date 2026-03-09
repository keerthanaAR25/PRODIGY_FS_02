
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employeeController');
const { protect, adminOnly, managerOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/export', adminOnly, ctrl.exportEmployees);
router.get('/dept-stats', ctrl.getDeptStats);
router.post('/bulk-import', adminOnly, ctrl.bulkImport);
router.post('/bulk-delete', adminOnly, ctrl.bulkDelete);
router.post('/bulk-update', managerOrAdmin, ctrl.bulkUpdate);

router.get('/', ctrl.getEmployees);
router.post('/', adminOnly, upload.single('avatar'), ctrl.createEmployee);
router.get('/:id', ctrl.getEmployee);
router.put('/:id', managerOrAdmin, upload.single('avatar'), ctrl.updateEmployee);
router.delete('/:id', adminOnly, ctrl.deleteEmployee);
router.delete('/:id/hard', adminOnly, ctrl.hardDelete);
router.patch('/:id/restore', adminOnly, ctrl.restoreEmployee);
router.post('/:id/notes', managerOrAdmin, ctrl.addNote);

module.exports = router;