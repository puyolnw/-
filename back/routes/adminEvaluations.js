const express = require('express');
const router = express.Router();
const adminEvaluationController = require('../controllers/adminEvaluationController');
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
router.get('/', adminEvaluationController.getAllEvaluations);
router.get('/:id', adminEvaluationController.getEvaluationById);
router.put('/:id', adminEvaluationController.updateEvaluation);
router.delete('/:id', adminEvaluationController.deleteEvaluation);

module.exports = router;
