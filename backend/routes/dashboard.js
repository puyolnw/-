const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getStudentDashboard } = require('../controllers/dashboardController');
const { db } = require('../config/database');

// Dashboard สำหรับนักศึกษา
router.get('/student', authenticateToken, authorizeRoles(['student']), getStudentDashboard);

// ดึงข้อมูลปีการศึกษา (สำหรับทุก role)
router.get('/academic-years', authenticateToken, async (req, res) => {
  try {
    const [academicYears] = await db.query(`
      SELECT 
        id,
        year as academic_year,
        semester,
        start_date,
        end_date,
        is_active
      FROM academic_years 
      ORDER BY start_date DESC
    `);

    res.json({
      success: true,
      data: academicYears
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลปีการศึกษา'
    });
  }
});

module.exports = router;
