const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware สำหรับตรวจสอบว่าผู้ใช้เป็น Admin
const requireAdmin = async (req, res, next) => {
  try {
    // ตรวจสอบว่ามี token หรือไม่
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ตรวจสอบว่า decoded.userId มีค่าหรือไม่
    if (!decoded.userId) {
      console.error('❌ JWT decoded.userId is undefined:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Invalid token - missing user ID'
      });
    }
    
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // เพิ่มข้อมูลผู้ใช้ใน request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Admin auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { requireAdmin };
