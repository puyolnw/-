const express = require('express');
const { body, query } = require('express-validator');
const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  getAvailableStudents
} = require('../../controllers/assignmentController');
const { requireAdmin } = require('../../middleware/adminAuth');
const { handleValidationErrors, validateId, validatePagination } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createAssignmentValidation = [
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  body('school_id')
    .trim()
    .notEmpty()
    .withMessage('School ID is required')
    .matches(/^SCH\d{3}$/)
    .withMessage('School ID must be in format SCH001'),
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
    .withMessage('Start date must be valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

const updateAssignmentValidation = [
  body('teacher_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Teacher ID must be a positive integer'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be active, completed, or cancelled'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// Assignment management routes
router.get('/stats',
  query('academicYearId').optional().isInt({ min: 1 }).withMessage('Academic year ID must be positive integer'),
  query('schoolId').optional().trim().notEmpty().withMessage('School ID cannot be empty'),
  handleValidationErrors,
  getAssignmentStats
);

router.get('/available-students',
  query('academicYearId').isInt({ min: 1 }).withMessage('Academic year ID is required'),
  handleValidationErrors,
  getAvailableStudents
);

router.get('/',
  query('academicYearId').optional().isInt({ min: 1 }).withMessage('Academic year ID must be positive integer'),
  query('schoolId').optional().trim().notEmpty().withMessage('School ID cannot be empty'),
  query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status'),
  validatePagination,
  handleValidationErrors,
  getAllAssignments
);

router.get('/:id',
  validateId,
  getAssignmentById
);

router.post('/',
  createAssignmentValidation,
  handleValidationErrors,
  createAssignment
);

router.put('/:id',
  validateId,
  updateAssignmentValidation,
  handleValidationErrors,
  updateAssignment
);

router.delete('/:id',
  validateId,
  deleteAssignment
);

module.exports = router;

