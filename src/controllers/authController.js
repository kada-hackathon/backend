// Authentication Controller
// Handles: login, logout, forgot password
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
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
        expiresIn: '1h', // Token berlaku 1 jam
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
      
      // compare hashed password
      const isMatch = user && await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res.status(401).json({message :"Your password is incorrect!"});
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
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
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

      const resetUrl = `http://yourfrontend.com/reset-password/${resetToken}`;
      const message = 'You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n' + resetUrl;

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
      console.error('Forgot Password error:', error.message);
      console.error('Error details:', error);
      return res.status(500).json({message: 'Failed to process password reset', error: error.message});
    }
  },
};
