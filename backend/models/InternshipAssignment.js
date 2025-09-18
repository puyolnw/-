const { pool } = require('../config/database');
const SchoolQuota = require('./SchoolQuota');

class InternshipAssignment {
  // ดึงรายการการจับคู่ทั้งหมด
  static async findAll(filters = {}) {
    const { academicYearId, schoolId, studentId, status, page = 1, limit = 10 } = filters;
    
    try {
      let whereClause = '1=1';
      const params = [];

      if (academicYearId) {
        whereClause += ' AND ia.academic_year_id = ?';
        params.push(academicYearId);
      }

      if (schoolId) {
        whereClause += ' AND ia.school_id = ?';
        params.push(schoolId);
      }

      if (studentId) {
        whereClause += ' AND ia.student_id = ?';
        params.push(studentId);
      }

      if (status) {
        whereClause += ' AND ia.status = ?';
        params.push(status);
      }

      const offset = (page - 1) * limit;

      const [rows] = await pool.execute(`
        SELECT 
          ia.*,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          s.student_code,
          s.faculty,
          s.major,
          sch.school_name,
          CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
          ay.year,
          ay.semester
        FROM internship_assignments ia
        JOIN users s ON ia.student_id = s.id
        JOIN schools sch ON ia.school_id = sch.school_id
        LEFT JOIN users t ON ia.teacher_id = t.id
        JOIN academic_years ay ON ia.academic_year_id = ay.id
        WHERE ${whereClause}
        ORDER BY ia.enrollment_date DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // นับจำนวนทั้งหมด
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM internship_assignments ia
        WHERE ${whereClause}
      `, params);

      return {
        assignments: rows,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // ดึงการจับคู่ตาม ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ia.*,
          CONCAT(s.first_name, ' ', s.last_name) as student_name,
          s.student_code,
          s.email as student_email,
          sch.school_name,
          CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
          ay.year,
          ay.semester
        FROM internship_assignments ia
        JOIN users s ON ia.student_id = s.id
        JOIN schools sch ON ia.school_id = sch.school_id
        LEFT JOIN users t ON ia.teacher_id = t.id
        JOIN academic_years ay ON ia.academic_year_id = ay.id
        WHERE ia.id = ?
      `, [id]);

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // นักศึกษาสมัครเข้าโรงเรียน
  static async apply(studentId, schoolId, academicYearId) {
    try {
      // ตรวจสอบว่านักศึกษาสมัครในปีนี้แล้วหรือไม่
      const [existing] = await pool.execute(
        'SELECT id FROM internship_assignments WHERE student_id = ? AND academic_year_id = ?',
        [studentId, academicYearId]
      );

      if (existing.length > 0) {
        throw new Error('Student has already applied for this academic year');
      }

      // ตรวจสอบโควตาโรงเรียน
      const quotaCheck = await SchoolQuota.canAcceptStudent(schoolId, academicYearId);
      
      if (!quotaCheck.canAccept) {
        throw new Error(quotaCheck.reason);
      }

      // สร้างการจับคู่ใหม่
      const [result] = await pool.execute(
        `INSERT INTO internship_assignments (student_id, school_id, academic_year_id, status) 
         VALUES (?, ?, ?, 'active')`,
        [studentId, schoolId, academicYearId]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Admin เพิ่มนักศึกษาเข้าโรงเรียน
  static async create(assignmentData) {
    const {
      student_id,
      school_id,
      academic_year_id,
      teacher_id = null,
      start_date = null,
      end_date = null,
      notes = null
    } = assignmentData;

    try {
      // ตรวจสอบโควตา
      const quotaCheck = await SchoolQuota.canAcceptStudent(school_id, academic_year_id);
      
      if (!quotaCheck.canAccept) {
        throw new Error(quotaCheck.reason);
      }

      const [result] = await pool.execute(
        `INSERT INTO internship_assignments 
         (student_id, school_id, academic_year_id, teacher_id, start_date, end_date, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [student_id, school_id, academic_year_id, teacher_id, start_date, end_date, notes]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทการจับคู่
  static async update(id, assignmentData) {
    const {
      teacher_id,
      start_date,
      end_date,
      notes,
      status
    } = assignmentData;

    try {
      const fields = [];
      const values = [];

      if (teacher_id !== undefined) {
        fields.push('teacher_id = ?');
        values.push(teacher_id);
      }

      if (start_date !== undefined) {
        fields.push('start_date = ?');
        values.push(start_date);
      }

      if (end_date !== undefined) {
        fields.push('end_date = ?');
        values.push(end_date);
      }

      if (notes !== undefined) {
        fields.push('notes = ?');
        values.push(notes);
      }

      if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
      }

      if (fields.length === 0) {
        return true;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const [result] = await pool.execute(
        `UPDATE internship_assignments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ลบการจับคู่
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM internship_assignments WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ยกเลิกการสมัคร (สำหรับนักศึกษา)
  static async cancel(studentId, academicYearId) {
    try {
      const [result] = await pool.execute(
        'UPDATE internship_assignments SET status = ? WHERE student_id = ? AND academic_year_id = ?',
        ['cancelled', studentId, academicYearId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงการสมัครของนักศึกษา
  static async findByStudent(studentId, academicYearId = null) {
    try {
      let whereClause = 'WHERE ia.student_id = ?';
      const params = [studentId];

      if (academicYearId) {
        whereClause += ' AND ia.academic_year_id = ?';
        params.push(academicYearId);
      }

      const [rows] = await pool.execute(`
        SELECT 
          ia.*,
          sch.school_name,
          sch.address,
          sch.phone,
          CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
          t.phone as teacher_phone,
          ay.year,
          ay.semester
        FROM internship_assignments ia
        JOIN schools sch ON ia.school_id = sch.school_id
        LEFT JOIN users t ON ia.teacher_id = t.id
        JOIN academic_years ay ON ia.academic_year_id = ay.id
        ${whereClause}
        ORDER BY ia.enrollment_date DESC
      `, params);

      return academicYearId ? rows[0] : rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติการจับคู่
  static async getStats(filters = {}) {
    const { academicYearId, schoolId } = filters;

    try {
      let whereClause = '1=1';
      const params = [];

      if (academicYearId) {
        whereClause += ' AND academic_year_id = ?';
        params.push(academicYearId);
      }

      if (schoolId) {
        whereClause += ' AND school_id = ?';
        params.push(schoolId);
      }

      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
        FROM internship_assignments
        WHERE ${whereClause}
      `, params);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InternshipAssignment;
