const { db } = require('../config/database');

// ดึงข้อมูลการประเมินทั้งหมด
const getAllEvaluations = async (req, res) => {
  try {
    console.log('🔍 getAllEvaluations called with params:', req.query);
    const { page = 1, limit = 20, search = '', status, student_id, school_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        cr.id,
        cr.total_teaching_hours,
        cr.total_lesson_plans,
        cr.total_teaching_sessions,
        cr.self_evaluation,
        cr.achievements,
        cr.challenges_faced,
        cr.skills_developed,
        cr.future_goals,
        cr.status,
        cr.teacher_rating,
        cr.teacher_comments,
        cr.teacher_reviewed_at,
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
        cr.created_at,
        cr.updated_at,
        u.id as student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        s.address as school_address,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM completion_requests cr
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.student_code LIKE ? OR 
        s.school_name LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      query += ` AND cr.status = ?`;
      params.push(status);
    }

    if (student_id) {
      query += ` AND u.id = ?`;
      params.push(student_id);
    }

    if (school_id) {
      query += ` AND ia.school_id = ?`;
      params.push(school_id);
    }

    query += ` ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    console.log('🔍 Query:', query);
    console.log('🔍 Params:', params);

    const [evaluations] = await db.query(query, params);
    console.log('🔍 Evaluations result:', evaluations.length, 'records');

    // นับจำนวนทั้งหมด
    let countQuery = `
      SELECT COUNT(*) as total
      FROM completion_requests cr
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      WHERE 1=1
    `;

    const countParams = [];
    if (search) {
      countQuery += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.student_code LIKE ? OR 
        s.school_name LIKE ?
      )`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      countQuery += ` AND cr.status = ?`;
      countParams.push(status);
    }

    if (student_id) {
      countQuery += ` AND u.id = ?`;
      countParams.push(student_id);
    }

    if (school_id) {
      countQuery += ` AND ia.school_id = ?`;
      countParams.push(school_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    console.log('🔍 Count result:', total);

    res.json({
      success: true,
      data: evaluations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('💥 Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการประเมินได้',
      error: error.message
    });
  }
};

// ดึงข้อมูลการประเมินตาม ID
const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        cr.*,
        u.id as student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        s.address as school_address,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM completion_requests cr
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      WHERE cr.id = ?
    `;

    const [evaluations] = await db.query(query, [id]);

    if (evaluations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน'
      });
    }

    res.json({
      success: true,
      data: evaluations[0]
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการประเมินได้'
    });
  }
};

// อัปเดตข้อมูลการประเมิน
const updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      total_teaching_hours,
      total_lesson_plans,
      total_teaching_sessions,
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals,
      status,
      teacher_rating,
      teacher_comments,
      supervisor_criteria_1,
      supervisor_criteria_2,
      supervisor_criteria_3,
      supervisor_criteria_4,
      supervisor_criteria_5,
      supervisor_criteria_6,
      supervisor_criteria_7,
      supervisor_criteria_8,
      supervisor_criteria_9,
      supervisor_criteria_10,
      supervisor_comments
    } = req.body;

    // คำนวณคะแนนรวมและเฉลี่ย
    const criteria = [
      supervisor_criteria_1,
      supervisor_criteria_2,
      supervisor_criteria_3,
      supervisor_criteria_4,
      supervisor_criteria_5,
      supervisor_criteria_6,
      supervisor_criteria_7,
      supervisor_criteria_8,
      supervisor_criteria_9,
      supervisor_criteria_10
    ];

    const validCriteria = criteria.filter(score => score !== null && score !== undefined);
    const totalScore = validCriteria.reduce((sum, score) => sum + (parseInt(score) || 0), 0);
    const averageScore = validCriteria.length > 0 ? totalScore / validCriteria.length : 0;

    const query = `
      UPDATE completion_requests SET
        total_teaching_hours = ?,
        total_lesson_plans = ?,
        total_teaching_sessions = ?,
        self_evaluation = ?,
        achievements = ?,
        challenges_faced = ?,
        skills_developed = ?,
        future_goals = ?,
        status = ?,
        teacher_rating = ?,
        teacher_comments = ?,
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
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(query, [
      total_teaching_hours,
      total_lesson_plans,
      total_teaching_sessions,
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals,
      status,
      teacher_rating,
      teacher_comments,
      supervisor_criteria_1,
      supervisor_criteria_2,
      supervisor_criteria_3,
      supervisor_criteria_4,
      supervisor_criteria_5,
      supervisor_criteria_6,
      supervisor_criteria_7,
      supervisor_criteria_8,
      supervisor_criteria_9,
      supervisor_criteria_10,
      totalScore,
      averageScore,
      supervisor_comments,
      id
    ]);

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลการประเมินสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตข้อมูลการประเมินได้'
    });
  }
};

// ลบข้อมูลการประเมิน
const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM completion_requests WHERE id = ?';
    await db.query(query, [id]);

    res.json({
      success: true,
      message: 'ลบข้อมูลการประเมินสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถลบข้อมูลการประเมินได้'
    });
  }
};

module.exports = {
  getAllEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation
};
