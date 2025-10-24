// Admin Controller
// Handles: employee management operations

const User = require('../models/User');
const bcrypt = require('bcryptjs');

const ALLOWED_DOMAINS_REGEX = /@(gmail\.com|yahoo\.com)$/i;

module.exports = {
  // Add Employee
  addEmployee: async (req, res) => {
    // POST /api/admin/employees - Tambah data pegawai
    const { email, password, name, division, role } = req.body;
    try {
      // Validasi input
      if(!email || !password || !name || !division){
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Please provide email, password, name, and division'
        });
      }

      // Validasi domain email
      if(!ALLOWED_DOMAINS_REGEX.test(email)){
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_EMAIL_DOMAIN',
          message: 'Email domain is not allowed. Use gmail or yahoo only.'
        });
      }

      // Cek user sudah ada
      let user = await User.findOne({email});
      if(user){
        return res.status(400).json({
          status: 'error',
          code: 'USER_EXISTS',
          message: 'User already exists with this email'
        });
      }

      // Buat user baru
      user = new User({
        email,
        password,
        name,
        division,
        role: role || 'user'
      });

      await user.save();

      res.status(201).json({
        status: 'success',
        message: 'Employee added successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          join_date: user.join_date
        }
      });
    } catch (error) {
      console.error('Add Employee error:', error);
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to add employee'
      });
    }
  },

  // Edit Employee
  editEmployee: async (req, res) => {
    // PUT /api/admin/employees/:id - Edit data pegawai
    const { id } = req.params;
    const { email, name, division, role, join_date } = req.body;
    try {
      let user = await User.findById(id);
      if(!user){
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Employee not found'
        });
      }

      // Validasi domain email jika email diubah
      if(email && !ALLOWED_DOMAINS_REGEX.test(email)){
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_EMAIL_DOMAIN',
          message: 'Email domain is not allowed. Use gmail or yahoo only.'
        });
      }

      // Update fields
      if(email) user.email = email;
      if(name) user.name = name;
      if(division) user.division = division;
      if(role) user.role = role;
      if(join_date) user.join_date = join_date;

      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Employee updated successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          division: user.division,
          role: user.role,
          join_date: user.join_date
        }
      });
    } catch (error) {
      console.error('Edit Employee error:', error);
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to edit employee'
      });
    }
  },

  // Delete Employee
  deleteEmployee: async (req, res) => {
    // DELETE /api/admin/employees/:id - Hapus pegawai
    const { id } = req.params;
    try {
      const user = await User.findByIdAndDelete(id);
      if(!user){
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      console.error('Delete Employee error:', error);
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to delete employee'
      });
    }
  },

  // Get Employees
  getEmployees: async (req, res) => {
    // GET /api/admin/employees - List pegawai
    const { page = 1, limit = 10 } = req.query;
    try {
      const skip = (page - 1) * limit;
      
      const users = await User.find()
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

      const total = await User.countDocuments();

      res.status(200).json({
        status: 'success',
        message: 'Employees retrieved successfully',
        data: users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get Employees error:', error);
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve employees'
      });
    }
  }
};
