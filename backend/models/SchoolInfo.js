const { pool } = require('../config/database');

class SchoolInfo {
  // ดึงข้อมูลโรงเรียนของนักศึกษา
  static async getStudentSchoolInfo(studentId) {
    const query = `
      SELECT 
        s.*,
        ia.id as assignment_id,
        ia.enrollment_date,
        ia.status as assignment_status,
        ia.notes as assignment_notes,
        st.teacher_id,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.phone as teacher_phone,
        t.email as teacher_email,
        ay.year as academic_year,
        ay.semester as academic_semester,
        ay.start_date as academic_start_date,
        ay.end_date as academic_end_date
      FROM schools s
      INNER JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN school_teachers st ON s.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN users t ON st.teacher_id = t.id
      LEFT JOIN academic_years ay ON ia.academic_year_id = ay.id
      WHERE ia.student_id = ? AND ia.status = 'active'
      ORDER BY ia.enrollment_date DESC
      LIMIT 1
    `;

    try {
      console.log('🔵 Backend - SchoolInfo.getStudentSchoolInfo query:', query);
      console.log('🔵 Backend - SchoolInfo.getStudentSchoolInfo studentId:', studentId);
      
      const [rows] = await pool.execute(query, [studentId]);
      console.log('🔵 Backend - SchoolInfo.getStudentSchoolInfo result:', rows);
      
      const result = rows[0] || null;
      console.log('🔵 Backend - SchoolInfo.getStudentSchoolInfo final result:', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching student school info:', error);
      throw error;
    }
  }

  // ดึงข้อมูลครูพี่เลี้ยงของนักศึกษา
  static async getStudentTeacherInfo(studentId) {
    const query = `
      SELECT 
        t.id as teacher_id,
        t.first_name,
        t.last_name,
        t.phone,
        t.email,
        t.profile_image,
        s.school_name,
        s.school_code,
        st.assigned_date,
        st.notes as teacher_notes
      FROM users t
      INNER JOIN school_teachers st ON t.id = st.teacher_id
      INNER JOIN schools s ON st.school_id = s.id
      INNER JOIN internship_assignments ia ON s.id = ia.school_id AND st.academic_year_id = ia.academic_year_id
      WHERE ia.student_id = ? AND ia.status = 'active'
      ORDER BY st.assigned_date DESC
      LIMIT 1
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching student teacher info:', error);
      throw error;
    }
  }

  // ดึงข้อมูลสถิติการฝึกสอนของนักศึกษาในโรงเรียน
  static async getStudentSchoolStats(studentId) {
    const query = `
      SELECT 
        COUNT(ts.id) as total_teaching_sessions,
        COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN ts.status = 'draft' THEN 1 END) as draft_sessions,
        SUM(TIMESTAMPDIFF(MINUTE, ts.start_time, ts.end_time)) as total_teaching_minutes,
        AVG(ts.self_rating) as average_self_rating,
        COUNT(DISTINCT ts.teaching_date) as teaching_days,
        COUNT(DISTINCT ts.subject_id) as subjects_taught,
        MIN(ts.teaching_date) as first_teaching_date,
        MAX(ts.teaching_date) as last_teaching_date
      FROM teaching_sessions ts
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      WHERE ts.student_id = ? AND ia.status = 'active'
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching student school stats:', error);
      throw error;
    }
  }

  // ดึงข้อมูลแผนการสอนที่ใช้ในโรงเรียน
  static async getStudentSchoolLessonPlans(studentId) {
    const query = `
      SELECT 
        lp.id,
        lp.lesson_plan_code,
        lp.lesson_plan_name,
        lp.status,
        lp.created_at,
        s.subject_code,
        s.subject_name,
        COUNT(ts.id) as usage_count
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN teaching_sessions ts ON lp.id = ts.lesson_plan_id
      INNER JOIN internship_assignments ia ON lp.student_id = ia.student_id
      WHERE lp.student_id = ? AND ia.status = 'active'
      GROUP BY lp.id
      ORDER BY lp.created_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows;
    } catch (error) {
      console.error('Error fetching student school lesson plans:', error);
      throw error;
    }
  }

  // ดึงข้อมูลการฝึกสอนล่าสุด
  static async getRecentTeachingSessions(studentId, limit = 5) {
    const query = `
      SELECT 
        ts.id,
        ts.teaching_date,
        ts.start_time,
        ts.end_time,
        ts.lesson_topic,
        ts.status,
        ts.self_rating,
        s.subject_code,
        s.subject_name,
        lp.lesson_plan_name
      FROM teaching_sessions ts
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      INNER JOIN internship_assignments ia ON ts.student_id = ia.student_id
      WHERE ts.student_id = ? AND ia.status = 'active'
      ORDER BY ts.teaching_date DESC, ts.start_time DESC
      LIMIT ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId, limit]);
      return rows;
    } catch (error) {
      console.error('Error fetching recent teaching sessions:', error);
      throw error;
    }
  }

  // ตรวจสอบว่านักศึกษามีการมอบหมายโรงเรียนหรือไม่
  static async hasActiveAssignment(studentId) {
    const query = `
      SELECT COUNT(*) as count
      FROM internship_assignments 
      WHERE student_id = ? AND status = 'active'
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error checking active assignment:', error);
      throw error;
    }
  }

  // ดึงข้อมูลโรงเรียนทั้งหมด (สำหรับ admin)
  static async getAllSchools(options = {}) {
    const { limit = 50, offset = 0, search = '' } = options;
    
    let query = `
      SELECT 
        s.*,
        COUNT(ia.id) as total_students,
        COUNT(CASE WHEN ia.status = 'active' THEN 1 END) as active_students,
        COUNT(st.id) as total_teachers
      FROM schools s
      LEFT JOIN internship_assignments ia ON s.id = ia.school_id
      LEFT JOIN school_teachers st ON s.id = st.school_id
    `;
    
    const params = [];

    if (search) {
      query += ' WHERE s.school_name LIKE ? OR s.school_code LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY s.id ORDER BY s.school_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching all schools:', error);
      throw error;
    }
  }

  // ดึงข้อมูลโรงเรียนตาม ID
  static async getSchoolById(schoolId) {
    const query = `
      SELECT 
        s.*,
        COUNT(ia.id) as total_students,
        COUNT(CASE WHEN ia.status = 'active' THEN 1 END) as active_students,
        COUNT(st.id) as total_teachers
      FROM schools s
      LEFT JOIN internship_assignments ia ON s.id = ia.school_id
      LEFT JOIN school_teachers st ON s.id = st.school_id
      WHERE s.id = ?
      GROUP BY s.id
    `;

    try {
      const [rows] = await pool.execute(query, [schoolId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching school by ID:', error);
      throw error;
    }
  }
}

module.exports = SchoolInfo;
