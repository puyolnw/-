const { pool } = require('../config/database');

class SchoolQuota {
  // ดึงโควตาของโรงเรียนตามปีการศึกษา
  static async findBySchoolAndYear(schoolId, academicYearId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM school_quotas WHERE school_id = ? AND academic_year_id = ?',
        [schoolId, academicYearId]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ดึงโควตาทั้งหมดตามปีการศึกษา
  static async findByYear(academicYearId) {
    try {
      const [rows] = await pool.execute(
        `SELECT sq.*, s.school_name, s.address, s.phone
         FROM school_quotas sq
         JOIN schools s ON sq.school_id = s.school_id
         WHERE sq.academic_year_id = ?
         ORDER BY s.school_name`,
        [academicYearId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // สร้างหรืออัพเดทโควตา
  static async upsert(quotaData) {
    const {
      school_id,
      academic_year_id,
      max_students,
      max_teachers,
      is_open = true
    } = quotaData;

    try {
      // ตรวจสอบว่ามีอยู่แล้วหรือไม่
      const existing = await this.findBySchoolAndYear(school_id, academic_year_id);

      if (existing) {
        // อัพเดท
        const [result] = await pool.execute(
          `UPDATE school_quotas 
           SET max_students = ?, max_teachers = ?, is_open = ?
           WHERE school_id = ? AND academic_year_id = ?`,
          [max_students, max_teachers, is_open, school_id, academic_year_id]
        );
        return existing.id;
      } else {
        // สร้างใหม่
        const [result] = await pool.execute(
          `INSERT INTO school_quotas (school_id, academic_year_id, max_students, max_teachers, is_open) 
           VALUES (?, ?, ?, ?, ?)`,
          [school_id, academic_year_id, max_students, max_teachers, is_open]
        );
        return result.insertId;
      }
    } catch (error) {
      throw error;
    }
  }

  // อัพเดทสถานะเปิด/ปิดรับสมัคร
  static async updateStatus(schoolId, academicYearId, isOpen) {
    try {
      const [result] = await pool.execute(
        'UPDATE school_quotas SET is_open = ? WHERE school_id = ? AND academic_year_id = ?',
        [isOpen, schoolId, academicYearId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ตรวจสอบว่าสามารถรับนักศึกษาเพิ่มได้หรือไม่
  static async canAcceptStudent(schoolId, academicYearId) {
    try {
      const quota = await this.findBySchoolAndYear(schoolId, academicYearId);
      
      if (!quota) {
        return { canAccept: false, reason: 'No quota set for this school and academic year' };
      }

      if (quota.is_open !== 1) {
        return { canAccept: false, reason: 'โรงเรียนนี้ปิดรับสมัครแล้ว' };
      }

      if (quota.current_students >= quota.max_students) {
        return { canAccept: false, reason: 'โรงเรียนนี้เต็มแล้ว ไม่สามารถรับนักศึกษาเพิ่มได้' };
      }

      return { 
        canAccept: true, 
        availableSlots: quota.max_students - quota.current_students,
        quota: quota
      };
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติโควตาทั้งหมด
  static async getOverallStats(academicYearId) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_schools,
          SUM(max_students) as total_quota,
          SUM(current_students) as total_enrolled,
          SUM(max_students - current_students) as total_available,
          COUNT(CASE WHEN is_open = 1 THEN 1 END) as schools_open,
          COUNT(CASE WHEN current_students >= max_students THEN 1 END) as schools_full
        FROM school_quotas 
        WHERE academic_year_id = ?
      `, [academicYearId]);

      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  // ลบโควตา
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM school_quotas WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SchoolQuota;
