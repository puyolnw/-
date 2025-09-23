const InternshipAssignment = require('../models/InternshipAssignment');
const SchoolQuota = require('../models/SchoolQuota');
const AcademicYear = require('../models/AcademicYear');
const SchoolTeacher = require('../models/SchoolTeacher');
const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// ดึงรายการการจับคู่ทั้งหมด (สำหรับ Admin)
const getAllAssignments = async (req, res) => {
  try {
    const {
      academicYearId,
      schoolId,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      academicYearId,
      schoolId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await InternshipAssignment.findAll(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get all assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงการจับคู่ตาม ID
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await InternshipAssignment.findById(id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: { assignment }
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin เพิ่มนักศึกษาเข้าโรงเรียน
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      student_id,
      school_id,
      academic_year_id,
      teacher_id,
      start_date,
      end_date,
      notes
    } = req.body;

    const assignmentData = {
      student_id,
      school_id,
      academic_year_id,
      teacher_id,
      start_date,
      end_date,
      notes
    };

    const newAssignmentId = await InternshipAssignment.create(assignmentData);
    const newAssignment = await InternshipAssignment.findById(newAssignmentId);

    res.status(201).json({
      success: true,
      message: 'Student assigned to school successfully',
      data: { assignment: newAssignment }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    
    if (error.message.includes('quota') || error.message.includes('capacity')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// นักศึกษาสมัครเข้าโรงเรียน
const applyToSchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.user.id; // จาก JWT token
    const { school_id, academic_year_id, teacher_id } = req.body;

    console.log('🔵 Backend - applyToSchool called with:', { school_id, academic_year_id, teacher_id, studentId });
    console.log('🔵 Backend - req.user:', req.user);

    // ตรวจสอบว่าเป็นนักศึกษาจริง
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can apply to schools'
      });
    }

    console.log('🔵 Backend - Calling InternshipAssignment.apply with:', { studentId, school_id, academic_year_id, teacher_id });

    const newAssignmentId = await InternshipAssignment.apply(
      studentId,
      school_id,
      academic_year_id,
      teacher_id
    );

    const newAssignment = await InternshipAssignment.findById(newAssignmentId);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { assignment: newAssignment }
    });
  } catch (error) {
    console.error('Apply to school error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('ลงทะเบียน') || 
        error.message.includes('quota') || 
        error.message.includes('capacity') ||
        error.message.includes('ไม่สามารถรับ') ||
        error.message.includes('ปิดรับสมัคร') ||
        error.message.includes('เต็มแล้ว')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// อัพเดทการจับคู่
const updateAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      teacher_id,
      start_date,
      end_date,
      notes,
      status
    } = req.body;

    const assignmentData = {
      teacher_id,
      start_date,
      end_date,
      notes,
      status
    };

    const updated = await InternshipAssignment.update(id, assignmentData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const updatedAssignment = await InternshipAssignment.findById(id);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ลบการจับคู่
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await InternshipAssignment.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// นักศึกษายกเลิกการสมัคร
const cancelApplication = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { academic_year_id } = req.body;

    // ตรวจสอบว่าเป็นนักศึกษาจริง
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can cancel applications'
      });
    }

    const cancelled = await InternshipAssignment.cancel(studentId, academic_year_id);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: 'No active application found'
      });
    }

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงการสมัครของนักศึกษา
const getMyAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { academic_year_id } = req.query;

    // ตรวจสอบว่าเป็นนักศึกษาจริง
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their assignments'
      });
    }

    const assignments = await InternshipAssignment.findByStudent(
      studentId, 
      academic_year_id ? parseInt(academic_year_id) : null
    );

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงโรงเรียนที่เปิดรับสมัคร (สำหรับนักศึกษา)
const getAvailableSchools = async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    // ใช้ view available_schools
    let query = 'SELECT * FROM available_schools';
    let params = [];

    if (academic_year_id) {
      // Join กับ academic_years เพื่อ filter
      query = `
        SELECT avs.* 
        FROM available_schools avs
        JOIN school_quotas sq ON avs.school_id = sq.school_id
        WHERE sq.academic_year_id = ?
      `;
      params = [academic_year_id];
    }

    query += ' ORDER BY school_name';

    const [schools] = await pool.execute(query, params);

    res.json({
      success: true,
      data: { schools }
    });
  } catch (error) {
    console.error('Get available schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงรายการครูพี่เลี้ยงของโรงเรียน
const getSchoolTeachers = async (req, res) => {
  try {
    const { school_id, academic_year_id } = req.query;
    
    console.log('🔵 AssignmentController - getSchoolTeachers called with:', { school_id, academic_year_id });

    const teachers = await SchoolTeacher.findBySchoolAndYear(school_id, academic_year_id);

    // แปลงข้อมูลให้ตรงกับ interface ที่ frontend ต้องการ
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      full_name: teacher.full_name,
      is_primary: teacher.is_primary,
      max_students: teacher.max_students,
      current_students: teacher.current_students,
      available_slots: teacher.max_students - teacher.current_students
    }));

    console.log('🟢 AssignmentController - getSchoolTeachers response:', {
      school_id,
      academic_year_id,
      teachersCount: formattedTeachers.length
    });

    res.json({
      success: true,
      data: { teachers: formattedTeachers }
    });
  } catch (error) {
    console.error('🔴 AssignmentController - getSchoolTeachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงสถานะของนักศึกษา (ลงทะเบียนหรือไม่, มีคำร้องสำเร็จหรือไม่)
const getStudentStatus = async (req, res) => {
  try {
    const userId = req.user.id; // จาก JWT middleware
    
    console.log('🔵 AssignmentController - getStudentStatus called for user:', userId);

    // ตรวจสอบว่าเป็น student หรือไม่
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not a student.'
      });
    }

    // เช็คการลงทะเบียนโรงเรียน
    const [assignmentResult] = await pool.execute(`
      SELECT 
        ia.id as assignment_id,
        ia.school_id,
        ia.status as assignment_status,
        s.school_name,
        ia.enrollment_date
      FROM internship_assignments ia
      JOIN schools s ON ia.school_id = s.school_id
      WHERE ia.student_id = ? AND ia.status = 'active'
      ORDER BY ia.enrollment_date DESC
      LIMIT 1
    `, [userId]);

    const isRegistered = assignmentResult.length > 0;
    let schoolInfo = null;

    if (isRegistered) {
      schoolInfo = {
        assignment_id: assignmentResult[0].assignment_id,
        school_id: assignmentResult[0].school_id,
        school_name: assignmentResult[0].school_name,
        enrollment_date: assignmentResult[0].enrollment_date
      };
    }

    // เช็คคำร้องขอสำเร็จการฝึก (ถ้ามีตาราง completion_requests)
    let hasCompletionRequest = false;
    let completionRequestInfo = null;

    if (isRegistered) {
      try {
        const [completionResult] = await pool.execute(`
          SELECT 
            id,
            status,
            request_date,
            approved_date,
            teacher_rating,
            supervisor_rating
          FROM completion_requests
          WHERE student_id = ? AND assignment_id = ?
          ORDER BY request_date DESC
          LIMIT 1
        `, [userId, schoolInfo.assignment_id]);

        if (completionResult.length > 0) {
          hasCompletionRequest = true;
          completionRequestInfo = {
            id: completionResult[0].id,
            status: completionResult[0].status,
            request_date: completionResult[0].request_date,
            approved_date: completionResult[0].approved_date,
            teacher_rating: completionResult[0].teacher_rating,
            supervisor_rating: completionResult[0].supervisor_rating
          };
        }
      } catch (error) {
        // ถ้าตาราง completion_requests ยังไม่มี ให้ใช้ค่า default
        console.log('completion_requests table not found, using default values');
      }
    }

    const response = {
      success: true,
      data: {
        isRegistered,
        hasCompletionRequest,
        schoolInfo,
        completionRequestInfo
      }
    };

    console.log('🟢 AssignmentController - getStudentStatus response:', {
      userId,
      isRegistered,
      hasCompletionRequest,
      schoolName: schoolInfo?.school_name
    });

    res.json(response);

  } catch (error) {
    console.error('🔴 AssignmentController - getStudentStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงสถิติการจับคู่
const getAssignmentStats = async (req, res) => {
  try {
    const { academicYearId, schoolId } = req.query;

    const filters = {};
    if (academicYearId) filters.academicYearId = academicYearId;
    if (schoolId) filters.schoolId = schoolId;

    const stats = await InternshipAssignment.getStats(filters);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงนักศึกษาที่ยังไม่ได้ไปฝึกงาน
const getAvailableStudents = async (req, res) => {
  try {
    const { academicYearId } = req.query;

    // ดึงนักศึกษาที่ยังไม่ได้ไปฝึกงานในปีการศึกษานี้
    const query = `
      SELECT 
        u.id,
        u.student_code,
        u.first_name,
        u.last_name,
        u.faculty,
        u.major
      FROM users u
      WHERE u.role = 'student'
        AND u.id NOT IN (
          SELECT DISTINCT student_id 
          FROM internship_assignments 
          WHERE academic_year_id = ? 
            AND status IN ('active', 'pending')
        )
      ORDER BY u.student_code
    `;

    const [students] = await pool.execute(query, [academicYearId]);

    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  applyToSchool,
  updateAssignment,
  deleteAssignment,
  cancelApplication,
  getMyAssignments,
  getAvailableSchools,
  getAssignmentStats,
  getAvailableStudents,
  getSchoolTeachers,
  getStudentStatus
};