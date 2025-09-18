const express = require('express');
const { body } = require('express-validator');
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats
} = require('../../controllers/adminSchoolController');
const { requireAdmin } = require('../../middleware/adminAuth');
const { handleValidationErrors, validatePagination, validateSort, validateId } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createSchoolValidation = [
  body('school_name')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2-200 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10-500 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 characters')
];

const updateSchoolValidation = [
  body('school_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('School name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2-200 characters'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10-500 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 characters')
];

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// Routes
const allowedSortFields = ['school_name', 'school_id', 'created_at', 'updated_at'];

router.get('/stats', getSchoolStats);
router.get('/', validatePagination, validateSort(allowedSortFields), getAllSchools);
router.get('/:id', validateId, getSchoolById);
router.post('/', createSchoolValidation, handleValidationErrors, createSchool);
router.put('/:id', validateId, updateSchoolValidation, handleValidationErrors, updateSchool);
router.delete('/:id', validateId, deleteSchool);

module.exports = router;
