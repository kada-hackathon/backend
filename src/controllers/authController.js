// Authentication Controller
// Handles: login, logout, forgot password
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { validatePassword } = require('../utils/passwordValidator');
const ALLOWED_DOMAINS_REGEX=/@(gmail\.com|yahoo\.com)$/i;
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// nodemailer config
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true untuk 465, false untuk 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token berlaku 1 hari
    });
};

module.exports = {
  login: async (req, res) => {
    // POST /api/auth/login - Email, password
    const { email, password } = req.body;
   
    try {
      if(!email || !password){
        return res.status(400).json({message: 'Please provide email and password'});
      }

      if(!ALLOWED_DOMAINS_REGEX.test(email)){
        return res.status(400).json({message : "Email domain is not allowed. Use gmail or yahoo."});
      }

      const user = await User.findOne({email});
      
      if (!user) {
        return res.status(401).json({message :"Your password or email is incorrect!"});
      }

      // compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if(!isMatch){
        return res.status(401).json({message :"Your password or email is incorrect!"});
      }

      res.status(200).json({
        message: 'Login successful',
        token: generateToken(user._id),
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          profilePicture: user.profile_photo,
          dateOfJoin: user.join_date
        }
      });
      
    } catch (error) {
      return res.status(500).json({message: 'Internal server error'});
    }
  },
  logout: async (req, res) => {
    // POST /api/auth/logout
     res.clearCookie("token");

    res.status(200).json({message : "Logout successfully"})
  },
  forgotPassword: async (req, res) => {
    // POST /api/auth/forgot-password - Email verification
    const { email } = req.body;

    if(!email){
      return res.status(400).json({message: 'Please provide an email'});
    }

    let user; // Declare user di luar try block
    try {
      user = await User.findOne({email});
      if(!user){
        return res.status(404).json({message: 'User not found with this email'});
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      

      const resetUrl = `http://localhost:8080/new-password/${resetToken}`;
      const message = 'You are receiving this email because you (or someone else) has requested the reset of a password of NEBWORK. Please reset your password by clicking the link below (Expire in one hour): \n\n' + resetUrl;

      // Only send email when not explicitly disabled (useful for test env)
      if (process.env.DISABLE_EMAIL !== 'true' && process.env.NODE_ENV !== 'test') {
        await transporter.sendMail({
          to: user.email,
          from: process.env.EMAIL_USER,
          subject: 'Password Reset Request',
          text: message
        });
      }

      res.status(200).json({message: 'Email sent successfully'});
    } catch (error) {
      if(user){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
      }

      return res.status(500).json({message: 'Failed to process password reset', error: error.message});
    }
  },
  getProfile: async (req, res) => {
    // GET /api/auth/profile - Get current user profile
    try {
      const userId = req.user?.id; // dari JWT middleware
      
      if (!userId) {
        return res.status(401).json({message: 'User not authenticated'});
      }

      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({message: 'User not found'});
      }

      res.status(200).json({
        message: 'Profile retrieved successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          profilePicture: user.profile_photo,
          dateOfJoin: user.join_date
        }
      });
    } catch (error) {
      return res.status(500).json({message: 'Internal server error'});
    }
  },
  updateProfile: async (req, res) => {
    // PUT /api/auth/profile - Update current user profile
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({message: 'User not authenticated'});
      }

      const { profilePicture } = req.body;
      
      // Update only truly editable fields by user
      // join_date, name, email, division are managed by admin only
      const updateData = {};
      if (profilePicture !== undefined) updateData.profile_photo = profilePicture;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({message: 'User not found'});
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          profilePicture: user.profile_photo,
          dateOfJoin: user.join_date
        }
      });
    } catch (error) {
      return res.status(500).json({message: 'Internal server error'});
    }
  },
  resetPassword: async (req, res) => {
    // POST /api/auth/reset-password - Reset password with token
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({message: 'Token and new password are required'});
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        code: 'WEAK_PASSWORD',
        message: passwordValidation.message
      });
    }

    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() } // Token not expired
      });

      if (!user) {
        return res.status(400).json({message: 'Invalid or expired reset token'});
      }

      // Set new password - pre-hook in User.js will handle hashing
      user.password = newPassword;  // DON'T hash manually - let pre-hook do it
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();  // Pre-hook triggers and hashes password once

      res.status(200).json({message: 'Password reset successfully'});
    } catch (error) {
      return res.status(500).json({message: 'Failed to reset password', error: error.message});
    }
  },

  // Debug endpoint to verify token validity (helps debug 401 errors)
  verifyToken: async (req, res) => {
    try {
      const token = req.headers?.authorization?.replace(/bearer\s+/i, "");
      
      if (!token) {
        return res.status(400).json({ 
          valid: false,
          message: "No token provided in Authorization header" 
        });
      }

      // Try to decode without verification first (to see payload even if invalid)
      const decodedUnverified = jwt.decode(token);
      
      if (!decodedUnverified) {
        return res.status(400).json({ 
          valid: false,
          message: "Token is malformed - not a valid JWT format",
          error: "jwt_malformed"
        });
      }

      // Now verify the token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists in database
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(404).json({ 
          valid: false,
          message: "Token is valid but user no longer exists in database",
          tokenPayload: decodedUnverified
        });
      }

      // Calculate time until expiry
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;

      return res.status(200).json({
        valid: true,
        message: "Token is valid and user exists",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          division: user.division
        },
        tokenInfo: {
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          timeUntilExpirySeconds: timeUntilExpiry,
          timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / 60),
          timeUntilExpiryHours: Math.floor(timeUntilExpiry / 3600)
        }
      });
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          valid: false,
          message: "Token signature is invalid",
          error: "jwt_malformed",
          details: error.message
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        const expiredAt = error.expiredAt ? new Date(error.expiredAt).toISOString() : 'unknown';
        return res.status(401).json({ 
          valid: false,
          message: "Token has expired - please login again",
          error: "jwt_expired",
          expiredAt: expiredAt
        });
      }
      
      if (error.name === 'NotBeforeError') {
        return res.status(401).json({ 
          valid: false,
          message: "Token is not yet valid",
          error: "jwt_not_before"
        });
      }
      
      return res.status(500).json({ 
        valid: false,
        message: "Error verifying token",
        error: error.message
      });
    }
  }
};
