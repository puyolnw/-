const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// Register ผู้ใช้ใหม่
const register = async (req, res) => {
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
      school_id,  // ลบ default value เพื่อป้องกัน foreign key error
      student_code = null,  // รหัสนักศึกษา
      faculty = null,       // คณะ
      major = null          // สาขา
    } = req.body;

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // ตรวจสอบว่า email ซ้ำหรือไม่
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // สร้าง user_id อัตโนมัติ
    const user_id = await User.generateUserId(role);

    // สร้างผู้ใช้ใหม่ - รองรับการสมัครแบบไม่ต้องมี profile ครบ
    const userData = {
      user_id,
      role,
      first_name,
      last_name,
      phone: phone || null,        // ทำให้เป็น optional
      email,
      address: address || null,    // ทำให้เป็น optional
      username,
      password,
      school_id: null, // ตั้งค่าเป็น null เสมอเพื่อป้องกัน foreign key error
      student_code: student_code || null,  // ทำให้เป็น optional
      faculty: faculty || null,            // ทำให้เป็น optional
      major: major || null,                // ทำให้เป็น optional
      profile_image: null                  // ไม่ต้องสนใจ profile_image ตอนสมัคร
    };

    const userId = await User.create(userData);

    // ดึงข้อมูลผู้ใช้ที่สร้างใหม่
    const newUser = await User.findById(userId);

    // สร้าง token
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          user_id: newUser.user_id,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          email: newUser.email,
          address: newUser.address,
          username: newUser.username,
          school_id: newUser.school_id,
          student_code: newUser.student_code,
          faculty: newUser.faculty,
          major: newUser.major,
          profile_image: newUser.profile_image,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login ผู้ใช้
const login = async (req, res) => {
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

    const { username, password } = req.body;

    // ค้นหาผู้ใช้
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // สร้าง token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          user_id: user.user_id,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          username: user.username,
          school_id: user.school_id,
          student_code: user.student_code,
          faculty: user.faculty,
          major: user.major,
          profile_image: user.profile_image,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูลผู้ใช้ปัจจุบัน
const getProfile = async (req, res) => {
  try {
    const user = req.user; // มาจาก middleware authenticateToken

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          user_id: user.user_id,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          username: user.username,
          school_id: user.school_id,
          student_code: user.student_code,
          faculty: user.faculty,
          major: user.major,
          profile_image: user.profile_image,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (ในกรณีนี้แค่ส่งข้อความ เพราะ JWT เป็น stateless)
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client side.'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
