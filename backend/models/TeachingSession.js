const { pool } = require('../config/database');

class TeachingSession {
  // สร้างบันทึกการฝึกสอนใหม่
  static async create(sessionData) {
    const {
      student_id,
      lesson_plan_id,
      subject_id,
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
      status = 'submitted'
    } = sessionData;

    const query = `
      INSERT INTO teaching_sessions (
        student_id, lesson_plan_id, subject_id, teaching_date, start_time, end_time,
        class_level, class_room, student_count, lesson_topic, lesson_summary,
        learning_outcomes, teaching_methods_used, materials_used, student_engagement,
        problems_encountered, problem_solutions, lessons_learned, reflection,
        improvement_notes, teacher_feedback, self_rating, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student_id, lesson_plan_id, subject_id, teaching_date, start_time, end_time,
      class_level, class_room, student_count, lesson_topic, lesson_summary,
      learning_outcomes, teaching_methods_used, materials_used, student_engagement,
      problems_encountered, problem_solutions, lessons_learned, reflection,
      improvement_notes, teacher_feedback, self_rating, status
    ];

    console.log('🔵 Model - SQL Query:', query);
    console.log('🔵 Model - Values:', values);

    try {
      const [result] = await pool.execute(query, values);
      console.log('🔵 Model - Insert result:', result);
      return { id: result.insertId, ...sessionData };
    } catch (error) {
      console.error('Error creating teaching session:', error);
      throw error;
    }
  }

  // ดึงบันทึกการฝึกสอนทั้งหมดของนักศึกษา
  static async findByStudentId(studentId, options = {}) {
    const { status, subject_id, lesson_plan_id, start_date, end_date, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT 
        ts.*,
        lp.lesson_plan_name,
        s.subject_code,
        s.subject_name,
        u.first_name,
        u.last_name,
        u.student_code,
        COUNT(tsf.id) as file_count,
        TIMESTAMPDIFF(MINUTE, ts.start_time, ts.end_time) as duration_minutes
      FROM teaching_sessions ts
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN users u ON ts.student_id = u.id
      LEFT JOIN teaching_session_files tsf ON ts.id = tsf.teaching_session_id
      WHERE ts.student_id = ?
    `;
    
    const params = [studentId];

    if (status) {
      query += ' AND ts.status = ?';
      params.push(status);
    }

    if (subject_id) {
      query += ' AND ts.subject_id = ?';
      params.push(subject_id);
    }

    if (lesson_plan_id) {
      query += ' AND ts.lesson_plan_id = ?';
      params.push(lesson_plan_id);
    }

    if (start_date) {
      query += ' AND ts.teaching_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND ts.teaching_date <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY ts.id ORDER BY ts.teaching_date DESC, ts.start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // นับจำนวนบันทึกการฝึกสอนทั้งหมดของนักศึกษา
  static async getTotalCount(studentId, options = {}) {
    const { status, subject_id, lesson_plan_id, start_date, end_date } = options;
    
    let query = `
      SELECT COUNT(*) as total
      FROM teaching_sessions ts
      WHERE ts.student_id = ?
    `;
    
    const params = [studentId];

    if (status) {
      query += ' AND ts.status = ?';
      params.push(status);
    }

    if (subject_id) {
      query += ' AND ts.subject_id = ?';
      params.push(subject_id);
    }

    if (lesson_plan_id) {
      query += ' AND ts.lesson_plan_id = ?';
      params.push(lesson_plan_id);
    }

    if (start_date) {
      query += ' AND ts.teaching_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND ts.teaching_date <= ?';
      params.push(end_date);
    }

    try {
      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // ดึงบันทึกการฝึกสอนตาม ID
  static async findById(id) {
    const query = `
      SELECT 
        ts.*,
        lp.lesson_plan_name,
        s.subject_code,
        s.subject_name,
        u.first_name,
        u.last_name,
        u.student_code,
        TIMESTAMPDIFF(MINUTE, ts.start_time, ts.end_time) as duration_minutes
      FROM teaching_sessions ts
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN users u ON ts.student_id = u.id
      WHERE ts.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching teaching session by ID:', error);
      throw error;
    }
  }

  // อัปเดตบันทึกการฝึกสอน
  static async update(id, updateData) {
    const allowedFields = [
      'lesson_plan_id', 'subject_id', 'teaching_date', 'start_time', 'end_time',
      'class_level', 'class_room', 'student_count', 'lesson_topic', 'lesson_summary',
      'learning_outcomes', 'teaching_methods_used', 'materials_used', 'student_engagement',
      'problems_encountered', 'problem_solutions', 'lessons_learned', 'reflection',
      'improvement_notes', 'teacher_feedback', 'self_rating', 'status'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const query = `
      UPDATE teaching_sessions 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(query, values);
      if (result.affectedRows === 0) {
        throw new Error('Teaching session not found');
      }
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating teaching session:', error);
      throw error;
    }
  }

  // ลบบันทึกการฝึกสอน
  static async delete(id) {
    const query = 'DELETE FROM teaching_sessions WHERE id = ?';

    try {
      console.log('🔵 Model - Delete query:', query, 'ID:', id);
      const [result] = await pool.execute(query, [id]);
      console.log('🔵 Model - Delete result:', result);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('🔵 Model - Error deleting teaching session:', error);
      throw error;
    }
  }

  // ตรวจสอบว่าบันทึกการฝึกสอนเป็นของนักศึกษาหรือไม่
  static async isOwnedByStudent(sessionId, studentId) {
    const query = 'SELECT id FROM teaching_sessions WHERE id = ? AND student_id = ?';

    try {
      const [rows] = await pool.execute(query, [sessionId, studentId]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking teaching session ownership:', error);
      throw error;
    }
  }

  // ดึงสถิติการฝึกสอนของนักศึกษา
  static async getStudentStats(studentId) {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_sessions,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_sessions,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_sessions,
        SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes,
        AVG(self_rating) as average_rating,
        COUNT(DISTINCT teaching_date) as teaching_days,
        COUNT(DISTINCT subject_id) as subjects_taught
      FROM teaching_sessions 
      WHERE student_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติการฝึกสอนตามเดือน
  static async getMonthlyStats(studentId, year, month) {
    const query = `
      SELECT 
        COUNT(*) as sessions_count,
        SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes,
        AVG(self_rating) as average_rating,
        COUNT(DISTINCT teaching_date) as teaching_days,
        COUNT(DISTINCT subject_id) as subjects_taught
      FROM teaching_sessions 
      WHERE student_id = ? 
        AND YEAR(teaching_date) = ? 
        AND MONTH(teaching_date) = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId, year, month]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching monthly teaching stats:', error);
      throw error;
    }
  }

  // ดึงแผนการสอนที่ใช้ได้สำหรับการฝึกสอน
  static async getAvailableLessonPlans(studentId, subjectId = null) {
    let query = `
      SELECT 
        lp.id,
        lp.lesson_plan_name,
        lp.subject_id,
        s.subject_code,
        s.subject_name,
        lp.status as plan_status
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.student_id = ? 
        AND lp.status IN ('active', 'completed')
    `;
    
    const params = [studentId];
    
    if (subjectId) {
      query += ' AND lp.subject_id = ?';
      params.push(subjectId);
    }
    
    query += ' ORDER BY lp.lesson_plan_name';

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TeachingSession;
