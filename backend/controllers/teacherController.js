const User = require('../models/User');
const SchoolInfo = require('../models/SchoolInfo');
const TeachingSession = require('../models/TeachingSession');
const LessonPlan = require('../models/LessonPlan');
const CompletionRequest = require('../models/CompletionRequest');

// ดึงข้อมูล Dashboard ของครูพี่เลี้ยง
const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting teacher dashboard for teacher ID:', teacherId);

    // ดึงข้อมูลครูพี่เลี้ยง
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลครูพี่เลี้ยง'
      });
    }

    // ดึงข้อมูลโรงเรียน
    let schoolInfo = null;
    try {
      schoolInfo = await SchoolInfo.getTeacherSchoolInfo(teacherId);
    } catch (error) {
      console.log('🔵 Backend - No school info found:', error.message);
    }

    // ดึงสถิติ
    const stats = await getTeacherStats(teacherId);

    // ดึงนักศึกษาล่าสุด
    const recentStudents = await getRecentStudents(teacherId);

    // ดึงการประเมินที่รออยู่
    const pendingEvaluations = await getPendingEvaluations(teacherId);

    const dashboardData = {
      teacher: {
        id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        user_id: teacher.user_id,
        email: teacher.email
      },
      schoolInfo,
      stats,
      recentStudents,
      pendingEvaluations
    };

    console.log('🔵 Backend - Teacher dashboard data prepared:', {
      hasSchoolInfo: !!schoolInfo,
      statsCount: Object.keys(stats).length,
      recentStudentsCount: recentStudents.length,
      pendingEvaluationsCount: pendingEvaluations.length
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting teacher dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด'
    });
  }
};

// ดึงสถิติของครูพี่เลี้ยง
const getTeacherStats = async (teacherId) => {
  try {
    // ดึงจำนวนนักศึกษาที่ดูแล
    const totalStudents = await getTotalStudents(teacherId);
    
    // ดึงจำนวนการประเมินที่รออยู่
    const pendingEvaluations = await getPendingEvaluationsCount(teacherId);
    
    // ดึงจำนวนการประเมินที่เสร็จแล้ว
    const completedEvaluations = await getCompletedEvaluationsCount(teacherId);
    
    // ดึงจำนวนคำร้องขอสำเร็จการฝึกที่รออยู่
    const pendingCompletionRequests = await getPendingCompletionRequestsCount(teacherId);

    return {
      totalStudents,
      pendingEvaluations,
      completedEvaluations,
      pendingCompletionRequests
    };
  } catch (error) {
    console.error('Error getting teacher stats:', error);
    return {
      totalStudents: 0,
      pendingEvaluations: 0,
      completedEvaluations: 0,
      pendingCompletionRequests: 0
    };
  }
};

// ดึงจำนวนนักศึกษาที่ดูแล
const getTotalStudents = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT COUNT(DISTINCT ia.student_id) as total
      FROM internship_assignments ia
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE st.teacher_id = ? AND ia.status = 'active'
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error('Error getting total students:', error);
    return 0;
  }
};

// ดึงจำนวนการประเมินที่รออยู่
const getPendingEvaluationsCount = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM teaching_sessions ts 
         INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
         INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
         WHERE st.teacher_id = ? AND ts.status = 'submitted' AND ts.teacher_feedback IS NULL) +
        (SELECT COUNT(*) FROM lesson_plans lp 
         INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
         INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
         WHERE st.teacher_id = ? AND lp.status = 'active' AND lp.teacher_feedback IS NULL) as total
    `;
    const [rows] = await pool.execute(query, [teacherId, teacherId]);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error('Error getting pending evaluations count:', error);
    return 0;
  }
};

// ดึงจำนวนการประเมินที่เสร็จแล้ว
const getCompletedEvaluationsCount = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM teaching_sessions ts 
         INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
         INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
         WHERE st.teacher_id = ? AND ts.teacher_feedback IS NOT NULL) +
        (SELECT COUNT(*) FROM lesson_plans lp 
         INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
         INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
         WHERE st.teacher_id = ? AND lp.teacher_feedback IS NOT NULL) as total
    `;
    const [rows] = await pool.execute(query, [teacherId, teacherId]);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error('Error getting completed evaluations count:', error);
    return 0;
  }
};

// ดึงจำนวนคำร้องขอสำเร็จการฝึกที่รออยู่
const getPendingCompletionRequestsCount = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT COUNT(*) as total
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE st.teacher_id = ? AND cr.status = 'pending'
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    return rows[0]?.total || 0;
  } catch (error) {
    console.error('Error getting pending completion requests count:', error);
    return 0;
  }
};

