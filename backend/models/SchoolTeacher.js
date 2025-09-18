const { pool } = require('../config/database');

class SchoolTeacher {
  // ดึงครูในโรงเรียนตามปีการศึกษา
  static async findBySchoolAndYear(schoolId, academicYearId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          st.*,
          CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
          u.email,
          u.phone,
          u.user_id
        FROM school_teachers st
        JOIN users u ON st.teacher_id = u.id
        WHERE st.school_id = ? AND st.academic_year_id = ?
        ORDER BY st.is_primary DESC, u.first_name
      `, [schoolId, academicYearId]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // เพิ่มครูเข้าโรงเรียน
  static async assign(teacherData) {
    const {
      teacher_id,
      school_id,
      academic_year_id,
      is_primary = false,
      max_students = 5
    } = teacherData;

    try {
      // ตรวจสอบว่าครูอยู่ในโรงเรียนนี้แล้วหรือไม่
      const [existing] = await pool.execute(
        'SELECT id FROM school_teachers WHERE teacher_id = ? AND school_id = ? AND academic_year_id = ?',
        [teacher_id, school_id, academic_year_id]
      );

      if (existing.length > 0) {
        throw new Error('Teacher is already assigned to this school');
      }

      // ตรวจสอบว่าเป็นครูจริงหรือไม่
      const [teacher] = await pool.execute(
        'SELECT role FROM users WHERE id = ? AND role = ?',
        [teacher_id, 'teacher']
      );

      if (teacher.length === 0) {
        throw new Error('User is not a teacher');
      }

      const [result] = await pool.execute(
        `INSERT INTO school_teachers (teacher_id, school_id, academic_year_id, is_primary, max_students) 
         VALUES (?, ?, ?, ?, ?)`,
        [teacher_id, school_id, academic_year_id, is_primary, max_students]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทข้อมูลครู
  static async update(id, teacherData) {
    const {
      is_primary,
      max_students
    } = teacherData;

    try {
      const fields = [];
      const values = [];

      if (is_primary !== undefined) {
        fields.push('is_primary = ?');
        values.push(is_primary);
      }

      if (max_students !== undefined) {
        fields.push('max_students = ?');
        values.push(max_students);
      }

      if (fields.length === 0) {
        return true;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const [result] = await pool.execute(
        `UPDATE school_teachers SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ลบครูออกจากโรงเรียน
  static async remove(id) {
    try {
      // ตรวจสอบว่ามีนักศึกษาที่อยู่ภายใต้การดูแลหรือไม่
      const [students] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM internship_assignments ia
        JOIN school_teachers st ON ia.teacher_id = st.teacher_id 
          AND ia.school_id = st.school_id 
          AND ia.academic_year_id = st.academic_year_id
        WHERE st.id = ? AND ia.status = 'active'
      `, [id]);

      if (students[0].count > 0) {
        throw new Error(`Cannot remove teacher. There are ${students[0].count} active students under supervision`);
      }

      const [result] = await pool.execute(
        'DELETE FROM school_teachers WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงครูที่ยังไม่ได้จับคู่กับโรงเรียน
  static async findAvailableTeachers(schoolId, academicYearId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          u.id,
          u.user_id,
          CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
          u.email,
          u.phone
        FROM users u
        WHERE u.role = 'teacher'
        AND u.id NOT IN (
          SELECT teacher_id 
          FROM school_teachers 
          WHERE school_id = ? AND academic_year_id = ?
        )
        ORDER BY u.first_name
      `, [schoolId, academicYearId]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติครู
  static async getTeacherStats(teacherId, academicYearId) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          st.max_students,
          st.current_students,
          st.is_primary,
          sch.school_name,
          COUNT(ia.id) as total_assignments,
          COUNT(CASE WHEN ia.status = 'active' THEN 1 END) as active_students,
          COUNT(CASE WHEN ia.status = 'completed' THEN 1 END) as completed_students
        FROM school_teachers st
        JOIN schools sch ON st.school_id = sch.school_id
        LEFT JOIN internship_assignments ia ON st.teacher_id = ia.teacher_id 
          AND st.school_id = ia.school_id 
          AND st.academic_year_id = ia.academic_year_id
        WHERE st.teacher_id = ? AND st.academic_year_id = ?
        GROUP BY st.id, st.max_students, st.current_students, st.is_primary, sch.school_name
      `, [teacherId, academicYearId]);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // ตั้งค่าครูหลัก
  static async setPrimary(id) {
    try {
      // ดึงข้อมูลครูที่จะตั้งเป็นหลัก
      const [teacher] = await pool.execute(
        'SELECT school_id, academic_year_id FROM school_teachers WHERE id = ?',
        [id]
      );

      if (teacher.length === 0) {
        throw new Error('Teacher assignment not found');
      }

      // ปิด primary ของครูอื่นในโรงเรียนเดียวกัน
      await pool.execute(
        'UPDATE school_teachers SET is_primary = 0 WHERE school_id = ? AND academic_year_id = ?',
        [teacher[0].school_id, teacher[0].academic_year_id]
      );

      // ตั้งครูนี้เป็น primary
      const [result] = await pool.execute(
        'UPDATE school_teachers SET is_primary = 1 WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SchoolTeacher;
