const { db } = require('../config/database');

// ดึงข้อมูลบันทึกฝึกประสบการณ์ทั้งหมด
const getAllTeachingSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', student_id, school_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ts.id,
        ts.teaching_date,
        ts.start_time,
        ts.end_time,
        ts.class_level,
        ts.class_room,
        ts.student_count,
        ts.lesson_topic,
        ts.lesson_summary,
        ts.learning_outcomes,
        ts.teaching_methods_used,
        ts.materials_used,
        ts.student_engagement,
        ts.problems_encountered,
        ts.problem_solutions,
        ts.lessons_learned,
        ts.reflection,
        ts.improvement_notes,
        ts.teacher_feedback,
        ts.self_rating,
        ts.status,
        ts.created_at,
        ts.updated_at,
        u.id as student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        s.address as school_address,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        lp.lesson_plan_name
      FROM teaching_sessions ts
      JOIN users u ON ts.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.student_code LIKE ? OR 
        s.school_name LIKE ? OR
        ts.lesson_topic LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (student_id) {
      query += ` AND ts.student_id = ?`;
      params.push(student_id);
    }

    if (school_id) {
      query += ` AND ia.school_id = ?`;
      params.push(school_id);
    }

    query += ` ORDER BY ts.teaching_date DESC, ts.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [sessions] = await db.query(query, params);

    // นับจำนวนทั้งหมด
    let countQuery = `
      SELECT COUNT(*) as total
      FROM teaching_sessions ts
      JOIN users u ON ts.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      WHERE 1=1
    `;

    const countParams = [];
    if (search) {
      countQuery += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.student_code LIKE ? OR 
        s.school_name LIKE ? OR
        ts.lesson_topic LIKE ?
      )`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (student_id) {
      countQuery += ` AND ts.student_id = ?`;
      countParams.push(student_id);
    }

    if (school_id) {
      countQuery += ` AND ia.school_id = ?`;
      countParams.push(school_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching teaching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลบันทึกฝึกประสบการณ์ได้'
    });
  }
};

// ดึงข้อมูลบันทึกฝึกประสบการณ์ตาม ID
const getTeachingSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ts.*,
        u.id as student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        s.address as school_address,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        lp.lesson_plan_name
      FROM teaching_sessions ts
      JOIN users u ON ts.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      WHERE ts.id = ?
    `;

    const [sessions] = await db.query(query, [id]);

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลบันทึกฝึกประสบการณ์'
      });
    }

    res.json({
      success: true,
      data: sessions[0]
    });
  } catch (error) {
    console.error('Error fetching teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลบันทึกฝึกประสบการณ์ได้'
    });
  }
};

// อัปเดตข้อมูลบันทึกฝึกประสบการณ์
const updateTeachingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teaching_date,
      start_time,
      end_time,
      class_level,
      class_room,
      student_count,
      lesson_topic,
      lesson_summary,
      learning_outcomes,
      teaching_methods_used,
      materials_used,
      student_engagement,
      problems_encountered,
      problem_solutions,
      lessons_learned,
      reflection,
      improvement_notes,
      teacher_feedback,
      self_rating,
      status
    } = req.body;

    const query = `
      UPDATE teaching_sessions SET
        teaching_date = ?,
        start_time = ?,
        end_time = ?,
        class_level = ?,
        class_room = ?,
        student_count = ?,
        lesson_topic = ?,
        lesson_summary = ?,
        learning_outcomes = ?,
        teaching_methods_used = ?,
        materials_used = ?,
        student_engagement = ?,
        problems_encountered = ?,
        problem_solutions = ?,
        lessons_learned = ?,
        reflection = ?,
        improvement_notes = ?,
        teacher_feedback = ?,
        self_rating = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(query, [
      teaching_date,
      start_time,
      end_time,
      class_level,
      class_room,
      student_count,
      lesson_topic,
      lesson_summary,
      learning_outcomes,
      teaching_methods_used,
      materials_used,
      student_engagement,
      problems_encountered,
      problem_solutions,
      lessons_learned,
      reflection,
      improvement_notes,
      teacher_feedback,
      self_rating,
      status,
      id
    ]);

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลบันทึกฝึกประสบการณ์สำเร็จ'
    });
  } catch (error) {
    console.error('Error updating teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตข้อมูลบันทึกฝึกประสบการณ์ได้'
    });
  }
};

// ลบข้อมูลบันทึกฝึกประสบการณ์
const deleteTeachingSession = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM teaching_sessions WHERE id = ?';
    await db.query(query, [id]);

    res.json({
      success: true,
      message: 'ลบข้อมูลบันทึกฝึกประสบการณ์สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถลบข้อมูลบันทึกฝึกประสบการณ์ได้'
    });
  }
};

module.exports = {
  getAllTeachingSessions,
  getTeachingSessionById,
  updateTeachingSession,
  deleteTeachingSession
};