// ดึงนักศึกษาล่าสุด
const getRecentStudents = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.user_id,
        u.email,
        u.student_code,
        ia.id as assignment_id,
        ia.enrollment_date,
        ia.status,
        COALESCE(ts_stats.total_sessions, 0) as total_teaching_sessions,
        COALESCE(ts_stats.total_hours, 0) as total_teaching_hours,
        COALESCE(lp_stats.total_plans, 0) as total_lesson_plans,
        COALESCE(ts_stats.last_activity, ia.enrollment_date) as last_activity
      FROM internship_assignments ia
      INNER JOIN users u ON ia.student_id = u.id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_sessions,
          SUM(TIMESTAMPDIFF(MINUTE, CONCAT(teaching_date, ' ', start_time), CONCAT(teaching_date, ' ', end_time)) / 60.0) as total_hours,
          MAX(updated_at) as last_activity
        FROM teaching_sessions
        GROUP BY student_id
      ) ts_stats ON ia.student_id = ts_stats.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_plans
        FROM lesson_plans
        GROUP BY student_id
      ) lp_stats ON ia.student_id = lp_stats.student_id
      WHERE st.teacher_id = ? AND ia.status = 'active'
      ORDER BY last_activity DESC
      LIMIT 5
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    
    return rows.map(row => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      user_id: row.user_id,
      student_code: row.student_code,
      email: row.email,
      progress: Math.min(100, Math.round((row.total_teaching_sessions + row.total_lesson_plans) * 10)),
      lastActivity: row.last_activity,
      status: row.status,
      total_teaching_sessions: row.total_teaching_sessions,
      total_teaching_hours: row.total_teaching_hours,
      total_lesson_plans: row.total_lesson_plans
    }));
  } catch (error) {
    console.error('Error getting recent students:', error);
    return [];
  }
};

// ดึงการประเมินที่รออยู่
const getPendingEvaluations = async (teacherId) => {
  try {
    const { pool } = require('../config/database');
    const query = `
      SELECT 
        'teaching_session' as type,
        ts.id,
        ts.student_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        ts.lesson_topic,
        ts.teaching_date,
        ts.status,
        ts.updated_at as submitted_at
      FROM teaching_sessions ts
      INNER JOIN users u ON ts.student_id = u.id
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE st.teacher_id = ? AND ts.status = 'submitted' AND ts.teacher_feedback IS NULL
      
      UNION ALL
      
      SELECT 
        'lesson_plan' as type,
        lp.id,
        lp.student_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        lp.lesson_plan_name,
        lp.created_at as teaching_date,
        lp.status,
        lp.updated_at as submitted_at
      FROM lesson_plans lp
      INNER JOIN users u ON lp.student_id = u.id
      INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE st.teacher_id = ? AND lp.status = 'active' AND lp.teacher_feedback IS NULL
      
      ORDER BY submitted_at DESC
      LIMIT 10
    `;
    const [rows] = await pool.execute(query, [teacherId, teacherId]);
    return rows;
  } catch (error) {
    console.error('Error getting pending evaluations:', error);
    return [];
  }
};

// ดึงรายชื่อนักศึกษาที่ดูแล
const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting my students for teacher ID:', teacherId);

    const { pool } = require('../config/database');
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.user_id,
        u.email,
        u.student_code,
        ia.id as assignment_id,
        ia.enrollment_date,
        ia.status,
        COALESCE(ts_stats.total_sessions, 0) as total_teaching_sessions,
        COALESCE(ts_stats.total_hours, 0) as total_teaching_hours,
        COALESCE(lp_stats.total_plans, 0) as total_lesson_plans,
        COALESCE(ts_stats.last_activity, ia.enrollment_date) as last_activity
      FROM internship_assignments ia
      INNER JOIN users u ON ia.student_id = u.id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_sessions,
          SUM(TIMESTAMPDIFF(MINUTE, CONCAT(teaching_date, ' ', start_time), CONCAT(teaching_date, ' ', end_time)) / 60.0) as total_hours,
          MAX(updated_at) as last_activity
        FROM teaching_sessions
        GROUP BY student_id
      ) ts_stats ON ia.student_id = ts_stats.student_id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(*) as total_plans
        FROM lesson_plans
        GROUP BY student_id
      ) lp_stats ON ia.student_id = lp_stats.student_id
      WHERE st.teacher_id = ? AND ia.status = 'active'
      ORDER BY u.first_name, u.last_name
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error getting my students:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

