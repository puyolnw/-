const { pool } = require('../config/database');

class AcademicYear {
  // ดึงรายการปีการศึกษาทั้งหมด
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM academic_years ORDER BY year DESC, semester DESC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงปีการศึกษาที่ใช้งานอยู่
  static async findActive() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM academic_years WHERE is_active = 1'
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ดึงปีการศึกษาตาม ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM academic_years WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // สร้างปีการศึกษาใหม่
  static async create(academicYearData) {
    const {
      year,
      semester,
      start_date,
      end_date,
      registration_start,
      registration_end,
      is_active = false
    } = academicYearData;

    try {
      // ตรวจสอบว่าปีการศึกษาซ้ำหรือไม่
      const [existing] = await pool.execute(
        'SELECT id FROM academic_years WHERE year = ? AND semester = ?',
        [year, semester]
      );

      if (existing.length > 0) {
        throw new Error(`Academic year ${year} semester ${semester} already exists`);
      }

      // ถ้าตั้งเป็น active ให้ปิด active ของปีอื่นก่อน
      if (is_active) {
        await pool.execute('UPDATE academic_years SET is_active = 0');
      }

      const [result] = await pool.execute(
        `INSERT INTO academic_years (year, semester, start_date, end_date, registration_start, registration_end, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [year, semester, start_date, end_date, registration_start, registration_end, is_active]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทปีการศึกษา
  static async update(id, academicYearData) {
    const {
      year,
      semester,
      start_date,
      end_date,
      registration_start,
      registration_end,
      is_active
    } = academicYearData;

    try {
      // ถ้าตั้งเป็น active ให้ปิด active ของปีอื่นก่อน
      if (is_active) {
        await pool.execute('UPDATE academic_years SET is_active = 0 WHERE id != ?', [id]);
      }

      const [result] = await pool.execute(
        `UPDATE academic_years 
         SET year = ?, semester = ?, start_date = ?, end_date = ?, 
             registration_start = ?, registration_end = ?, is_active = ?
         WHERE id = ?`,
        [year, semester, start_date, end_date, registration_start, registration_end, is_active, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // เปิดใช้งานปีการศึกษา
  static async activate(id) {
    try {
      // ปิด active ของปีอื่นทั้งหมด
      await pool.execute('UPDATE academic_years SET is_active = 0');
      
      // เปิด active ของปีที่เลือก
      const [result] = await pool.execute(
        'UPDATE academic_years SET is_active = 1 WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ลบปีการศึกษา
  static async delete(id) {
    try {
      // ตรวจสอบว่ามีข้อมูลที่เชื่อมโยงหรือไม่
      const [assignments] = await pool.execute(
        'SELECT COUNT(*) as count FROM internship_assignments WHERE academic_year_id = ?',
        [id]
      );

      if (assignments[0].count > 0) {
        throw new Error('Cannot delete academic year with existing assignments');
      }

      const [result] = await pool.execute(
        'DELETE FROM academic_years WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติปีการศึกษา
  static async getStats(academicYearId = null) {
    try {
      let whereClause = '';
      let params = [];

      if (academicYearId) {
        whereClause = 'WHERE ay.id = ?';
        params = [academicYearId];
      } else {
        whereClause = 'WHERE ay.is_active = 1';
      }

      const [stats] = await pool.execute(`
        SELECT 
          ay.id,
          ay.year,
          ay.semester,
          COUNT(DISTINCT ia.school_id) as participating_schools,
          COUNT(DISTINCT CASE WHEN ia.status = 'active' THEN ia.student_id END) as active_students,
          COUNT(DISTINCT CASE WHEN ia.status = 'completed' THEN ia.student_id END) as completed_students,
          COUNT(DISTINCT st.teacher_id) as assigned_teachers,
          SUM(sq.max_students) as total_quota
        FROM academic_years ay
        LEFT JOIN internship_assignments ia ON ay.id = ia.academic_year_id
        LEFT JOIN school_teachers st ON ay.id = st.academic_year_id
        LEFT JOIN school_quotas sq ON ay.id = sq.academic_year_id
        ${whereClause}
        GROUP BY ay.id, ay.year, ay.semester
      `, params);

      return stats[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AcademicYear;
