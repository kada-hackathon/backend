const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rate limiting - prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false, 
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each email to 5 forgot password requests per hour
  keyGenerator: (req, res) => {
    // Use email if provided, otherwise use IP (automatically IPv6 compatible)
    return req.body.email || req.ip;
  },
  message: {
    status: 'error',
    message: 'Too many password reset requests for this email, please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 attempts per token (user might make typos)
  keyGenerator: (req, res) => {
    // Use token if provided, otherwise use IP (automatically IPv6 compatible)
    return req.body.token || req.ip;
  },
  message: {
    status: 'error',
    message: 'Too many password reset attempts for this link, please request a new reset link'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes with rate limiting
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// Debug endpoint to verify token status (helps debug 401 errors)
router.get('/verify-token', authController.verifyToken);

module.exports = router;
