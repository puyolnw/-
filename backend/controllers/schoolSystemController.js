const { pool } = require('../config/database');
const SchoolQuota = require('../models/SchoolQuota');
const SchoolTeacher = require('../models/SchoolTeacher');
const InternshipAssignment = require('../models/InternshipAssignment');
const { validationResult } = require('express-validator');

// ดึงภาพรวมโรงเรียนทั้งหมด
const getSchoolOverview = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    
    // ใช้ view ที่สร้างไว้
    let query = 'SELECT * FROM school_overview';
    let params = [];

    if (academicYearId) {
      query += ' WHERE academic_year_id = ?';
      params = [academicYearId];
    }

    query += ' ORDER BY school_name';

    const [schools] = await pool.execute(query, params);

    res.json({
      success: true,
      data: { schools }
    });
  } catch (error) {
    console.error('Get school overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงรายละเอียดโรงเรียนเฉพาะ
const getSchoolDetails = async (req, res) => {
  try {
    console.log('🔵 Backend - getSchoolDetails called', {
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    const { schoolId } = req.params;
    const { academicYearId } = req.query;

    console.log('🔵 Backend - Processing getSchoolDetails', {
      schoolId,
      academicYearId
    });

    // ข้อมูลโรงเรียนพื้นฐาน
    const [schoolInfo] = await pool.execute(`
      SELECT * FROM school_overview 
      WHERE school_id = ? AND academic_year_id = ?
    `, [schoolId, academicYearId]);

    console.log('🔵 Backend - School info query result', {
      schoolInfoCount: schoolInfo.length,
      schoolInfo: schoolInfo
    });

    if (schoolInfo.length === 0) {
      console.log('🔴 Backend - School not found');
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // รายการนักศึกษา
    console.log('🔵 Backend - Fetching students using InternshipAssignment.findAll');
    const students = await InternshipAssignment.findAll({
      schoolId,
      academicYearId,
      status: 'active'
    });

    console.log('🔵 Backend - Students query result', {
      studentsCount: students.length,
      students: students
    });

    // รายการครูพี่เลี้ยง
    console.log('🔵 Backend - Fetching teachers using SchoolTeacher.findBySchoolAndYear');
    const teachers = await SchoolTeacher.findBySchoolAndYear(schoolId, academicYearId);

    console.log('🔵 Backend - Teachers query result', {
      teachersCount: teachers.length,
      teachers: teachers
    });

    const response = {
      success: true,
      data: {
        school: schoolInfo[0],
        students: students.assignments,
        teachers
      }
    };

    console.log('🟢 Backend - getSchoolDetails response', {
      success: response.success,
      schoolData: !!response.data.school,
      studentsCount: response.data.students?.length,
      students: response.data.students,
      teachersCount: response.data.teachers?.length,
      teachers: response.data.teachers
    });

    res.json(response);
  } catch (error) {
    console.error('🔴 Backend - getSchoolDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงนักศึกษาในโรงเรียน
const getSchoolStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYearId, status = 'active', page = 1, limit = 10 } = req.query;

    const students = await InternshipAssignment.findAll({
      schoolId,
      academicYearId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get school students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงครูพี่เลี้ยงในโรงเรียน
const getSchoolTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYearId } = req.query;

    const teachers = await SchoolTeacher.findBySchoolAndYear(schoolId, academicYearId);

    res.json({
      success: true,
      data: { teachers }
    });
  } catch (error) {
    console.error('Get school teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ตั้งค่าโควตาโรงเรียน
const setSchoolQuota = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schoolId } = req.params;
    const {
      academic_year_id,
      max_students,
      max_teachers,
      is_open
    } = req.body;

    const quotaData = {
      school_id: schoolId,
      academic_year_id,
      max_students,
      max_teachers,
      is_open
    };

    const quotaId = await SchoolQuota.upsert(quotaData);
    const updatedQuota = await SchoolQuota.findBySchoolAndYear(schoolId, academic_year_id);

    res.json({
      success: true,
      message: 'School quota updated successfully',
      data: { quota: updatedQuota }
    });
  } catch (error) {
    console.error('Set school quota error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// อัพเดทสถานะรับสมัคร
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academic_year_id, is_open } = req.body;

    const updated = await SchoolQuota.updateStatus(schoolId, academic_year_id, is_open);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'School quota not found'
      });
    }

    res.json({
      success: true,
      message: `Enrollment ${is_open ? 'opened' : 'closed'} successfully`
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// เพิ่มครูเข้าโรงเรียน
const assignTeacher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schoolId } = req.params;
    const {
      teacher_id,
      academic_year_id,
      is_primary,
      max_students
    } = req.body;

    const teacherData = {
      teacher_id,
      school_id: schoolId,
      academic_year_id,
      is_primary,
      max_students
    };

    const assignmentId = await SchoolTeacher.assign(teacherData);

    res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: { assignmentId }
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    
    if (error.message.includes('already assigned') || error.message.includes('not a teacher')) {
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

// เพิ่มนักศึกษาเข้าโรงเรียน
const assignStudent = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('🔵 Backend - assignStudent called', {
      params: req.params,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔴 Backend - Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schoolId } = req.params;
    const {
      student_id,
      academic_year_id,
      teacher_id,
      start_date,
      end_date,
      notes
    } = req.body;

    // เริ่ม transaction เพื่อป้องกัน race condition
    await connection.beginTransaction();

    console.log('🔵 Backend - Processing assignStudent', {
      schoolId,
      student_id,
      academic_year_id,
      teacher_id,
      start_date,
      end_date,
      notes
    });

    // ตรวจสอบว่าโรงเรียนเปิดรับสมัครหรือไม่ (ใช้ FOR UPDATE เพื่อ lock record)
    const schoolQuery = `
      SELECT is_open, max_students, current_students 
      FROM school_quotas 
      WHERE school_id = ? AND academic_year_id = ?
      FOR UPDATE
    `;
    const [schoolResult] = await connection.execute(schoolQuery, [schoolId, academic_year_id]);
    
    if (schoolResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'School quota not found for this academic year'
      });
    }

    const school = schoolResult[0];
    if (!school.is_open) {
      return res.status(400).json({
        success: false,
        message: 'โรงเรียนนี้ปิดรับสมัครแล้ว'
      });
    }

    if (school.current_students >= school.max_students) {
      return res.status(400).json({
        success: false,
        message: 'โรงเรียนนี้เต็มแล้ว ไม่สามารถรับนักศึกษาเพิ่มได้'
      });
    }

    // ตรวจสอบว่านักศึกษาถูกมอบหมายให้โรงเรียนนี้แล้วหรือไม่ (ใช้ FOR UPDATE เพื่อ lock)
    const checkDuplicateQuery = `
      SELECT id FROM internship_assignments 
      WHERE student_id = ? AND school_id = ? AND academic_year_id = ?
      FOR UPDATE
    `;
    const [duplicateResult] = await connection.execute(checkDuplicateQuery, [student_id, schoolId, academic_year_id]);
    
    console.log('🔵 Backend - Duplicate check result:', {
      student_id,
      schoolId,
      academic_year_id,
      duplicateCount: duplicateResult.length
    });
    
    if (duplicateResult.length > 0) {
      console.log('🔴 Backend - Duplicate found, rolling back transaction');
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'นักศึกษาได้ลงทะเบียนโรงเรียนนี้ไปแล้วในปีการศึกษานี้'
      });
    }

    // ตรวจสอบโควตาอีกครั้งหลังจาก lock
    if (school.current_students >= school.max_students) {
      console.log('🔴 Backend - School capacity exceeded after lock, rolling back');
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'โรงเรียนนี้เต็มแล้ว ไม่สามารถรับนักศึกษาเพิ่มได้'
      });
    }

    // เพิ่มนักศึกษาเข้า internship_assignments
    const insertQuery = `
      INSERT INTO internship_assignments 
      (student_id, school_id, academic_year_id, teacher_id, start_date, end_date, notes, status, enrollment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `;
    
    const [result] = await connection.execute(insertQuery, [
      student_id,
      schoolId,
      academic_year_id,
      teacher_id,
      start_date,
      end_date,
      notes
    ]);

    console.log('🔵 Backend - Student inserted successfully', {
      assignmentId: result.insertId,
      affectedRows: result.affectedRows
    });

    // อัพเดทจำนวนนักศึกษาปัจจุบัน
    const updateQuery = `
      UPDATE school_quotas 
      SET current_students = current_students + 1 
      WHERE school_id = ? AND academic_year_id = ?
    `;
    const [quotaResult] = await connection.execute(updateQuery, [schoolId, academic_year_id]);

    console.log('🔵 Backend - School quota updated', {
      schoolId,
      academic_year_id,
      affectedRows: quotaResult.affectedRows
    });

    // อัพเดทจำนวนนักศึกษาของครูพี่เลี้ยง
    if (teacher_id) {
      const teacherUpdateQuery = `
        UPDATE school_teachers 
        SET current_students = current_students + 1 
        WHERE teacher_id = ? AND school_id = ? AND academic_year_id = ?
      `;
      const [teacherResult] = await connection.execute(teacherUpdateQuery, [teacher_id, schoolId, academic_year_id]);

      console.log('🔵 Backend - Teacher quota updated', {
        teacher_id,
        schoolId,
        academic_year_id,
        affectedRows: teacherResult.affectedRows
      });
    }

    // Commit transaction
    await connection.commit();
    console.log('🟢 Backend - Transaction committed successfully');

    const response = {
      success: true,
      message: 'Student assigned successfully',
      data: { assignmentId: result.insertId }
    };

    console.log('🟢 Backend - assignStudent completed successfully', response);

    res.json(response);
  } catch (error) {
    console.error('🔴 Backend - assignStudent error:', error);
    
    // Rollback transaction on error
    try {
      await connection.rollback();
      console.log('🔴 Backend - Transaction rolled back');
    } catch (rollbackError) {
      console.error('🔴 Backend - Rollback error:', rollbackError);
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('🔴 Backend - Duplicate entry error detected');
      return res.status(400).json({
        success: false,
        message: 'Student is already assigned to this school'
      });
    }

    console.log('🔴 Backend - Internal server error, returning 500');
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
      console.log('🔵 Backend - Database connection released');
    }
  }
};