// ดึงบันทึกการฝึกสอนที่รอการประเมิน
const getPendingTeachingSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting pending teaching sessions for teacher ID:', teacherId);

    const { pool } = require('../config/database');
    const query = `
      SELECT 
        ts.id,
        ts.student_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        ts.lesson_topic as lesson_plan_name,
        s.subject_name,
        ts.teaching_date,
        ts.start_time,
        ts.end_time,
        ts.status,
        ts.updated_at as submitted_at
      FROM teaching_sessions ts
      INNER JOIN users u ON ts.student_id = u.id
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE st.teacher_id = ? AND ts.status = 'submitted' AND ts.teacher_feedback IS NULL
      ORDER BY ts.updated_at DESC
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error getting pending teaching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกสอน'
    });
  }
};

// ดึงแผนการสอนที่รอการประเมิน
const getPendingLessonPlans = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting pending lesson plans for teacher ID:', teacherId);

    const { pool } = require('../config/database');
    const query = `
      SELECT 
        lp.id,
        lp.student_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        lp.lesson_plan_name,
        s.subject_name,
        lp.status,
        lp.created_at,
        lp.updated_at as submitted_at
      FROM lesson_plans lp
      INNER JOIN users u ON lp.student_id = u.id
      INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE st.teacher_id = ? AND lp.status = 'active' AND (lp.teacher_feedback IS NULL OR lp.teacher_feedback = '')
      ORDER BY lp.updated_at DESC
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error getting pending lesson plans:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนการสอน'
    });
  }
};

// ดึงคำร้องขอสำเร็จการฝึกที่รอการประเมิน
const getPendingCompletionRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting pending completion requests for teacher ID:', teacherId);

    const { pool } = require('../config/database');
    const query = `
      SELECT 
        cr.id,
        cr.student_id,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        cr.request_date,
        cr.status,
        cr.total_teaching_hours,
        cr.total_lesson_plans,
        cr.total_teaching_sessions,
        cr.self_evaluation
      FROM completion_requests cr
      INNER JOIN users u ON cr.student_id = u.id
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE st.teacher_id = ? AND cr.status = 'pending'
      ORDER BY cr.request_date DESC
    `;
    const [rows] = await pool.execute(query, [teacherId]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error getting pending completion requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้องขอสำเร็จการฝึก'
    });
  }
};

// ประเมินบันทึกการฝึกสอน
const evaluateTeachingSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { teacher_feedback, teacher_rating } = req.body;
    const teacherId = req.user.id;

    console.log('🔵 Backend - Evaluating teaching session:', { sessionId, teacher_feedback, teacher_rating, teacherId });

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า teacher มีสิทธิ์ประเมิน session นี้หรือไม่
    const checkQuery = `
      SELECT ts.id
      FROM teaching_sessions ts
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE ts.id = ? AND st.teacher_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [sessionId, teacherId]);
    
    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ประเมินบันทึกการฝึกสอนนี้'
      });
    }

    // อัปเดตการประเมิน
    const updateQuery = `
      UPDATE teaching_sessions 
      SET teacher_feedback = ?, teacher_rating = ?, teacher_reviewed_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(updateQuery, [teacher_feedback, teacher_rating, sessionId]);
    
    res.json({
      success: true,
      message: 'ประเมินบันทึกการฝึกสอนสำเร็จ'
    });
  } catch (error) {
    console.error('Error evaluating teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมินบันทึกการฝึกสอน'
    });
  }
};

// ประเมินแผนการสอน
const evaluateLessonPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { teacher_feedback, teacher_rating } = req.body;
    const teacherId = req.user.id;

    console.log('🔵 Backend - Evaluating lesson plan:', { planId, teacher_feedback, teacher_rating, teacherId });

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า teacher มีสิทธิ์ประเมิน plan นี้หรือไม่
    const checkQuery = `
      SELECT lp.id
      FROM lesson_plans lp
      INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE lp.id = ? AND st.teacher_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [planId, teacherId]);
    
    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ประเมินแผนการสอนนี้'
      });
    }

    // อัปเดตการประเมิน
    const updateQuery = `
      UPDATE lesson_plans 
      SET teacher_feedback = ?, teacher_rating = ?, teacher_reviewed_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(updateQuery, [teacher_feedback, teacher_rating, planId]);
    
    res.json({
      success: true,
      message: 'ประเมินแผนการสอนสำเร็จ'
    });
  } catch (error) {
    console.error('Error evaluating lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมินแผนการสอน'
    });
  }
};

