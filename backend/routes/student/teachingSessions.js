const express = require('express');
const { body, query, param } = require('express-validator');
const {
  createTeachingSession,
  getMyTeachingSessions,
  getTeachingSessionById,
  updateTeachingSession,
  deleteTeachingSession,
  getAvailableLessonPlans,
  uploadFiles,
  deleteFile,
  getMonthlyStats,
  upload
} = require('../../controllers/teachingSessionController');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createTeachingSessionValidation = [
  body('lesson_plan_id')
    .isInt({ min: 1 })
    .withMessage('Lesson plan ID must be a positive integer'),
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('teaching_date')
    .isISO8601()
    .withMessage('Teaching date must be a valid date (YYYY-MM-DD)'),
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('class_level')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Class level must not exceed 50 characters'),
  body('class_room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Class room must not exceed 50 characters'),
  body('student_count')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Student count must be between 1-100'),
  body('lesson_topic')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Lesson topic must not exceed 200 characters'),
  body('lesson_summary')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Lesson summary must not exceed 2000 characters'),
  body('learning_outcomes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Learning outcomes must not exceed 2000 characters'),
  body('teaching_methods_used')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Teaching methods used must not exceed 2000 characters'),
  body('materials_used')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Materials used must not exceed 2000 characters'),
  body('student_engagement')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Student engagement must not exceed 2000 characters'),
  body('problems_encountered')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Problems encountered must not exceed 2000 characters'),
  body('problem_solutions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Problem solutions must not exceed 2000 characters'),
  body('lessons_learned')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Lessons learned must not exceed 2000 characters'),
  body('reflection')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Reflection must not exceed 2000 characters'),
  body('improvement_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Improvement notes must not exceed 2000 characters'),
  body('teacher_feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Teacher feedback must not exceed 2000 characters'),
  body('self_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Self rating must be between 1-5'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed'])
    .withMessage('Status must be one of: draft, submitted, reviewed')
];

const updateTeachingSessionValidation = [
  body('lesson_plan_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lesson plan ID must be a positive integer'),
  body('subject_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('teaching_date')
    .optional()
    .isISO8601()
    .withMessage('Teaching date must be a valid date (YYYY-MM-DD)'),
  body('start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('class_level')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Class level must not exceed 50 characters'),
  body('class_room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Class room must not exceed 50 characters'),
  body('student_count')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Student count must be between 1-100'),
  body('lesson_topic')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Lesson topic must not exceed 200 characters'),
  body('lesson_summary')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Lesson summary must not exceed 2000 characters'),
  body('learning_outcomes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Learning outcomes must not exceed 2000 characters'),
  body('teaching_methods_used')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Teaching methods used must not exceed 2000 characters'),
  body('materials_used')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Materials used must not exceed 2000 characters'),
  body('student_engagement')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Student engagement must not exceed 2000 characters'),
  body('problems_encountered')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Problems encountered must not exceed 2000 characters'),
  body('problem_solutions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Problem solutions must not exceed 2000 characters'),
  body('lessons_learned')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Lessons learned must not exceed 2000 characters'),
  body('reflection')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Reflection must not exceed 2000 characters'),
  body('improvement_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Improvement notes must not exceed 2000 characters'),
  body('teacher_feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Teacher feedback must not exceed 2000 characters'),
  body('self_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Self rating must be between 1-5'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed'])
    .withMessage('Status must be one of: draft, submitted, reviewed')
];

const getTeachingSessionsValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed'])
    .withMessage('Status must be one of: draft, submitted, reviewed'),
  query('subject_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  query('lesson_plan_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lesson plan ID must be a positive integer'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
];

const getMonthlyStatsValidation = [
  query('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020-2030'),
  query('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1-12')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Routes
router.post('/',
  createTeachingSessionValidation,
  handleValidationErrors,
  createTeachingSession
);

router.get('/',
  getTeachingSessionsValidation,
  handleValidationErrors,
  getMyTeachingSessions
);

router.get('/lesson-plans',
  getAvailableLessonPlans
);

router.get('/stats/monthly',
  getMonthlyStatsValidation,
  handleValidationErrors,
  getMonthlyStats
);

router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Teaching session ID must be a positive integer'),
  handleValidationErrors,
  getTeachingSessionById
);

router.put('/:id',
  param('id').isInt({ min: 1 }).withMessage('Teaching session ID must be a positive integer'),
  updateTeachingSessionValidation,
  handleValidationErrors,
  updateTeachingSession
);

router.delete('/:id',
  param('id').isInt({ min: 1 }).withMessage('Teaching session ID must be a positive integer'),
  handleValidationErrors,
  deleteTeachingSession
);

// File upload routes
router.post('/:teachingSessionId/files',
  param('teachingSessionId').isInt({ min: 1 }).withMessage('Teaching session ID must be a positive integer'),
  handleValidationErrors,
  upload.array('files', 20), // อนุญาตให้อัปโหลดได้สูงสุด 20 ไฟล์
  uploadFiles
);

router.delete('/:teachingSessionId/files/:fileId',
  param('teachingSessionId').isInt({ min: 1 }).withMessage('Teaching session ID must be a positive integer'),
  param('fileId').isInt({ min: 1 }).withMessage('File ID must be a positive integer'),
  handleValidationErrors,
  deleteFile
);

module.exports = router;
