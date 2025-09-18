const express = require('express');
const { body, query } = require('express-validator');
const {
  applyToSchool,
  cancelApplication,
  getMyAssignments,
  getAvailableSchools,
  getStudentStatus
} = require('../../controllers/assignmentController');
const { getStudentSchoolInfo } = require('../../controllers/schoolInfoController');
const { getAllAcademicYears } = require('../../controllers/academicYearController');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const applyValidation = [
  body('school_id')
    .trim()
    .notEmpty()
    .withMessage('School ID is required')
    .matches(/^SCH\d{3}$/)
    .withMessage('School ID must be in format SCH001'),
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

const cancelValidation = [
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Student assignment routes
router.get('/available-schools',
  query('academic_year_id').optional().isInt({ min: 1 }).withMessage('Academic year ID must be positive integer'),
  handleValidationErrors,
  getAvailableSchools
);

router.get('/my',
  query('academic_year_id').optional().isInt({ min: 1 }).withMessage('Academic year ID must be positive integer'),
  handleValidationErrors,
  getMyAssignments
);

router.post('/apply',
  applyValidation,
  handleValidationErrors,
  applyToSchool
);

router.post('/cancel',
  cancelValidation,
  handleValidationErrors,
  cancelApplication
);

// GET /api/student/assignments/status - ดึงสถานะนักศึกษา
router.get('/status', getStudentStatus);

// GET /api/student/assignments/academic-years - ดึงข้อมูลปีการศึกษาสำหรับ student
router.get('/academic-years', getAllAcademicYears);

// GET /api/student/assignments/school-info - ดึงข้อมูลโรงเรียนของนักศึกษา
router.get('/school-info', getStudentSchoolInfo);

module.exports = router;