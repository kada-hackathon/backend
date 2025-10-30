// Authentication Routes
// POST /api/auth/login //success
// POST /api/auth/logout //success
// POST /api/auth/forgot-password //success
// GET /api/auth/profile //success

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


  // Routes will be implemented here
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.post('/forgot-password', authController.forgotPassword);
  router.get('/profile', protect, authController.getProfile);
  router.put('/profile', protect, authController.updateProfile);

module.exports = router;