// ลบครูออกจากโรงเรียน
const removeTeacher = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // ลบครูพี่เลี้ยงจาก school_teachers table
    const query = 'DELETE FROM school_teachers WHERE id = ?';
    const [result] = await pool.execute(query, [assignmentId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher removed successfully'
    });
  } catch (error) {
    console.error('Remove teacher error:', error);
    
    if (error.message.includes('active students')) {
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

// ตั้งครูเป็นครูหลัก
const setPrimaryTeacher = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const updated = await SchoolTeacher.setPrimary(assignmentId);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Teacher assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Primary teacher set successfully'
    });
  } catch (error) {
    console.error('Set primary teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ลบนักศึกษาออกจากโรงเรียน
const removeStudent = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // ดึงข้อมูลการมอบหมายงานก่อนลบ
    const getAssignmentQuery = `
      SELECT ia.*, st.teacher_id 
      FROM internship_assignments ia
      LEFT JOIN school_teachers st ON ia.teacher_id = st.teacher_id 
        AND ia.school_id = st.school_id 
        AND ia.academic_year_id = st.academic_year_id
      WHERE ia.id = ?
    `;
    const [assignmentResult] = await pool.execute(getAssignmentQuery, [assignmentId]);
    
    if (assignmentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student assignment not found'
      });
    }

    const assignment = assignmentResult[0];

    // ลบนักศึกษาจาก internship_assignments
    const deleteQuery = 'DELETE FROM internship_assignments WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [assignmentId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student assignment not found'
      });
    }

    // อัพเดทจำนวนนักศึกษาปัจจุบันใน school_quotas
    const updateSchoolQuery = `
      UPDATE school_quotas 
      SET current_students = current_students - 1 
      WHERE school_id = ? AND academic_year_id = ?
    `;
    await pool.execute(updateSchoolQuery, [assignment.school_id, assignment.academic_year_id]);

    // อัพเดทจำนวนนักศึกษาของครูพี่เลี้ยง
    if (assignment.teacher_id) {
      const updateTeacherQuery = `
        UPDATE school_teachers 
        SET current_students = current_students - 1 
        WHERE teacher_id = ? AND school_id = ? AND academic_year_id = ?
      `;
      await pool.execute(updateTeacherQuery, [assignment.teacher_id, assignment.school_id, assignment.academic_year_id]);
    }

    res.json({
      success: true,
      message: 'Student removed successfully'
    });
  } catch (error) {
    console.error('Remove student error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงครูที่ยังไม่ได้จับคู่
const getAvailableTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYearId } = req.query;

    // ดึงครูที่ยังไม่ได้ไปฝึกงานในโรงเรียนนี้
    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role
      FROM users u
      WHERE u.role = 'teacher'
        AND (u.school_id IS NULL OR u.school_id != ?)
        AND u.id NOT IN (
          SELECT DISTINCT teacher_id
          FROM school_teachers
          WHERE school_id = ?
            AND academic_year_id = ?
            AND teacher_id IS NOT NULL
        )
      ORDER BY u.first_name, u.last_name
    `;

    const [teachers] = await pool.execute(query, [schoolId, schoolId, academicYearId]);

    res.json({
      success: true,
      data: { teachers }
    });
  } catch (error) {
    console.error('Get available teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// อัพเดท school schedule
const updateSchoolSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schoolId } = req.params;
    const {
      academic_year_id,
      internship_start_date,
      internship_end_date,
      preparation_start_date,
      orientation_date,
      evaluation_date,
      notes
    } = req.body;

    const userId = req.user.id; // จาก JWT token

    // เรียกใช้ stored procedure
    await pool.execute(
      'CALL UpdateSchoolSchedule(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        schoolId,
        academic_year_id,
        internship_start_date,
        internship_end_date,
        preparation_start_date,
        orientation_date,
        evaluation_date,
        notes,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'School schedule updated successfully'
    });
  } catch (error) {
    console.error('Update school schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ดึงข้อมูล school schedule
const getSchoolSchedule = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYearId } = req.query;

    const [schedule] = await pool.execute(
      'SELECT * FROM school_schedule_overview WHERE school_id = ? AND academic_year_id = ?',
      [schoolId, academicYearId]
    );

    res.json({
      success: true,
      data: { schedule: schedule[0] || null }
    });
  } catch (error) {
    console.error('Get school schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getSchoolOverview,
  getSchoolDetails,
  getSchoolStudents,
  getSchoolTeachers,
  setSchoolQuota,
  updateEnrollmentStatus,
  assignStudent,
  assignTeacher,
  removeStudent,
  removeTeacher,
  setPrimaryTeacher,
  getAvailableTeachers,
  updateSchoolSchedule,
  getSchoolSchedule
};
