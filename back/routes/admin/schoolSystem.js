const express = require('express');
const { body, query } = require('express-validator');
const {
  getSchoolOverview,
  getSchoolDetails,
  getSchoolStudents,
  getSchoolTeachers,
  setSchoolQuota,
  updateEnrollmentStatus,
  assignStudent,
  assignTeacher,
  removeStudent,
  removeTeacher,
  setPrimaryTeacher,
  getAvailableTeachers,
  updateSchoolSchedule,
  getSchoolSchedule
} = require('../../controllers/schoolSystemController');
const { requireAdmin } = require('../../middleware/adminAuth');
const { handleValidationErrors, validateId, validatePagination } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const quotaValidation = [
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('max_students')
    .isInt({ min: 0, max: 100 })
    .withMessage('Max students must be between 0 and 100'),
  body('max_teachers')
    .isInt({ min: 0, max: 20 })
    .withMessage('Max teachers must be between 0 and 20'),
  body('is_open')
    .optional()
    .isBoolean()
    .withMessage('is_open must be boolean')
];

const studentAssignValidation = [
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('teacher_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with max 500 characters')
];

const teacherAssignValidation = [
  body('teacher_id')
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('is_primary must be boolean'),
  body('max_students')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max students must be between 1 and 20')
];

const enrollmentStatusValidation = [
  body('academic_year_id')
    .isInt({ min: 1 })
    .withMessage('Academic year ID must be a positive integer'),
  body('is_open')
    .isBoolean()
    .withMessage('is_open must be boolean')
];

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// School overview routes
router.get('/overview', 
  query('academicYearId').optional().isInt({ min: 1 }).withMessage('Academic year ID must be positive integer'),
  handleValidationErrors,
  getSchoolOverview
);

// School details routes
router.get('/:schoolId/details',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  handleValidationErrors,
  getSchoolDetails
);

// School students routes
router.get('/:schoolId/students',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status'),
  validatePagination,
  handleValidationErrors,
  getSchoolStudents
);

// Add student to school
router.post('/:schoolId/students',
  studentAssignValidation,
  handleValidationErrors,
  assignStudent
);

// Remove student from school
router.delete('/students/:assignmentId',
  (req, res, next) => {
    const { assignmentId } = req.params;
    
    if (!assignmentId || isNaN(parseInt(assignmentId)) || parseInt(assignmentId) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID parameter'
      });
    }
    
    req.params.assignmentId = parseInt(assignmentId);
    next();
  },
  removeStudent
);

// School teachers routes
router.get('/:schoolId/teachers',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  handleValidationErrors,
  getSchoolTeachers
);

router.get('/:schoolId/teachers/available',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  handleValidationErrors,
  getAvailableTeachers
);

// School quota management
router.post('/:schoolId/quotas',
  quotaValidation,
  handleValidationErrors,
  setSchoolQuota
);

router.put('/:schoolId/enrollment-status',
  enrollmentStatusValidation,
  handleValidationErrors,
  updateEnrollmentStatus
);

// Teacher management
router.post('/:schoolId/teachers',
  teacherAssignValidation,
  handleValidationErrors,
  assignTeacher
);

router.delete('/teachers/:assignmentId',
  (req, res, next) => {
    const { assignmentId } = req.params;
    
    if (!assignmentId || isNaN(parseInt(assignmentId)) || parseInt(assignmentId) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID parameter'
      });
    }
    
    req.params.assignmentId = parseInt(assignmentId);
    next();
  },
  removeTeacher
);

router.put('/teachers/:assignmentId/primary',
  (req, res, next) => {
    const { assignmentId } = req.params;
    
    if (!assignmentId || isNaN(parseInt(assignmentId)) || parseInt(assignmentId) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID parameter'
      });
    }
    
    req.params.assignmentId = parseInt(assignmentId);
    next();
  },
  setPrimaryTeacher
);

// School schedule management
router.get('/:schoolId/schedule',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  handleValidationErrors,
  getSchoolSchedule
);

router.put('/:schoolId/schedule',
  body('academic_year_id').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  body('internship_start_date').isISO8601().withMessage('Internship start date must be valid'),
  body('internship_end_date').isISO8601().withMessage('Internship end date must be valid')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.internship_start_date)) {
        throw new Error('Internship end date must be after start date');
      }
      return true;
    }),
  body('preparation_start_date').optional().isISO8601().withMessage('Preparation start date must be valid'),
  body('orientation_date').optional().isISO8601().withMessage('Orientation date must be valid'),
  body('evaluation_date').optional().isISO8601().withMessage('Evaluation date must be valid'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors,
  updateSchoolSchedule
);

module.exports = router;