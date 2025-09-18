const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../../controllers/adminUserController');
const { requireAdmin } = require('../../middleware/adminAuth');
const { handleValidationErrors, validatePagination, validateSort, validateId } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('role')
    .isIn(['student', 'teacher', 'supervisor', 'admin'])
    .withMessage('Invalid role'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('th-TH')
    .withMessage('Invalid phone number format'),
  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('student_code')
    .optional({ checkFalsy: true })
    .isLength({ min: 10, max: 20 })
    .withMessage('Student code must be between 10-20 characters'),
  body('faculty')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Faculty must not exceed 200 characters'),
  body('major')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Major must not exceed 200 characters')
];

const updateUserValidation = [
  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters'),
  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'supervisor', 'admin'])
    .withMessage('Invalid role'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('th-TH')
    .withMessage('Invalid phone number format'),
  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('student_code')
    .optional({ checkFalsy: true })
    .isLength({ min: 10, max: 20 })
    .withMessage('Student code must be between 10-20 characters'),
  body('faculty')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Faculty must not exceed 200 characters'),
  body('major')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Major must not exceed 200 characters')
];

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// Routes
const allowedSortFields = ['first_name', 'last_name', 'email', 'role', 'created_at', 'updated_at'];

router.get('/stats', getUserStats);
router.get('/', validatePagination, validateSort(allowedSortFields), getAllUsers);
router.get('/:id', validateId, getUserById);
router.post('/', createUserValidation, handleValidationErrors, createUser);
router.put('/:id', validateId, updateUserValidation, handleValidationErrors, updateUser);
router.delete('/:id', validateId, deleteUser);

module.exports = router;
