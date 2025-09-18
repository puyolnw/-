const { pool } = require('../config/database');

class CompletionRequest {
  // สร้างคำร้องขอสำเร็จการฝึกใหม่
  static async create(requestData) {
    const {
      student_id,
      assignment_id,
      total_teaching_hours = 0,
      total_lesson_plans = 0,
      total_teaching_sessions = 0,
      self_evaluation = null,
      achievements = null,
      challenges_faced = null,
      skills_developed = null,
      future_goals = null
    } = requestData;

    const query = `
      INSERT INTO completion_requests (
        student_id, assignment_id, total_teaching_hours, total_lesson_plans,
        total_teaching_sessions, self_evaluation, achievements, challenges_faced,
        skills_developed, future_goals, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const values = [
      student_id, assignment_id, total_teaching_hours, total_lesson_plans,
      total_teaching_sessions, self_evaluation, achievements, challenges_faced,
      skills_developed, future_goals
    ];

    try {
      const [result] = await pool.execute(query, values);
      return { id: result.insertId, ...requestData, status: 'pending' };
    } catch (error) {
      console.error('Error creating completion request:', error);
      throw error;
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกของนักศึกษา
  static async findByStudent(studentId) {
    const query = `
      SELECT 
        cr.*,
        ia.school_id,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.email as teacher_email,
        t.phone as teacher_phone
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN users t ON st.teacher_id = t.id
      WHERE cr.student_id = ?
      ORDER BY cr.request_date DESC
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows;
    } catch (error) {
      console.error('Error fetching completion requests by student:', error);
      throw error;
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกตาม ID
  static async findById(id) {
    const query = `
      SELECT 
        cr.*,
        ia.school_id,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.email as teacher_email,
        t.phone as teacher_phone,
        student.first_name as student_first_name,
        student.last_name as student_last_name,
        student.student_code
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN users t ON st.teacher_id = t.id
      LEFT JOIN users student ON cr.student_id = student.id
      WHERE cr.id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching completion request by ID:', error);
      throw error;
    }
  }

  // ดึงคำร้องขอสำเร็จการฝึกที่รอการอนุมัติ (สำหรับครูพี่เลี้ยง)
  static async findPendingByTeacher(teacherId) {
    const query = `
      SELECT 
        cr.*,
        ia.school_id,
        s.school_name,
        student.first_name as student_first_name,
        student.last_name as student_last_name,
        student.student_code
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN schools s ON ia.school_id = s.school_id
      INNER JOIN school_teachers st ON ia.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
      LEFT JOIN users student ON cr.student_id = student.id
      WHERE st.teacher_id = ? AND cr.status = 'pending'
      ORDER BY cr.request_date ASC
    `;

    try {
      const [rows] = await pool.execute(query, [teacherId]);
      return rows;
    } catch (error) {
      console.error('Error fetching pending completion requests by teacher:', error);
      throw error;
    }
  }

  // อัปเดตสถานะคำร้อง (สำหรับครูพี่เลี้ยง)
  static async updateStatus(id, status, teacherComments = null, teacherRating = null) {
    const query = `
      UPDATE completion_requests 
      SET status = ?, teacher_comments = ?, teacher_rating = ?, teacher_reviewed_at = NOW()
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(query, [status, teacherComments, teacherRating, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating completion request status:', error);
      throw error;
    }
  }

  // อัปเดตความเห็นจากอาจารย์นิเทศ
  static async updateSupervisorReview(id, supervisorComments = null, supervisorRating = null) {
    const query = `
      UPDATE completion_requests 
      SET supervisor_comments = ?, supervisor_rating = ?, supervisor_reviewed_at = NOW()
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(query, [supervisorComments, supervisorRating, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating supervisor review:', error);
      throw error;
    }
  }

  // อนุมัติคำร้อง (สำหรับอาจารย์นิเทศ)
  static async approve(id, approvedBy) {
    const query = `
      UPDATE completion_requests 
      SET status = 'approved', approved_by = ?, approved_date = NOW()
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(query, [approvedBy, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error approving completion request:', error);
      throw error;
    }
  }

  // ตรวจสอบว่าเป็นเจ้าของคำร้องหรือไม่
  static async isOwnedByStudent(requestId, studentId) {
    const query = 'SELECT id FROM completion_requests WHERE id = ? AND student_id = ?';

    try {
      const [rows] = await pool.execute(query, [requestId, studentId]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking completion request ownership:', error);
      throw error;
    }
  }

  // ดึงสถิติการฝึกสอนสำหรับคำร้อง
  static async getTeachingStats(studentId, assignmentId) {
    const query = `
      SELECT 
        COUNT(ts.id) as total_teaching_sessions,
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ts.start_time, ts.end_time)) / 60, 0) as total_teaching_hours,
        COUNT(DISTINCT lp.id) as total_lesson_plans
      FROM teaching_sessions ts
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      WHERE ts.student_id = ?
    `;

    try {
      const [rows] = await pool.execute(query, [studentId]);
      const result = rows[0] || { total_teaching_sessions: 0, total_teaching_hours: 0, total_lesson_plans: 0 };
      
      // แปลง total_teaching_hours เป็น number
      result.total_teaching_hours = parseFloat(result.total_teaching_hours) || 0;
      
      return result;
    } catch (error) {
      console.error('Error fetching teaching stats:', error);
      throw error;
    }
  }

  // ลบคำร้อง (เฉพาะคำร้องที่ยังไม่ได้รับการอนุมัติ)
  static async delete(id, studentId) {
    const query = `
      DELETE FROM completion_requests 
      WHERE id = ? AND student_id = ? AND status IN ('pending', 'revision_required')
    `;

    try {
      const [result] = await pool.execute(query, [id, studentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting completion request:', error);
      throw error;
    }
  }

  // อัปเดตคำร้องขอสำเร็จการฝึกตาม assignment_id
  static async updateByAssignment(studentId, assignmentId, updateData) {
    try {
      const {
        self_evaluation,
        achievements,
        challenges_faced,
        skills_developed,
        future_goals,
        status
      } = updateData;

      const query = `
        UPDATE completion_requests 
        SET self_evaluation = ?, achievements = ?, challenges_faced = ?, 
            skills_developed = ?, future_goals = ?, status = ?, request_date = NOW()
        WHERE student_id = ? AND assignment_id = ?
      `;

      const values = [
        self_evaluation, achievements, challenges_faced,
        skills_developed, future_goals, status,
        studentId, assignmentId
      ];

      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'ไม่พบคำร้องขอสำเร็จการฝึกที่ต้องการอัปเดต'
        };
      }

      // ดึงข้อมูลที่อัปเดตแล้ว
      const updatedRequest = await this.findByStudentAndAssignment(studentId, assignmentId);

      return {
        success: true,
        data: updatedRequest,
        message: 'อัปเดตคำร้องขอสำเร็จการฝึกเรียบร้อยแล้ว'
      };
    } catch (error) {
      console.error('Error updating completion request by assignment:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตคำร้อง'
      };
    }
  }

  // หาคำร้องขอสำเร็จการฝึกตาม student_id และ assignment_id
  static async findByStudentAndAssignment(studentId, assignmentId) {
    try {
      const query = `
        SELECT cr.*, s.school_name, 
               u.first_name as teacher_first_name, u.last_name as teacher_last_name,
               u.email as teacher_email, u.phone as teacher_phone
        FROM completion_requests cr
        LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
        LEFT JOIN schools s ON ia.school_id = s.school_id
        LEFT JOIN school_teachers st ON s.school_id = st.school_id AND ia.academic_year_id = st.academic_year_id
        LEFT JOIN users u ON st.teacher_id = u.id
        WHERE cr.student_id = ? AND cr.assignment_id = ?
        ORDER BY cr.request_date DESC
        LIMIT 1
      `;

      const [rows] = await pool.execute(query, [studentId, assignmentId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding completion request by student and assignment:', error);
      return null;
    }
  }
}

module.exports = CompletionRequest;
