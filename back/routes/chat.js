const express = require('express');
const { body, param, query } = require('express-validator');
const {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  getAllUsers
} = require('../controllers/chatController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const sendMessageValidation = [
  body('receiver_id')
    .isInt({ min: 1 })
    .withMessage('Receiver ID must be a positive integer'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters'),
  body('message_type')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Message type must be text, image, or file')
];

const getMessagesValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

const markAsReadValidation = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a positive integer')
];

const deleteMessageValidation = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a positive integer')
];

const searchMessagesValidation = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1-100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1-50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Chat routes
router.post('/send',
  sendMessageValidation,
  handleValidationErrors,
  sendMessage
);

router.get('/conversations',
  getConversations
);

router.get('/messages/:userId',
  getMessagesValidation,
  handleValidationErrors,
  getMessages
);

router.put('/messages/:messageId/read',
  markAsReadValidation,
  handleValidationErrors,
  markAsRead
);

router.delete('/messages/:messageId',
  deleteMessageValidation,
  handleValidationErrors,
  deleteMessage
);

router.get('/unread-count',
  getUnreadCount
);

router.get('/search',
  searchMessagesValidation,
  handleValidationErrors,
  searchMessages
);

// Route สำหรับ supervisor เพื่อดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/users',
  getAllUsers
);

// Routes สำหรับนักเรียน
router.get('/student/available-teachers',
  authorizeRoles(['student']),
  require('../controllers/studentController').getAvailableTeachers
);

router.get('/student/available-supervisors',
  authorizeRoles(['student']),
  require('../controllers/studentController').getAvailableSupervisors
);

module.exports = router;
