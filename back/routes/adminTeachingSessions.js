const express = require('express');
const router = express.Router();
const adminTeachingSessionController = require('../controllers/adminTeachingSessionController');
const { authenticateToken } = require('../middleware/auth');

// ใช้ middleware auth สำหรับทุก route
router.use(authenticateToken);

// ตรวจสอบว่าเป็น admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }
  next();
};

router.use(adminAuth);

// Routes
router.get('/', adminTeachingSessionController.getAllTeachingSessions);
router.get('/:id', adminTeachingSessionController.getTeachingSessionById);
router.put('/:id', adminTeachingSessionController.updateTeachingSession);
router.delete('/:id', adminTeachingSessionController.deleteTeachingSession);

module.exports = router;
