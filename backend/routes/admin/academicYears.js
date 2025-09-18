const express = require('express');
const { body } = require('express-validator');
const {
  getAllAcademicYears,
  getActiveAcademicYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deleteAcademicYear,
  getAcademicYearStats
} = require('../../controllers/academicYearController');
const { requireAdmin } = require('../../middleware/adminAuth');
const { handleValidationErrors, validateId } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createAcademicYearValidation = [
  body('year')
    .trim()
    .notEmpty()
    .withMessage('Year is required')
    .matches(/^\d{4}$/)
    .withMessage('Year must be 4 digits (e.g., 2567)'),
  body('semester')
    .isInt({ min: 1, max: 2 })
    .withMessage('Semester must be 1 or 2'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be valid date (YYYY-MM-DD)'),
  body('end_date')
    .isISO8601()
    .withMessage('End date must be valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('registration_start')
    .isISO8601()
    .withMessage('Registration start date must be valid date (YYYY-MM-DD)'),
  body('registration_end')
    .isISO8601()
    .withMessage('Registration end date must be valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.registration_start)) {
        throw new Error('Registration end date must be after registration start date');
      }
      if (new Date(req.body.start_date) <= new Date(value)) {
        throw new Error('Academic year must start after registration period ends');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean')
];

const updateAcademicYearValidation = [
  body('year')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Year cannot be empty')
    .matches(/^\d{4}$/)
    .withMessage('Year must be 4 digits (e.g., 2567)'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage('Semester must be 1 or 2'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid date (YYYY-MM-DD)'),
  body('registration_start')
    .optional()
    .isISO8601()
    .withMessage('Registration start date must be valid date (YYYY-MM-DD)'),
  body('registration_end')
    .optional()
    .isISO8601()
    .withMessage('Registration end date must be valid date (YYYY-MM-DD)'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean')
];

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// Routes
router.get('/active', getActiveAcademicYear);
router.get('/stats/:id', validateId, getAcademicYearStats);
router.get('/:id', validateId, getAcademicYearById);
router.get('/', getAllAcademicYears);
router.post('/', createAcademicYearValidation, handleValidationErrors, createAcademicYear);
router.put('/:id', validateId, updateAcademicYearValidation, handleValidationErrors, updateAcademicYear);
router.put('/:id/activate', validateId, activateAcademicYear);
router.delete('/:id', validateId, deleteAcademicYear);

module.exports = router;