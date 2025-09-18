const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const supervisorEvaluationController = require('../controllers/supervisorEvaluationController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');

// ตรวจสอบว่าเป็น supervisor
const supervisorAuth = (req, res, next) => {
  if (req.user.role !== 'supervisor') {
    return res.status(403).json({
      success: false,
      message: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }
  next();
};

// ใช้ middleware auth และ supervisorAuth สำหรับทุก route
router.use(authenticateToken);
router.use(supervisorAuth);

// Dashboard
router.get('/dashboard', supervisorController.getDashboard);

// โรงเรียน
router.get('/schools', supervisorController.getAllSchools);
router.get('/schools/:schoolId', supervisorController.getSchoolDetail);

// จัดการครูพี่เลี้ยง
router.post('/schools/:schoolId/teachers', 
  [
    body('teacher_id').notEmpty().withMessage('กรุณาเลือกครูพี่เลี้ยง')
  ],
  supervisorController.addTeacherToSchool
);
router.delete('/schools/:schoolId/teachers/:teacherId', supervisorController.removeTeacherFromSchool);

// จัดการนักศึกษา
router.post('/schools/:schoolId/students',
  [
    body('student_id').notEmpty().withMessage('กรุณาเลือกนักศึกษา'),
    body('teacher_id').notEmpty().withMessage('กรุณาเลือกครูพี่เลี้ยง'),
    body('academic_year_id').notEmpty().withMessage('กรุณาเลือกปีการศึกษา')
  ],
  supervisorController.addStudentToSchool
);
router.delete('/schools/:schoolId/students/:studentId', supervisorController.removeStudentFromSchool);

// ดึงรายชื่อที่สามารถเพิ่มได้
router.get('/available/teachers', supervisorController.getAvailableTeachers);
router.get('/available/students', supervisorController.getAvailableStudents);

// ดึงรายละเอียดนักศึกษา
router.get('/students/:studentId', supervisorController.getStudentDetail);

// จัดการผู้ใช้งาน (CRUD)
router.get('/management/users', supervisorController.getAllUsers);
router.post('/management/users', 
  [
    body('first_name').notEmpty().withMessage('กรุณาใส่ชื่อ'),
    body('last_name').notEmpty().withMessage('กรุณาใส่นามสกุล'),
    body('email').isEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง'),
    body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    body('phone').notEmpty().withMessage('กรุณาใส่เบอร์โทรศัพท์'),
    body('role').isIn(['student', 'teacher', 'supervisor', 'admin']).withMessage('กรุณาเลือกบทบาทที่ถูกต้อง')
  ],
  supervisorController.createUser
);
router.put('/management/users/:userId',
  [
    body('first_name').notEmpty().withMessage('กรุณาใส่ชื่อ'),
    body('last_name').notEmpty().withMessage('กรุณาใส่นามสกุล'),
    body('email').isEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง'),
    body('phone').notEmpty().withMessage('กรุณาใส่เบอร์โทรศัพท์'),
    body('role').isIn(['student', 'teacher', 'supervisor', 'admin']).withMessage('กรุณาเลือกบทบาทที่ถูกต้อง')
  ],
  supervisorController.updateUser
);
router.delete('/management/users/:userId', supervisorController.deleteUser);

// จัดการโรงเรียน (CRUD)
router.post('/management/schools',
  [
    body('name').notEmpty().withMessage('กรุณาใส่ชื่อโรงเรียน'),
    body('address').notEmpty().withMessage('กรุณาใส่ที่อยู่'),
    body('phone').notEmpty().withMessage('กรุณาใส่เบอร์โทรศัพท์'),
    body('email').isEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง')
  ],
  supervisorController.createSchool
);
router.put('/management/schools/:schoolId',
  [
    body('name').notEmpty().withMessage('กรุณาใส่ชื่อโรงเรียน'),
    body('address').notEmpty().withMessage('กรุณาใส่ที่อยู่'),
    body('phone').notEmpty().withMessage('กรุณาใส่เบอร์โทรศัพท์'),
    body('email').isEmail().withMessage('กรุณาใส่อีเมลที่ถูกต้อง')
  ],
  supervisorController.updateSchool
);
router.delete('/management/schools/:schoolId', supervisorController.deleteSchool);

// Reports
router.get('/reports', supervisorController.getReports);

// การประเมิน
router.get('/evaluations/pending', supervisorEvaluationController.getPendingEvaluations);
router.get('/evaluations/history', supervisorEvaluationController.getEvaluationHistory);
router.get('/evaluations/:requestId', supervisorEvaluationController.getEvaluationDetail);
router.post('/evaluations/:requestId', 
  [
    body('criteria_1').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 1 ต้องเป็นตัวเลข 1-5'),
    body('criteria_2').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 2 ต้องเป็นตัวเลข 1-5'),
    body('criteria_3').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 3 ต้องเป็นตัวเลข 1-5'),
    body('criteria_4').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 4 ต้องเป็นตัวเลข 1-5'),
    body('criteria_5').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 5 ต้องเป็นตัวเลข 1-5'),
    body('criteria_6').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 6 ต้องเป็นตัวเลข 1-5'),
    body('criteria_7').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 7 ต้องเป็นตัวเลข 1-5'),
    body('criteria_8').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 8 ต้องเป็นตัวเลข 1-5'),
    body('criteria_9').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 9 ต้องเป็นตัวเลข 1-5'),
    body('criteria_10').isInt({ min: 1, max: 5 }).withMessage('เกณฑ์ที่ 10 ต้องเป็นตัวเลข 1-5'),
    body('overall_rating').isInt({ min: 1, max: 5 }).withMessage('คะแนนรวมต้องเป็นตัวเลข 1-5'),
    body('decision').isIn(['approved', 'rejected']).withMessage('การตัดสินต้องเป็น approved หรือ rejected'),
    body('supervisor_comments').notEmpty().withMessage('กรุณาใส่ความคิดเห็น')
  ],
  supervisorEvaluationController.evaluateRequest
);

module.exports = router;
