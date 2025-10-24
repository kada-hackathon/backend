// Authentication Routes
// POST /api/auth/login //success
// POST /api/auth/logout //success
// POST /api/auth/forgot-password //success

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


  // Routes will be implemented here
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
