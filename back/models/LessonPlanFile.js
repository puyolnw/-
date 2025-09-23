const { pool } = require('../config/database');

class LessonPlanFile {
  // เพิ่มไฟล์ใหม่
  static async create(fileData) {
    const {
      lesson_plan_id,
      file_name,
      file_path,
      file_size,
      file_type,
      mime_type,
      file_category = 'document'
    } = fileData;

    const query = `
      INSERT INTO lesson_plan_files (
        lesson_plan_id, file_name, file_path, file_size,
        file_type, mime_type, file_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      lesson_plan_id, file_name, file_path, file_size,
      file_type, mime_type, file_category
    ];

    try {
      const [result] = await pool.execute(query, values);
      const createdFile = { id: result.insertId, ...fileData };
      return createdFile;
    } catch (error) {
      throw error;
    }
  }

  // ดึงไฟล์ทั้งหมดของแผนการสอน
  static async findByLessonPlanId(lessonPlanId) {
    const query = `
      SELECT * FROM lesson_plan_files 
      WHERE lesson_plan_id = ? 
      ORDER BY uploaded_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [lessonPlanId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงไฟล์ตาม ID
  static async findById(id) {
    const query = 'SELECT * FROM lesson_plan_files WHERE id = ?';

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // ลบไฟล์
  static async delete(id) {
    const query = 'DELETE FROM lesson_plan_files WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ลบไฟล์ทั้งหมดของแผนการสอน
  static async deleteByLessonPlanId(lessonPlanId) {
    const query = 'DELETE FROM lesson_plan_files WHERE lesson_plan_id = ?';

    try {
      const [result] = await pool.execute(query, [lessonPlanId]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // ตรวจสอบว่าไฟล์เป็นของแผนการสอนหรือไม่
  static async isOwnedByLessonPlan(fileId, lessonPlanId) {
    const query = 'SELECT id FROM lesson_plan_files WHERE id = ? AND lesson_plan_id = ?';

    try {
      const [rows] = await pool.execute(query, [fileId, lessonPlanId]);
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติไฟล์ตามหมวดหมู่
  static async getFileStatsByCategory(lessonPlanId) {
    const query = `
      SELECT 
        file_category,
        COUNT(*) as file_count,
        SUM(file_size) as total_size
      FROM lesson_plan_files 
      WHERE lesson_plan_id = ?
      GROUP BY file_category
    `;

    try {
      const [rows] = await pool.execute(query, [lessonPlanId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LessonPlanFile;
