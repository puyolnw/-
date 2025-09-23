const { pool } = require('../config/database');

class Subject {
  // สร้างวิชาใหม่
  static async create(subjectData) {
    const {
      subject_code,
      subject_name,
      description,
      created_by
    } = subjectData;

    const query = `
      INSERT INTO subjects (subject_code, subject_name, description, created_by)
      VALUES (?, ?, ?, ?)
    `;

    const values = [subject_code, subject_name, description, created_by];

    try {
      const [result] = await pool.execute(query, values);
      return { id: result.insertId, ...subjectData };
    } catch (error) {
      throw error;
    }
  }

  // ดึงวิชาทั้งหมด
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search } = options;
    
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        COUNT(lp.id) as lesson_plan_count
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
    `;
    
    const params = [];

    if (search) {
      query += ' WHERE s.subject_name LIKE ? OR s.subject_code LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY s.id ORDER BY s.subject_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงวิชาที่ user สร้างขึ้นเอง
  static async findByUser(userId, options = {}) {
    const { limit = 100, offset = 0, search } = options;
    
    let query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        COUNT(lp.id) as lesson_plan_count
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
      WHERE s.created_by = ?
    `;
    
    const params = [userId];

    if (search) {
      query += ' AND (s.subject_name LIKE ? OR s.subject_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY s.id ORDER BY s.subject_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงวิชาตาม ID
  static async findById(id) {
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ดึงวิชาตามรหัสวิชา
  static async findByCode(subjectCode) {
    const query = 'SELECT * FROM subjects WHERE subject_code = ?';

    try {
      const [rows] = await pool.execute(query, [subjectCode]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ดึงวิชาตามชื่อวิชา
  static async findByName(subjectName) {
    const query = 'SELECT * FROM subjects WHERE subject_name = ?';

    try {
      const [rows] = await pool.execute(query, [subjectName]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // อัปเดตวิชา
  static async update(id, updateData) {
    const allowedFields = ['subject_code', 'subject_name', 'description'];
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
      UPDATE subjects 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(query, values);
      if (result.affectedRows === 0) {
        throw new Error('Subject not found');
      }
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // ลบวิชา
  static async delete(id) {
    const query = 'DELETE FROM subjects WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ตรวจสอบว่าวิชามีแผนการสอนหรือไม่
  static async hasLessonPlans(id) {
    const query = 'SELECT COUNT(*) as count FROM lesson_plans WHERE subject_id = ?';

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติวิชา
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_subjects,
        COUNT(DISTINCT lp.student_id) as students_using,
        COUNT(lp.id) as total_lesson_plans
      FROM subjects s
      LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
    `;

    try {
      const [rows] = await pool.execute(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Subject;
