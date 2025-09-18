const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getTeacherDashboard,
  getMyStudents,
  getPendingTeachingSessions,
  getPendingLessonPlans,
  getPendingCompletionRequests,
  evaluateTeachingSession,
  evaluateLessonPlan,
  evaluateCompletionRequest,
  getMySchoolInfo,
  getStudentDetail,
  submitDetailedEvaluation
} = require('../controllers/teacherController');

// ใช้ middleware สำหรับ authentication และ authorization
router.use(authenticateToken);
router.use(authorizeRoles(['teacher']));

// Dashboard routes
router.get('/dashboard', getTeacherDashboard);

// School info routes
router.get('/school-info', getMySchoolInfo);

// Student management routes
router.get('/students', getMyStudents);
router.get('/students/:studentId', getStudentDetail);

// Evaluation routes
router.get('/teaching-sessions/pending', getPendingTeachingSessions);
router.get('/lesson-plans/pending', getPendingLessonPlans);
router.get('/completion-requests/pending', getPendingCompletionRequests);

// Evaluation submission routes
router.put('/teaching-sessions/:sessionId/evaluate', evaluateTeachingSession);
router.put('/lesson-plans/:planId/evaluate', evaluateLessonPlan);
router.put('/completion-requests/:requestId/evaluate', evaluateCompletionRequest);

// Detailed evaluation route
router.post('/evaluations/detailed', submitDetailedEvaluation);

module.exports = router;
