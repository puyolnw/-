const { pool } = require('../config/database');

class LessonPlan {
  // สร้างแผนการสอนใหม่
  static async create(lessonPlanData) {
    const {
      student_id,
      lesson_plan_name,
      subject_id,
      description = null,
      objectives = null,
      teaching_methods = null,
      assessment_methods = null,
      duration_minutes = 50,
      target_grade = null,
      status = 'active'
    } = lessonPlanData;

    const query = `
      INSERT INTO lesson_plans (
        student_id, lesson_plan_name, subject_id, description, objectives,
        teaching_methods, assessment_methods, duration_minutes, target_grade, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student_id, lesson_plan_name, subject_id, description, objectives,
      teaching_methods, assessment_methods, duration_minutes, target_grade, status
    ];

    try {
      const [result] = await pool.execute(query, values);
      const createdPlan = { id: result.insertId, ...lessonPlanData };
      return createdPlan;
    } catch (error) {
      throw error;
    }
  }

  // ดึงแผนการสอนทั้งหมดของนักศึกษา
  static async findByStudentId(studentId, options = {}) {
    const { status, subject_id, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT 
        lp.*,
        s.subject_code,
        s.subject_name,
        u.first_name,
        u.last_name,
        u.student_code,
        COUNT(lpf.id) as file_count
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN users u ON lp.student_id = u.id
      LEFT JOIN lesson_plan_files lpf ON lp.id = lpf.lesson_plan_id
      WHERE lp.student_id = ?
    `;
    
    const params = [studentId];

    if (status) {
      query += ' AND lp.status = ?';
      params.push(status);
    }

    if (subject_id) {
      query += ' AND lp.subject_id = ?';
      params.push(subject_id);
    }

    query += ' GROUP BY lp.id ORDER BY lp.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ดึงแผนการสอนตาม ID
  static async findById(id) {
    const query = `
      SELECT 
        lp.*,
        s.subject_code,
        s.subject_name,
        u.first_name,
        u.last_name,
        u.student_code
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      LEFT JOIN users u ON lp.student_id = u.id
      WHERE lp.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // อัปเดตแผนการสอน
  static async update(id, updateData) {
    
    const allowedFields = [
      'lesson_plan_name', 'subject_id', 'description', 'objectives',
      'teaching_methods', 'assessment_methods', 'duration_minutes',
      'target_grade', 'status'
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
      UPDATE lesson_plans 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    

    try {
      const [result] = await pool.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Lesson plan not found');
      }
      
      const updatedPlan = await this.findById(id);
      return updatedPlan;
    } catch (error) {
      throw error;
    }
  }

  // ลบแผนการสอน
  static async delete(id) {
    const query = 'DELETE FROM lesson_plans WHERE id = ?';

    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // ตรวจสอบว่าแผนการสอนเป็นของนักศึกษาหรือไม่
  static async isOwnedByStudent(lessonPlanId, studentId) {
    const query = 'SELECT id FROM lesson_plans WHERE id = ? AND student_id = ?';

    try {
      const [rows] = await pool.execute(query, [lessonPlanId, studentId]);
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // ดึงสถิติแผนการสอนของนักศึกษา
  static async getStudentStats(studentId) {
    const query = `
      SELECT 
        COUNT(*) as total_plans,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_plans,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_plans,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_plans,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_plans
      FROM lesson_plans 
      WHERE student_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ดึงข้อมูลแผนการสอนของนักเรียนทั้งหมดในโรงเรียนเดียวกัน
  static async getBySchoolWithStudents(schoolId, page = 1, limit = 10, search = '', subject_id = '', status = '') {
    const offset = (page - 1) * limit;
    
    let whereConditions = ['ia.school_id = ?'];
    let queryParams = [schoolId];
    
    if (search) {
      whereConditions.push('(lp.lesson_plan_name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR s.subject_name LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (subject_id) {
      whereConditions.push('lp.subject_id = ?');
      queryParams.push(subject_id);
    }
    
    if (status) {
      whereConditions.push('lp.status = ?');
      queryParams.push(status);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Query สำหรับดึงข้อมูล
    const query = `
      SELECT 
        lp.*,
        s.subject_code,
        s.subject_name,
        u.first_name,
        u.last_name,
        u.student_code,
        u.user_id as student_user_id,
        ia.teacher_id,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        GROUP_CONCAT(
          CONCAT(
            lpf.id, '|',
            lpf.file_name, '|',
            lpf.file_path, '|',
            lpf.file_size, '|',
            lpf.file_type, '|',
            lpf.file_category
          ) SEPARATOR '||'
        ) as files
      FROM lesson_plans lp
      JOIN users u ON lp.student_id = u.id
      JOIN subjects s ON lp.subject_id = s.id
      JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN lesson_plan_files lpf ON lp.id = lpf.lesson_plan_id
      WHERE ${whereClause}
      GROUP BY lp.id
      ORDER BY lp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Query สำหรับนับจำนวนทั้งหมด
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lesson_plans lp
      JOIN users u ON lp.student_id = u.id
      JOIN subjects s ON lp.subject_id = s.id
      JOIN internship_assignments ia ON u.id = ia.student_id
      WHERE ${whereClause}
    `;
    
    try {
      const [lessonPlans] = await pool.execute(query, [...queryParams, limit, offset]);
      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;
      
      // ประมวลผลไฟล์
      const processedLessonPlans = lessonPlans.map(plan => {
        const files = [];
        if (plan.files) {
          const fileStrings = plan.files.split('||');
          fileStrings.forEach(fileString => {
            if (fileString.trim()) {
              const [id, fileName, filePath, fileSize, fileType, fileCategory] = fileString.split('|');
              files.push({
                id: parseInt(id),
                fileName,
                filePath,
                fileSize: parseInt(fileSize),
                fileType,
                fileCategory
              });
            }
          });
        }
        
        return {
          ...plan,
          files
        };
      });
      
      return {
        lessonPlans: processedLessonPlans,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LessonPlan;
