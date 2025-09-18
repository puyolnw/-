const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createCompletionRequest,
  getStudentCompletionRequests,
  getCompletionRequestById,
  getPendingRequests,
  updateRequestStatus,
  updateSupervisorReview,
  approveRequest,
  deleteCompletionRequest,
  getTeachingStats,
  updateCompletionRequest
} = require('../controllers/completionRequestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createRequestValidation = [
  body('assignment_id')
    .isInt({ min: 1 })
    .withMessage('Assignment ID must be a positive integer'),
  body('self_evaluation')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Self evaluation must not exceed 2000 characters'),
  body('achievements')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Achievements must not exceed 2000 characters'),
  body('challenges_faced')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Challenges faced must not exceed 2000 characters'),
  body('skills_developed')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Skills developed must not exceed 2000 characters'),
  body('future_goals')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Future goals must not exceed 2000 characters')
];

const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer'),
  body('status')
    .isIn(['under_review', 'approved', 'rejected', 'revision_required'])
    .withMessage('Status must be one of: under_review, approved, rejected, revision_required'),
  body('teacher_comments')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Teacher comments must not exceed 2000 characters'),
  body('teacher_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Teacher rating must be between 1-5')
];

const supervisorReviewValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer'),
  body('supervisor_comments')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Supervisor comments must not exceed 2000 characters'),
  body('supervisor_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Supervisor rating must be between 1-5')
];

const getRequestByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer')
];

const deleteRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Request ID must be a positive integer')
];

const getStatsValidation = [
  query('assignment_id')
    .isInt({ min: 1 })
    .withMessage('Assignment ID must be a positive integer')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Student routes
router.post('/',
  createRequestValidation,
  handleValidationErrors,
  authorizeRoles(['student']),
  createCompletionRequest
);

router.get('/my-requests',
  authorizeRoles(['student']),
  getStudentCompletionRequests
);

router.get('/stats',
  getStatsValidation,
  handleValidationErrors,
  authorizeRoles(['student']),
  getTeachingStats
);

// Update completion request route
router.put('/update',
  createRequestValidation,
  handleValidationErrors,
  authorizeRoles(['student']),
  updateCompletionRequest
);

router.get('/:id',
  getRequestByIdValidation,
  handleValidationErrors,
  getCompletionRequestById
);

router.delete('/:id',
  deleteRequestValidation,
  handleValidationErrors,
  authorizeRoles(['student']),
  deleteCompletionRequest
);

// Teacher routes
router.get('/pending/teacher',
  authorizeRoles(['teacher']),
  getPendingRequests
);

router.put('/:id/status',
  updateStatusValidation,
  handleValidationErrors,
  authorizeRoles(['teacher']),
  updateRequestStatus
);

// Supervisor routes
router.put('/:id/supervisor-review',
  supervisorReviewValidation,
  handleValidationErrors,
  authorizeRoles(['supervisor']),
  updateSupervisorReview
);

router.put('/:id/approve',
  getRequestByIdValidation,
  handleValidationErrors,
  authorizeRoles(['supervisor']),
  approveRequest
);

module.exports = router;
