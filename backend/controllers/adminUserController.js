const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ดึงรายการผู้ใช้ทั้งหมด (สำหรับ Admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    console.log('🔵 Backend - getAllUsers called with query:', req.query);
    
    const offset = (page - 1) * limit;
    let whereClause = '';
    const queryParams = [];

    // Filter by role
    if (role && role !== 'all') {
      whereClause += ' WHERE role = ?';
      queryParams.push(role);
    }

    // Search functionality
    if (search) {
      const searchClause = whereClause ? ' AND ' : ' WHERE ';
      whereClause += `${searchClause}(
        CONCAT(first_name, ' ', last_name) LIKE ? OR 
        email LIKE ? OR 
        username LIKE ? OR 
        student_code LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const allowedSortFields = ['first_name', 'last_name', 'email', 'role', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM users${whereClause}`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get users with pagination
    const usersQuery = `
      SELECT 
        id, user_id, role, first_name, last_name, phone, email, address, 
        username, school_id, student_code, faculty, major, profile_image,
        created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const [users] = await pool.execute(usersQuery, queryParams);

    console.log('🔵 Backend - Users query result:', users.length, 'users');
    console.log('🔵 Backend - Total count:', total);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page);

    const response = {
      success: true,
      data: {
        users,
        pagination: {
          currentPage,
          totalPages,
          totalRecords: total,
          limit: parseInt(limit),
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      }
    };

    console.log('🔵 Backend - Response data:', response.data);
    res.json(response);

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูลผู้ใช้ตาม ID (สำหรับ Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ไม่ส่ง password กลับไป
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// สร้างผู้ใช้ใหม่ (สำหรับ Admin)
const createUser = async (req, res) => {
  try {
    // ตรวจสอบ validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      role,
      first_name,
      last_name,
      phone,
      email,
      address,
      username,
      password,
      student_code,
      faculty,
      major
    } = req.body;

    // ตรวจสอบว่า email และ username ไม่ซ้ำ
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // สร้าง user_id อัตโนมัติ
    const user_id = await User.generateUserId(role);

    // สร้างข้อมูลผู้ใช้
    const userData = {
      user_id,
      role,
      first_name,
      last_name,
      phone,
      email,
      address,
      username,
      password,
      school_id: null, // Admin สามารถกำหนดได้ภายหลัง
      student_code: student_code || null,
      faculty: faculty || null,
      major: major || null,
      profile_image: null
    };

    const newUserId = await User.create(userData);
    const newUser = await User.findById(newUserId);

    // ไม่ส่ง password กลับไป
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userWithoutPassword }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// อัพเดทผู้ใช้ (สำหรับ Admin)
const updateUser = async (req, res) => {
  try {
    // ตรวจสอบ validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      email,
      address,
      role,
      student_code,
      faculty,
      major
    } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ตรวจสอบว่า email ไม่ซ้ำกับคนอื่น
    if (email && email !== existingUser.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists && emailExists.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // อัพเดทข้อมูล
    const updateData = {
      first_name,
      last_name,
      phone,
      email,
      address,
      role,
      student_code: student_code || null,
      faculty: faculty || null,
      major: major || null
    };

    const updated = await User.update(id, updateData);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    // ดึงข้อมูลที่อัพเดทแล้ว
    const updatedUser = await User.findById(id);
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: userWithoutPassword }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ลบผู้ใช้ (สำหรับ Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าผู้ใช้มีอยู่
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ป้องกันไม่ให้ admin ลบตัวเอง
    if (existingUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // ลบผู้ใช้
    const deleted = await User.delete(id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงสถิติผู้ใช้ (สำหรับ Admin Dashboard)
const getUserStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as supervisors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_registrations
      FROM users
    `);

    res.json({
      success: true,
      data: { stats: stats[0] }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
