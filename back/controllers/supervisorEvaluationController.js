const { db } = require('../config/database');
const { validationResult } = require('express-validator');

// ดึงรายการการประเมินที่รอการประเมิน
const getPendingEvaluations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const evaluations = await db.query(`
      SELECT 
        cr.id,
        cr.student_id,
        cr.assignment_id,
        cr.total_teaching_hours,
        cr.total_lesson_plans,
        cr.total_teaching_sessions,
        cr.status,
        cr.created_at,
        u.first_name,
        u.last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        ay.year as academic_year
      FROM completion_requests cr
      JOIN users u ON cr.student_id = u.id
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      JOIN academic_years ay ON ia.academic_year_id = ay.id
      WHERE cr.status = 'under_review'
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    // นับจำนวนทั้งหมด
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM completion_requests cr
      WHERE cr.status = 'under_review'
    `);
    const total = countResult[0][0].total;

    res.json({
      success: true,
      data: evaluations[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการประเมิน'
    });
  }
};

// ดึงประวัติการประเมิน
const getEvaluationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const evaluations = await db.query(`
      SELECT 
        cr.id,
        cr.student_id,
        cr.assignment_id,
        cr.status,
        cr.supervisor_criteria_1,
        cr.supervisor_criteria_2,
        cr.supervisor_criteria_3,
        cr.supervisor_criteria_4,
        cr.supervisor_criteria_5,
        cr.supervisor_criteria_6,
        cr.supervisor_criteria_7,
        cr.supervisor_criteria_8,
        cr.supervisor_criteria_9,
        cr.supervisor_criteria_10,
        cr.supervisor_total_score,
        cr.supervisor_average_score,
        cr.supervisor_comments,
        cr.supervisor_reviewed_at,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name
      FROM completion_requests cr
      JOIN users u ON cr.student_id = u.id
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN schools s ON ia.school_id = s.school_id
      WHERE cr.status IN ('supervisor_approved', 'supervisor_rejected')
      ORDER BY cr.supervisor_reviewed_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    // นับจำนวนทั้งหมด
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM completion_requests cr
      WHERE cr.status IN ('supervisor_approved', 'supervisor_rejected')
    `);
    const total = countResult[0][0].total;

    res.json({
      success: true,
      data: evaluations[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการประเมิน'
    });
  }
};

// ดึงรายละเอียดการประเมิน
const getEvaluationDetail = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [evaluation] = await db.query(`
      SELECT 
        cr.*,
        u.first_name,
        u.last_name,
        u.student_code,
        u.faculty,
        u.major,
        u.email,
        u.phone,
        s.school_name,
        s.address as school_address,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.email as teacher_email,
        ay.year as academic_year,
        ay.start_date,
        ay.end_date
      FROM completion_requests cr
      JOIN users u ON cr.student_id = u.id
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      JOIN academic_years ay ON ia.academic_year_id = ay.id
      WHERE cr.id = ?
    `, [requestId]);

    if (!evaluation || evaluation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน'
      });
    }

    // ดึงสถิติการสอน
    const teachingStatsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT lp.id) as total_lesson_plans,
        SUM(TIME_TO_SEC(TIMEDIFF(ts.end_time, ts.start_time))) / 3600 as total_hours
      FROM teaching_sessions ts
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      WHERE ts.student_id = ? AND ts.status = 'completed'
    `, [evaluation[0].student_id]);

    evaluation[0].teaching_stats = teachingStatsResult[0][0];

    res.json({
      success: true,
      data: evaluation[0]
    });
  } catch (error) {
    console.error('Error fetching evaluation detail:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการประเมิน'
    });
  }
};

// ประเมินคำร้อง
const evaluateRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { requestId } = req.params;
    const {
      criteria_1,
      criteria_2,
      criteria_3,
      criteria_4,
      criteria_5,
      criteria_6,
      criteria_7,
      criteria_8,
      criteria_9,
      criteria_10,
      overall_rating,
      supervisor_comments,
      decision
    } = req.body;

    const supervisorId = req.user.id;

    // ตรวจสอบว่าคำร้องมีอยู่จริงและรอการประเมิน
    const requestResult = await db.query(
      'SELECT id, status FROM completion_requests WHERE id = ?',
      [requestId]
    );

    const request = requestResult[0];
    if (!request || request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลคำร้อง'
      });
    }

    if (request[0].status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'คำร้องนี้ไม่สามารถประเมินได้'
      });
    }

    // คำนวณคะแนนรวมและเฉลี่ย
    const totalScore = criteria_1 + criteria_2 + criteria_3 + criteria_4 + criteria_5 + 
                      criteria_6 + criteria_7 + criteria_8 + criteria_9 + criteria_10;
    const averageScore = totalScore / 10;

    // กำหนดสถานะใหม่
    const newStatus = decision === 'approved' ? 'supervisor_approved' : 'supervisor_rejected';

    // อัปเดตข้อมูลการประเมิน
    await db.query(`
      UPDATE completion_requests SET
        supervisor_criteria_1 = ?,
        supervisor_criteria_2 = ?,
        supervisor_criteria_3 = ?,
        supervisor_criteria_4 = ?,
        supervisor_criteria_5 = ?,
        supervisor_criteria_6 = ?,
        supervisor_criteria_7 = ?,
        supervisor_criteria_8 = ?,
        supervisor_criteria_9 = ?,
        supervisor_criteria_10 = ?,
        supervisor_total_score = ?,
        supervisor_average_score = ?,
        supervisor_comments = ?,
        supervisor_reviewed_at = NOW(),
        status = ?
      WHERE id = ?
    `, [
      criteria_1, criteria_2, criteria_3, criteria_4, criteria_5,
      criteria_6, criteria_7, criteria_8, criteria_9, criteria_10,
      totalScore, averageScore, supervisor_comments, newStatus, requestId
    ]);

    // ถ้าประเมินไม่ผ่าน ให้เปลี่ยนสถานะกลับเป็น pending เพื่อให้นักศึกษาทำใหม่
    if (decision === 'rejected') {
      await db.query(
        'UPDATE completion_requests SET status = ? WHERE id = ?',
        ['pending', requestId]
      );
    }

    res.json({
      success: true,
      message: decision === 'approved' ? 'ประเมินผ่านเรียบร้อยแล้ว' : 'ประเมินไม่ผ่าน นักศึกษาต้องทำคำร้องใหม่'
    });
  } catch (error) {
    console.error('Error evaluating request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมิน'
    });
  }
};

module.exports = {
  getPendingEvaluations,
  getEvaluationHistory,
  getEvaluationDetail,
  evaluateRequest
};