// ประเมินคำร้องขอสำเร็จการฝึก
const evaluateCompletionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { teacher_comments, teacher_rating, status } = req.body;
    const teacherId = req.user.id;

    console.log('🔵 Backend - Evaluating completion request:', { requestId, teacher_comments, teacher_rating, status, teacherId });

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า teacher มีสิทธิ์ประเมิน request นี้หรือไม่
    const checkQuery = `
      SELECT cr.id
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE cr.id = ? AND st.teacher_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [requestId, teacherId]);
    
    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ประเมินคำร้องขอสำเร็จการฝึกนี้'
      });
    }

    // อัปเดตการประเมิน - ใช้ status ที่ส่งมาจาก frontend
    let finalStatus = status;
    
    // ถ้าผ่าน ให้ส่งไปรออาจารย์นิเทศ
    if (status === 'approved') {
      finalStatus = 'under_review';
    }
    // ถ้าไม่ผ่าน ให้เป็น rejected
    else if (status === 'rejected') {
      finalStatus = 'rejected';
    }
    
    const updateQuery = `
      UPDATE completion_requests 
      SET teacher_comments = ?, teacher_rating = ?, teacher_reviewed_at = NOW(), status = ?
      WHERE id = ?
    `;
    await pool.execute(updateQuery, [teacher_comments, teacher_rating, finalStatus, requestId]);
    
    res.json({
      success: true,
      message: 'ประเมินคำร้องขอสำเร็จการฝึกสำเร็จ'
    });
  } catch (error) {
    console.error('Error evaluating completion request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมินคำร้องขอสำเร็จการฝึก'
    });
  }
};

// ส่งการประเมินแบบละเอียด
const submitDetailedEvaluation = async (req, res) => {
  try {
    const { teachingSessionId, criteria, overallFeedback, overallRating, passStatus, passReason } = req.body;
    const teacherId = req.user.id;

    console.log('🔵 Backend - Submitting detailed evaluation:', { 
      teachingSessionId, 
      criteriaCount: criteria.length, 
      overallRating, 
      passStatus,
      teacherId 
    });

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า teacher มีสิทธิ์ประเมิน session นี้หรือไม่
    const checkQuery = `
      SELECT ts.id, ts.student_id
      FROM teaching_sessions ts
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE ts.id = ? AND st.teacher_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [teachingSessionId, teacherId]);
    
    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ประเมินบันทึกการฝึกสอนนี้'
      });
    }

    const studentId = checkRows[0].student_id;

    // เริ่ม transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // สร้างการประเมินหลัก
      const evaluationQuery = `
        INSERT INTO teaching_evaluations 
        (teaching_session_id, evaluator_id, overall_score, comments, pass_status, pass_reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [evaluationResult] = await connection.execute(evaluationQuery, [
        teachingSessionId, teacherId, overallRating, overallFeedback, passStatus, passReason
      ]);
      
      const evaluationId = evaluationResult.insertId;

      // เพิ่มเกณฑ์การประเมิน
      for (const criterion of criteria) {
        const criteriaQuery = `
          INSERT INTO evaluation_criteria 
          (evaluation_id, criterion_name, criterion_description, rating, feedback)
          VALUES (?, ?, ?, ?, ?)
        `;
        await connection.execute(criteriaQuery, [
          evaluationId, 
          criterion.name, 
          criterion.description, 
          criterion.rating, 
          criterion.feedback
        ]);
      }

      // อัปเดต teaching_session ให้มี teacher_feedback
      const updateSessionQuery = `
        UPDATE teaching_sessions 
        SET teacher_feedback = ?, teacher_rating = ?, teacher_reviewed_at = NOW()
        WHERE id = ?
      `;
      await connection.execute(updateSessionQuery, [
        `ประเมินแบบละเอียด - คะแนนรวม: ${overallRating}/5`,
        overallRating,
        teachingSessionId
      ]);

      // commit transaction
      await connection.commit();

      res.json({
        success: true,
        message: 'ประเมินแบบละเอียดสำเร็จ',
        data: {
          evaluationId,
          overallRating,
          criteriaCount: criteria.length
        }
      });
    } catch (error) {
      // rollback transaction
      await connection.rollback();
      throw error;
    } finally {
      // release connection
      connection.release();
    }
  } catch (error) {
    console.error('Error submitting detailed evaluation:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมินแบบละเอียด: ' + error.message
    });
  }
};

// ดึงข้อมูลโรงเรียนของครูพี่เลี้ยง
const getMySchoolInfo = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting school info for teacher:', teacherId);

    const { pool } = require('../config/database');
    
    // ดึงข้อมูลโรงเรียนที่ครูสังกัด
    const schoolQuery = `
      SELECT s.*, st.academic_year_id
      FROM schools s
      INNER JOIN school_teachers st ON s.school_id = st.school_id
      WHERE st.teacher_id = ?
    `;
    const [schoolRows] = await pool.execute(schoolQuery, [teacherId]);

    if (schoolRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียนที่คุณสังกัด'
      });
    }

    const school = schoolRows[0];

    // ดึงข้อมูลปีการศึกษา
    const academicYearQuery = `
      SELECT ay.id, ay.year, 
             COUNT(ia.student_id) as student_count,
             COUNT(CASE WHEN cr.status = 'approved' THEN 1 END) as completed_count,
             ROUND(COUNT(CASE WHEN cr.status = 'approved' THEN 1 END) * 100.0 / COUNT(ia.student_id), 2) as completion_rate
      FROM academic_years ay
      LEFT JOIN internship_assignments ia ON ay.id = ia.academic_year_id AND ia.school_id = ?
      LEFT JOIN completion_requests cr ON ia.student_id = cr.student_id
      WHERE ay.id IN (SELECT DISTINCT academic_year_id FROM school_teachers WHERE teacher_id = ?)
      GROUP BY ay.id, ay.year
      ORDER BY ay.year DESC
    `;
    const [academicYearRows] = await pool.execute(academicYearQuery, [school.id, teacherId]);

    // ดึงข้อมูลนักศึกษาที่ดูแล
    const studentsQuery = `
      SELECT u.id, u.user_id, u.first_name, u.last_name, u.student_code, u.email, u.phone, u.faculty, u.major, u.created_at as enrollment_date,
             'active' as status,
             COUNT(ts.id) as totalTeachingSessions,
             COALESCE(SUM(TIMESTAMPDIFF(HOUR, ts.start_time, ts.end_time)), 0) as totalTeachingHours,
             COUNT(lp.id) as totalLessonPlans,
             MAX(COALESCE(ts.created_at, lp.created_at)) as lastActivity
      FROM users u
      INNER JOIN internship_assignments ia ON u.id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN teaching_sessions ts ON u.id = ts.student_id
      LEFT JOIN lesson_plans lp ON u.id = lp.student_id
      WHERE st.teacher_id = ? AND u.role = 'student'
      GROUP BY u.id, u.user_id, u.first_name, u.last_name, u.student_code, u.email, u.phone, u.faculty, u.major, u.created_at
      ORDER BY u.first_name, u.last_name
    `;
    const [studentRows] = await pool.execute(studentsQuery, [teacherId]);

    res.json({
      success: true,
      data: {
        schoolInfo: school,
        academicYears: academicYearRows,
        students: studentRows
      }
    });
  } catch (error) {
    console.error('Error getting school info:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน'
    });
  }
};

// ดึงรายละเอียดนักศึกษา
const getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;
    console.log('🔵 Backend - Getting student detail for ID:', studentId, 'by teacher:', teacherId);

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า teacher มีสิทธิ์ดูข้อมูล student นี้หรือไม่
    const checkQuery = `
      SELECT u.*
      FROM users u
      INNER JOIN internship_assignments ia ON u.id = ia.student_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      WHERE u.id = ? AND st.teacher_id = ? AND u.role = 'student'
    `;
    const [checkRows] = await pool.execute(checkQuery, [studentId, teacherId]);

    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ดูข้อมูลนักศึกษาคนนี้'
      });
    }

    const studentInfo = checkRows[0];

    // ดึงข้อมูลบันทึกการฝึกสอน
    const teachingSessionsQuery = `
      SELECT ts.*, s.subject_name
      FROM teaching_sessions ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.student_id = ?
      ORDER BY ts.teaching_date DESC, ts.start_time DESC
    `;
    const [teachingSessionRows] = await pool.execute(teachingSessionsQuery, [studentId]);

    // ดึงข้อมูลแผนการสอน
    const lessonPlansQuery = `
      SELECT lp.*, s.subject_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.student_id = ?
      ORDER BY lp.created_at DESC
    `;
    const [lessonPlanRows] = await pool.execute(lessonPlansQuery, [studentId]);

    res.json({
      success: true,
      data: {
        studentInfo,
        teachingSessions: teachingSessionRows,
        lessonPlans: lessonPlanRows
      }
    });
  } catch (error) {
    console.error('Error getting student detail:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

module.exports = {
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
};
