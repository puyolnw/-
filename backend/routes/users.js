const express = require('express');
const { body } = require('express-validator');
const { 
  updateProfile, 
  changePassword, 
  getUsersByRole, 
  getUserById, 
  deleteUser 
} = require('../controllers/userController');
const { 
  authenticateToken, 
  authorizeRoles, 
  authorizeOwnerOrAdmin 
} = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[0-9\-\+\(\)\s]+$/)
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('school_id')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('School ID must not exceed 20 characters')
];

const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Routes

// Profile management (ผู้ใช้ทุกคนสามารถแก้ไขโปรไฟล์ของตัวเองได้)
router.put('/profile', authenticateToken, handleUploadError, updateProfileValidation, updateProfile);
router.put('/password', authenticateToken, changePasswordValidation, changePassword);

// Admin only routes
router.get('/role/:role', authenticateToken, authorizeRoles('admin'), getUsersByRole);
router.get('/:id', authenticateToken, authorizeRoles('admin'), getUserById);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

module.exports = router;
