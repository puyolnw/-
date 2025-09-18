const { pool } = require('../config/database');

class TeachingSessionFile {
  // เพิ่มไฟล์ใหม่
  static async create(fileData) {
    const {
      teaching_session_id,
      file_name,
      file_path,
      file_size,
      file_type,
      mime_type,
      file_category = 'photo',
      description
    } = fileData;

    const query = `
      INSERT INTO teaching_session_files (
        teaching_session_id, file_name, file_path, file_size,
        file_type, mime_type, file_category, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      teaching_session_id, file_name, file_path, file_size,
      file_type, mime_type, file_category, description
    ];

    try {
      const [result] = await pool.execute(query, values);
      return { id: result.insertId, ...fileData };
    } catch (error) {
      console.error('Error creating teaching session file:', error);
      throw error;
    }
  }

  // ดึงไฟล์ทั้งหมดของบันทึกการฝึกสอน
  static async findByTeachingSessionId(teachingSessionId) {
    const query = `
      SELECT * FROM teaching_session_files 
      WHERE teaching_session_id = ? 
      ORDER BY uploaded_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [teachingSessionId]);
      return rows;
    } catch (error) {
      console.error('Error fetching teaching session files:', error);
      throw error;
    }
  }

  // ดึงไฟล์ตาม ID
  static async findById(id) {
    const query = 'SELECT * FROM teaching_session_files WHERE id = ?';

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching teaching session file by ID:', error);
      throw error;
    }
  }

  // ลบไฟล์
  static async delete(id) {
    const query = 'DELETE FROM teaching_session_files WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting teaching session file:', error);
      throw error;
    }
  }

  // ลบไฟล์ทั้งหมดของบันทึกการฝึกสอน
  static async deleteByTeachingSessionId(teachingSessionId) {
    const query = 'DELETE FROM teaching_session_files WHERE teaching_session_id = ?';

    try {
      const [result] = await pool.execute(query, [teachingSessionId]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting teaching session files:', error);
      throw error;
    }
  }

  // ตรวจสอบว่าไฟล์เป็นของบันทึกการฝึกสอนหรือไม่
  static async isOwnedByTeachingSession(fileId, teachingSessionId) {
    const query = 'SELECT id FROM teaching_session_files WHERE id = ? AND teaching_session_id = ?';

    try {
      const [rows] = await pool.execute(query, [fileId, teachingSessionId]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking file ownership:', error);
      throw error;
    }
  }

  // ดึงสถิติไฟล์ตามหมวดหมู่
  static async getFileStatsByCategory(teachingSessionId) {
    const query = `
      SELECT 
        file_category,
        COUNT(*) as file_count,
        SUM(file_size) as total_size
      FROM teaching_session_files 
      WHERE teaching_session_id = ?
      GROUP BY file_category
    `;

    try {
      const [rows] = await pool.execute(query, [teachingSessionId]);
      return rows;
    } catch (error) {
      console.error('Error fetching file stats:', error);
      throw error;
    }
  }

  // ดึงไฟล์ตามหมวดหมู่
  static async findByCategory(teachingSessionId, category) {
    const query = `
      SELECT * FROM teaching_session_files 
      WHERE teaching_session_id = ? AND file_category = ?
      ORDER BY uploaded_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [teachingSessionId, category]);
      return rows;
    } catch (error) {
      console.error('Error fetching files by category:', error);
      throw error;
    }
  }
}

module.exports = TeachingSessionFile;
