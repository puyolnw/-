const express = require('express');
const { body, query, param } = require('express-validator');
const {
  createLessonPlan,
  getMyLessonPlans,
  getLessonPlanById,
  updateLessonPlan,
  deleteLessonPlan,
  uploadFiles,
  deleteFile,
  getSubjects,
  createSubject,
  upload
} = require('../../controllers/lessonPlanController');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');

const router = express.Router();

// Validation rules
const createLessonPlanValidation = [
  body('lesson_plan_name')
    .trim()
    .notEmpty()
    .withMessage('Lesson plan name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Lesson plan name must be 3-200 characters'),
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15-180 minutes'),
  body('target_grade')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Target grade must not exceed 20 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived')
];

const updateLessonPlanValidation = [
  body('lesson_plan_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Lesson plan name cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Lesson plan name must be 3-200 characters'),
  body('subject_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('objectives')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Objectives must not exceed 2000 characters'),
  body('teaching_methods')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Teaching methods must not exceed 2000 characters'),
  body('assessment_methods')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Assessment methods must not exceed 2000 characters'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15-180 minutes'),
  body('target_grade')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Target grade must not exceed 20 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived')
];

const getLessonPlansValidation = [
  query('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived'),
  query('subject_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subject ID must be a positive integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
];

const getSubjectsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

const subjectValidation = [
  body('subject_code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be 2-20 characters'),
  body('subject_name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject name must be 3-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Routes
router.post('/',
  createLessonPlanValidation,
  handleValidationErrors,
  createLessonPlan
);

router.get('/',
  getLessonPlansValidation,
  handleValidationErrors,
  getMyLessonPlans
);

router.get('/subjects',
  getSubjectsValidation,
  handleValidationErrors,
  getSubjects
);

router.post('/subjects',
  subjectValidation,
  handleValidationErrors,
  createSubject
);

router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Lesson plan ID must be a positive integer'),
  handleValidationErrors,
  getLessonPlanById
);

router.put('/:id',
  param('id').isInt({ min: 1 }).withMessage('Lesson plan ID must be a positive integer'),
  updateLessonPlanValidation,
  handleValidationErrors,
  updateLessonPlan
);

router.delete('/:id',
  param('id').isInt({ min: 1 }).withMessage('Lesson plan ID must be a positive integer'),
  handleValidationErrors,
  deleteLessonPlan
);

// File upload routes
router.post('/:lessonPlanId/files',
  param('lessonPlanId').isInt({ min: 1 }).withMessage('Lesson plan ID must be a positive integer'),
  handleValidationErrors,
  upload.array('files', 10), // อนุญาตให้อัปโหลดได้สูงสุด 10 ไฟล์
  uploadFiles
);

router.delete('/:lessonPlanId/files/:fileId',
  param('lessonPlanId').isInt({ min: 1 }).withMessage('Lesson plan ID must be a positive integer'),
  param('fileId').isInt({ min: 1 }).withMessage('File ID must be a positive integer'),
  handleValidationErrors,
  deleteFile
);

module.exports = router;
