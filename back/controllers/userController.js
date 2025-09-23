const User = require('../models/User');
const { validationResult } = require('express-validator');
const { deleteOldProfileImage } = require('../middleware/upload');

// อัพเดทข้อมูลผู้ใช้
const updateProfile = async (req, res) => {
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

    const userId = req.user.id;
    
    const {
      first_name,
      last_name,
      phone,
      email,
      address,
      school_id,
      student_code,
      faculty,
      major
    } = req.body || {};

    // ตรวจสอบว่ามีการอัปโหลดรูปใหม่หรือไม่
    let profile_image = undefined;
    if (req.file) {
      profile_image = req.file.filename;
      
      // ลบรูปเก่า (ถ้ามี)
      const currentUser = await User.findById(userId);
      if (currentUser && currentUser.profile_image) {
        deleteOldProfileImage(currentUser.profile_image);
      }
    }

    // ตรวจสอบว่า email ซ้ำกับคนอื่นหรือไม่
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // อัพเดทข้อมูล
    const userData = {
      first_name,
      last_name,
      phone,
      email,
      address,
      // school_id: school_id || null, // ลบเพื่อป้องกัน foreign key error
      student_code: student_code || null,
      faculty: faculty || null,
      major: major || null,
      profile_image: profile_image
    };

    const updated = await User.update(userId, userData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    // ดึงข้อมูลที่อัพเดทแล้ว
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          user_id: updatedUser.user_id,
          role: updatedUser.role,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          email: updatedUser.email,
          address: updatedUser.address,
          username: updatedUser.username,
          school_id: updatedUser.school_id,
          student_code: updatedUser.student_code,
          faculty: updatedUser.faculty,
          major: updatedUser.major,
          profile_image: updatedUser.profile_image,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// เปลี่ยนรหัสผ่าน
const changePassword = async (req, res) => {
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

    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // ดึงข้อมูลผู้ใช้ปัจจุบัน (รวมรหัสผ่าน)
    const user = await User.findByUsername(req.user.username);

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isValidPassword = await User.verifyPassword(current_password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // อัพเดทรหัสผ่านใหม่
    const updated = await User.updatePassword(userId, new_password);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูลผู้ใช้ทั้งหมดตาม role (สำหรับ admin)
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // ตรวจสอบว่า role ถูกต้อง
    const validRoles = ['student', 'teacher', 'supervisor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const users = await User.findByRole(role);

    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูลผู้ใช้โดย ID (สำหรับ admin)
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

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ลบผู้ใช้ (สำหรับ admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ป้องกันไม่ให้ลบตัวเอง
    if (req.user.id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const deleted = await User.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

module.exports = {
  updateProfile,
  changePassword,
  getUsersByRole,
  getUserById,
  deleteUser
};
