// Admin Routes
// POST /api/admin/employees - Add employee //done
// PUT /api/admin/employees/:id - Edit employee //done
// DELETE /api/admin/employees/:id - Delete employee //done
// GET /api/admin/employees - Get employees list //done

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

router.post('/employees', protect, isAdmin, adminController.addEmployee);
// router.post('/employees', adminController.addEmployee);
router.put('/employees/:id', protect, isAdmin, adminController.editEmployee);
router.delete('/employees/:id', protect, isAdmin, adminController.deleteEmployee);
router.get('/employees', protect, isAdmin, adminController.getEmployees);

module.exports = router;
