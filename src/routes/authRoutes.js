const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rate limiting - prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  keyGenerator: rateLimit.ipKeyGenerator,
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
  keyGenerator: rateLimit.ipKeyGenerator,
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
  keyGenerator: rateLimit.ipKeyGenerator,
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

module.exports = router;
