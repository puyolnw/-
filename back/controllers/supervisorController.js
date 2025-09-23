const { db } = require('../config/database');
const { validationResult } = require('express-validator');

// ดึงข้อมูลโรงเรียนทั้งหมดในระบบ (สำหรับ supervisor)
const getAllSchools = async (req, res) => {
  try {
    const { academic_year_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.id,
        s.school_name as name,
        s.address,
        s.phone,
        s.created_at,
        COUNT(DISTINCT st.id) as teacher_count,
        COUNT(DISTINCT ia.id) as student_count,
        COUNT(DISTINCT CASE WHEN ia.status = 'active' THEN ia.id END) as active_students,
        COUNT(DISTINCT CASE WHEN ia.status = 'completed' THEN ia.id END) as completed_students
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
    `;

    const conditions = [];
    const params = [];

    if (academic_year_id) {
      conditions.push('ia.academic_year_id = ?');
      params.push(academic_year_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY s.id
      ORDER BY s.school_name
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const [schools] = await db.query(query, params);

    // นับจำนวนทั้งหมด
    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM schools s
      LEFT JOIN internship_assignments ia ON s.id = ia.school_id
    `;
    
    const countConditions = [];
    const countParams = [];
    
    if (academic_year_id) {
      countConditions.push('ia.academic_year_id = ?');
      countParams.push(academic_year_id);
    }
    
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน'
    });
  }
};

// ดึงรายละเอียดโรงเรียนพร้อมข้อมูลครูและนักศึกษา
const getSchoolDetail = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academic_year_id } = req.query;

    // ดึงข้อมูลโรงเรียน
    const [school] = await db.query(
      'SELECT id, school_id, school_name as name, address, phone, created_at, updated_at FROM schools WHERE id = ?',
      [parseInt(schoolId)]
    );

    if (!school || school.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียน'
      });
    }

    const schoolData = school[0];

    // ดึงข้อมูลครูพี่เลี้ยง
    const [teachers] = await db.query(`
      SELECT 
        st.id,
        st.teacher_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        st.created_at as assigned_at,
        COUNT(DISTINCT ia.id) as student_count
      FROM school_teachers st
      JOIN users u ON st.teacher_id = u.id
      LEFT JOIN internship_assignments ia ON st.teacher_id = ia.teacher_id AND st.school_id = ia.school_id
      WHERE st.school_id = ?
      ${academic_year_id ? 'AND ia.academic_year_id = ?' : ''}
      GROUP BY st.id, st.teacher_id, u.first_name, u.last_name, u.email, u.phone, st.created_at
    `, academic_year_id ? [schoolData.school_id, academic_year_id] : [schoolData.school_id]);

    // ดึงข้อมูลนักศึกษา
    const [students] = await db.query(`
      SELECT 
        ia.id as assignment_id,
        ia.student_id,
        u.first_name,
        u.last_name,
        u.student_code,
        u.email,
        u.phone,
        u.faculty,
        u.major,
        ia.enrollment_date,
        ia.status,
        ia.teacher_id,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        COUNT(DISTINCT ts.id) as teaching_sessions_count,
        COUNT(DISTINCT lp.id) as lesson_plans_count
      FROM internship_assignments ia
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN teaching_sessions ts ON ia.student_id = ts.student_id
      LEFT JOIN lesson_plans lp ON ia.student_id = lp.student_id
      WHERE ia.school_id = ?
      ${academic_year_id ? 'AND ia.academic_year_id = ?' : ''}
      GROUP BY ia.id, ia.student_id, u.first_name, u.last_name, u.student_code, u.email, u.phone, u.faculty, u.major, ia.enrollment_date, ia.status, ia.teacher_id, t.first_name, t.last_name
      ORDER BY ia.enrollment_date DESC
    `, academic_year_id ? [schoolData.school_id, academic_year_id] : [schoolData.school_id]);

    // ดึงข้อมูลปีการศึกษา
    const [academicYears] = await db.query(`
      SELECT DISTINCT 
        ay.id,
        ay.year,
        COUNT(DISTINCT ia.id) as student_count
      FROM academic_years ay
      LEFT JOIN internship_assignments ia ON ay.id = ia.academic_year_id AND ia.school_id = ?
      GROUP BY ay.id, ay.year
      ORDER BY ay.year DESC
    `, [schoolData.school_id]);

    res.json({
      success: true,
      data: {
        school: schoolData, // schoolData is already the first element
        teachers,
        students,
        academicYears
      }
    });
  } catch (error) {
    console.error('Error fetching school detail:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน'
    });
  }
};

// เพิ่มครูพี่เลี้ยงให้โรงเรียน
const addTeacherToSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { teacher_id } = req.body;

    // ตรวจสอบว่าโรงเรียนมีอยู่จริงและดึง school_id
    const [school] = await db.query('SELECT id, school_id FROM schools WHERE id = ?', [parseInt(schoolId)]);
    if (!school || school.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียน'
      });
    }
    const school_id = school[0].school_id;

    // ตรวจสอบว่าครูมีอยู่จริงและเป็น role teacher
    const [teacher] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND role = "teacher"',
      [teacher_id]
    );
    if (!teacher || teacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลครูพี่เลี้ยง'
      });
    }

    // ตรวจสอบว่าครูนี้ยังไม่ได้ถูกมอบหมายให้โรงเรียนอื่น
    const [existingAssignment] = await db.query(
      'SELECT id FROM school_teachers WHERE teacher_id = ?',
      [teacher_id]
    );
    if (existingAssignment && existingAssignment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ครูพี่เลี้ยงนี้ถูกมอบหมายให้โรงเรียนอื่นแล้ว'
      });
    }

    // เพิ่มครูพี่เลี้ยงให้โรงเรียน
    await db.query(
      'INSERT INTO school_teachers (school_id, teacher_id, academic_year_id) VALUES (?, ?, ?)',
      [school_id, teacher_id, 3] // ใช้ academic_year_id = 3 (ปี 2568)
    );

    res.json({
      success: true,
      message: 'เพิ่มครูพี่เลี้ยงให้โรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error adding teacher to school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มครูพี่เลี้ยง'
    });
  }
};

// ลบครูพี่เลี้ยงออกจากโรงเรียน
const removeTeacherFromSchool = async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;

    // ตรวจสอบว่ามีการมอบหมายอยู่จริง
    const [assignment] = await db.query(
      'SELECT id FROM school_teachers WHERE school_id = ? AND teacher_id = ?',
      [schoolId, teacherId]
    );
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการมอบหมายครูพี่เลี้ยง'
      });
    }

    // ตรวจสอบว่าครูพี่เลี้ยงนี้ยังมีนักศึกษาที่ดูแลอยู่หรือไม่
    const [activeStudents] = await db.query(
      'SELECT COUNT(*) as count FROM internship_assignments WHERE teacher_id = ? AND status = "active"',
      [teacherId]
    );
    if (activeStudents.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบครูพี่เลี้ยงได้ เนื่องจากยังมีนักศึกษาที่กำลังฝึกอยู่'
      });
    }

    // ลบการมอบหมาย
    await db.query(
      'DELETE FROM school_teachers WHERE school_id = ? AND teacher_id = ?',
      [schoolId, teacherId]
    );

    res.json({
      success: true,
      message: 'ลบครูพี่เลี้ยงออกจากโรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error removing teacher from school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบครูพี่เลี้ยง'
    });
  }
};

// เพิ่มนักศึกษาให้โรงเรียน
const addStudentToSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { student_id, teacher_id, academic_year_id } = req.body;

    // ดึง school_id จาก schoolId
    const [school] = await db.query(
      'SELECT school_id FROM schools WHERE id = ?',
      [parseInt(schoolId)]
    );
    if (!school || school.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียน'
      });
    }
    const school_id = school[0].school_id;

    // ตรวจสอบว่านักศึกษามีอยู่จริงและเป็น role student
    const [student] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND role = "student"',
      [student_id]
    );
    if (!student || student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ตรวจสอบว่าครูพี่เลี้ยงมีอยู่จริงและเป็นของโรงเรียนนี้
    const [teacher] = await db.query(
      'SELECT st.id FROM school_teachers st WHERE st.teacher_id = ? AND st.school_id = ?',
      [teacher_id, school_id]
    );
    if (!teacher || teacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลครูพี่เลี้ยงในโรงเรียนนี้'
      });
    }

    // ตรวจสอบว่านักศึกษานี้ยังไม่ได้ลงทะเบียนฝึกงาน
    const [existingAssignment] = await db.query(
      'SELECT id FROM internship_assignments WHERE student_id = ?',
      [student_id]
    );
    if (existingAssignment && existingAssignment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'นักศึกษานี้ได้ลงทะเบียนฝึกงานแล้ว'
      });
    }

    // เพิ่มนักศึกษาให้โรงเรียน
    await db.query(
      'INSERT INTO internship_assignments (student_id, school_id, teacher_id, academic_year_id, enrollment_date, status) VALUES (?, ?, ?, ?, NOW(), "active")',
      [student_id, school_id, teacher_id, academic_year_id]
    );

    res.json({
      success: true,
      message: 'เพิ่มนักศึกษาให้โรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error adding student to school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มนักศึกษา'
    });
  }
};

// ลบนักศึกษาออกจากโรงเรียน
const removeStudentFromSchool = async (req, res) => {
  try {
    const { schoolId, studentId } = req.params;

    // ตรวจสอบว่ามีการมอบหมายอยู่จริง
    const [assignment] = await db.query(
      'SELECT id, status FROM internship_assignments WHERE school_id = ? AND student_id = ?',
      [schoolId, studentId]
    );
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการมอบหมายนักศึกษา'
      });
    }

    // ตรวจสอบว่านักศึกษานี้ยังมีข้อมูลการสอนหรือไม่
    const [teachingData] = await db.query(
      'SELECT COUNT(*) as count FROM teaching_sessions WHERE student_id = ?',
      [studentId]
    );
    if (teachingData.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบนักศึกษาได้ เนื่องจากมีข้อมูลการสอนอยู่'
      });
    }

    // ลบการมอบหมาย
    await db.query(
      'DELETE FROM internship_assignments WHERE school_id = ? AND student_id = ?',
      [schoolId, studentId]
    );

    res.json({
      success: true,
      message: 'ลบนักศึกษาออกจากโรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error removing student from school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบนักศึกษา'
    });
  }
};

// ดึงรายชื่อครูพี่เลี้ยงที่ยังไม่ได้มอบหมาย
const getAvailableTeachers = async (req, res) => {
  try {
    const [teachers] = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM users u
      LEFT JOIN school_teachers st ON u.id = st.teacher_id
      WHERE u.role = 'teacher' AND st.id IS NULL
      ORDER BY u.first_name, u.last_name
    `);

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Error fetching available teachers:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลครูพี่เลี้ยง'
    });
  }
};

// ดึงรายชื่อนักศึกษาที่ยังไม่ได้ลงทะเบียนฝึกงาน
const getAvailableStudents = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.student_code,
        u.email,
        u.phone,
        u.faculty,
        u.major
      FROM users u
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      WHERE u.role = 'student' AND ia.id IS NULL
      ORDER BY u.first_name, u.last_name
    `);

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

// จัดการผู้ใช้งาน (CRUD)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.student_code,
        u.faculty,
        u.major,
        u.created_at,
        u.updated_at
      FROM users u
    `;

    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      ORDER BY u.role, u.first_name, u.last_name
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const users = await db.query(query, params);

    // นับจำนวนทั้งหมด
    let countQuery = 'SELECT COUNT(*) as total FROM users u';
    const countParams = [];
    
    if (role) {
      countQuery += ' WHERE u.role = ?';
      countParams.push(role);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role,
      student_code,
      faculty,
      major
    } = req.body;

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    // ตรวจสอบว่ารหัสนักศึกษาซ้ำหรือไม่ (ถ้าเป็นนักศึกษา)
    if (role === 'student' && student_code) {
      const [existingStudent] = await db.query(
        'SELECT id FROM users WHERE student_code = ?',
        [student_code]
      );
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว'
        });
      }
    }

    // สร้างผู้ใช้ใหม่
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, role, student_code, faculty, major, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [first_name, last_name, email, hashedPassword, phone, role, student_code, faculty, major]
    );

    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้งานเรียบร้อยแล้ว',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      student_code,
      faculty,
      major
    } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้งาน'
      });
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    // ตรวจสอบว่ารหัสนักศึกษาซ้ำหรือไม่ (ถ้าเป็นนักศึกษา)
    if (role === 'student' && student_code) {
      const [existingStudent] = await db.query(
        'SELECT id FROM users WHERE student_code = ? AND id != ?',
        [student_code, userId]
      );
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว'
        });
      }
    }

    // อัปเดตข้อมูลผู้ใช้
    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, student_code = ?, faculty = ?, major = ?, updated_at = NOW() WHERE id = ?',
      [first_name, last_name, email, phone, role, student_code, faculty, major, userId]
    );

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const [user] = await db.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้งาน'
      });
    }

    // ตรวจสอบว่าผู้ใช้มีการใช้งานในระบบหรือไม่
    if (user.role === 'student') {
      const [assignments] = await db.query(
        'SELECT COUNT(*) as count FROM internship_assignments WHERE student_id = ?',
        [userId]
      );
      if (assignments.count > 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบผู้ใช้งานได้ เนื่องจากมีการใช้งานในระบบ'
        });
      }
    } else if (user.role === 'teacher') {
      const [assignments] = await db.query(
        'SELECT COUNT(*) as count FROM school_teachers WHERE teacher_id = ?',
        [userId]
      );
      if (assignments.count > 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบผู้ใช้งานได้ เนื่องจากมีการใช้งานในระบบ'
        });
      }
    }

    // ลบผู้ใช้
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'ลบผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน'
    });
  }
};

// จัดการโรงเรียน (CRUD)
const createSchool = async (req, res) => {
  try {
    const { name, address, phone, email, website } = req.body;

    // ตรวจสอบว่าชื่อโรงเรียนซ้ำหรือไม่
    const [existingSchool] = await db.query(
      'SELECT id FROM schools WHERE name = ?',
      [name]
    );
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อโรงเรียนนี้มีอยู่แล้ว'
      });
    }

    // สร้างโรงเรียนใหม่
    const result = await db.query(
      'INSERT INTO schools (name, address, phone, email, website, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, address, phone, email, website]
    );

    res.status(201).json({
      success: true,
      message: 'สร้างโรงเรียนเรียบร้อยแล้ว',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างโรงเรียน'
    });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, address, phone, email, website } = req.body;

    // ตรวจสอบว่าโรงเรียนมีอยู่จริง
    const [school] = await db.query('SELECT id FROM schools WHERE id = ?', [schoolId]);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียน'
      });
    }

    // ตรวจสอบว่าชื่อโรงเรียนซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const [existingSchool] = await db.query(
      'SELECT id FROM schools WHERE name = ? AND id != ?',
      [name, schoolId]
    );
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อโรงเรียนนี้มีอยู่แล้ว'
      });
    }

    // อัปเดตข้อมูลโรงเรียน
    await db.query(
      'UPDATE schools SET name = ?, address = ?, phone = ?, email = ?, website = ?, updated_at = NOW() WHERE id = ?',
      [name, address, phone, email, website, schoolId]
    );

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลโรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลโรงเรียน'
    });
  }
};

const deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // ตรวจสอบว่าโรงเรียนมีอยู่จริง
    const [school] = await db.query('SELECT id FROM schools WHERE id = ?', [schoolId]);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียน'
      });
    }

    // ตรวจสอบว่าโรงเรียนมีการใช้งานในระบบหรือไม่
    const [assignments] = await db.query(
      'SELECT COUNT(*) as count FROM internship_assignments WHERE school_id = ?',
      [schoolId]
    );
    if (assignments.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบโรงเรียนได้ เนื่องจากมีการใช้งานในระบบ'
      });
    }

    // ลบโรงเรียน
    await db.query('DELETE FROM schools WHERE id = ?', [schoolId]);

    res.json({
      success: true,
      message: 'ลบโรงเรียนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบโรงเรียน'
    });
  }
};

// ดึงรายละเอียดนักศึกษา
const getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('🔍 getStudentDetail called with studentId:', studentId);

    // ดึงข้อมูลนักศึกษา
    const studentQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.student_code,
        u.email,
        u.phone,
        u.faculty,
        u.major,
        u.profile_image
      FROM users u
      WHERE u.id = ? AND u.role = 'student'
    `;
    
    const studentResult = await db.query(studentQuery, [parseInt(studentId)]);
    const student = studentResult[0];
    
    if (!student || student.length === 0) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    const studentData = student[0];
    console.log('✅ Student found:', studentData);

    // ดึงข้อมูลการฝึกงาน
    const assignmentQuery = `
      SELECT 
        ia.id,
        ia.enrollment_date,
        ia.status,
        ia.academic_year_id,
        ia.teacher_id,
        ia.school_id
      FROM internship_assignments ia
      WHERE ia.student_id = ?
      ORDER BY ia.enrollment_date DESC
      LIMIT 1
    `;
    
    const assignmentResult = await db.query(assignmentQuery, [parseInt(studentId)]);
    const assignment = assignmentResult[0];
    
    if (!assignment || assignment.length === 0) {
      console.log('❌ Assignment not found');
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการฝึกงานของนักศึกษา'
      });
    }

    const assignmentData = assignment[0];
    console.log('✅ Assignment found:', assignmentData);

    // ดึงข้อมูลครูพี่เลี้ยง
    const teacherQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM users u
      WHERE u.id = ?
    `;
    
    const teacherResult = await db.query(teacherQuery, [assignmentData.teacher_id]);
    const teacher = teacherResult[0];

    // ดึงข้อมูลโรงเรียน
    const schoolQuery = `
      SELECT 
        s.id,
        s.school_name as name,
        s.address,
        s.phone
      FROM schools s
      WHERE s.school_id = ?
    `;
    
    const schoolResult = await db.query(schoolQuery, [assignmentData.school_id]);
    const school = schoolResult[0];

    // ดึงข้อมูลปีการศึกษา
    const academicYearQuery = `
      SELECT 
        ay.id,
        ay.year,
        ay.semester
      FROM academic_years ay
      WHERE ay.id = ?
    `;
    
    const academicYearResult = await db.query(academicYearQuery, [assignmentData.academic_year_id]);
    const academicYear = academicYearResult[0];

    // ดึงข้อมูลแผนการสอน
    const lessonPlansQuery = `
      SELECT 
        lp.id,
        lp.lesson_plan_name,
        lp.subject_id,
        lp.description,
        lp.objectives,
        lp.teaching_methods,
        lp.assessment_methods,
        lp.duration_minutes,
        lp.target_grade,
        lp.created_at,
        lp.status
      FROM lesson_plans lp
      WHERE lp.student_id = ?
      ORDER BY lp.created_at DESC
    `;
    
    const lessonPlansResult = await db.query(lessonPlansQuery, [parseInt(studentId)]);
    const lessonPlans = lessonPlansResult[0];

    // ดึงข้อมูลบันทึกการสอน
    const teachingSessionsQuery = `
      SELECT 
        ts.id,
        ts.lesson_plan_id,
        ts.subject_id,
        ts.teaching_date,
        ts.start_time,
        ts.end_time,
        ts.class_level,
        ts.class_room,
        ts.student_count,
        ts.lesson_topic,
        ts.lesson_summary,
        ts.learning_outcomes,
        ts.teaching_methods_used,
        ts.materials_used,
        ts.student_engagement,
        ts.problems_encountered,
        ts.problem_solutions,
        ts.lessons_learned,
        ts.reflection,
        ts.improvement_notes,
        ts.teacher_feedback,
        ts.self_rating,
        ts.status,
        ts.created_at
      FROM teaching_sessions ts
      WHERE ts.student_id = ?
      ORDER BY ts.teaching_date DESC, ts.start_time DESC
    `;
    
    const teachingSessionsResult = await db.query(teachingSessionsQuery, [parseInt(studentId)]);
    const teachingSessions = teachingSessionsResult[0];

    console.log('✅ All queries completed successfully');

    res.json({
      success: true,
      data: {
        student: studentData,
        teacher: (teacher && teacher.length > 0) ? teacher[0] : null,
        school: (school && school.length > 0) ? school[0] : null,
        assignment: assignmentData,
        lessonPlans: lessonPlans || [],
        teachingSessions: teachingSessions || [],
        academicYear: (academicYear && academicYear.length > 0) ? academicYear[0] : null
      }
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

// ดึงข้อมูลแดชบอร์ดสำหรับอาจารย์นิเทศ
const getDashboard = async (req, res) => {
  try {
    console.log('🔍 getDashboard called');
    
    // สถิติภาพรวม
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT s.school_id) as total_schools,
        COUNT(DISTINCT st.teacher_id) as total_teachers,
        COUNT(DISTINCT ia.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN ia.status = 'active' THEN ia.student_id END) as active_students,
        COUNT(DISTINCT CASE WHEN ia.status = 'completed' THEN ia.student_id END) as completed_students
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
    `;
    
    const [overviewResult] = await db.query(overviewQuery);
    const overviewStats = overviewResult[0];

    // สถิติการประเมิน
    const evaluationsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        SUM(CASE WHEN cr.status = 'supervisor_approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN cr.status = 'supervisor_rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) as pending_count
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
    `;
    
    const [evaluationsResult] = await db.query(evaluationsQuery);
    const evaluationsStats = evaluationsResult[0];

    // การประเมินที่รอดำเนินการ
    const pendingEvaluationsQuery = `
      SELECT 
        cr.id,
        cr.created_at,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        cr.total_teaching_hours,
        cr.total_lesson_plans,
        cr.total_teaching_sessions
      FROM completion_requests cr
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      WHERE cr.status = 'under_review'
      ORDER BY cr.created_at DESC
      LIMIT 5
    `;
    
    const [pendingEvaluations] = await db.query(pendingEvaluationsQuery);

    // การประเมินล่าสุด
    const recentEvaluationsQuery = `
      SELECT 
        cr.id,
        cr.created_at,
        cr.supervisor_average_score,
        cr.status,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name
      FROM completion_requests cr
      JOIN internship_assignments ia ON cr.assignment_id = ia.id
      JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      WHERE cr.status IN ('supervisor_approved', 'supervisor_rejected')
      ORDER BY cr.created_at DESC
      LIMIT 5
    `;
    
    const [recentEvaluations] = await db.query(recentEvaluationsQuery);

    // นักศึกษาที่ต้องติดตาม
    const studentsToFollowQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        ia.enrollment_date,
        ia.status,
        COUNT(DISTINCT ts.id) as teaching_sessions_count,
        COUNT(DISTINCT lp.id) as lesson_plans_count,
        MAX(ts.teaching_date) as last_teaching_date
      FROM users u
      JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN teaching_sessions ts ON u.id = ts.student_id
      LEFT JOIN lesson_plans lp ON u.id = lp.student_id
      WHERE u.role = 'student' AND ia.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.student_code, s.school_name, t.first_name, t.last_name, ia.enrollment_date, ia.status
      ORDER BY ia.enrollment_date DESC
      LIMIT 5
    `;
    
    const [studentsToFollow] = await db.query(studentsToFollowQuery);

    // โรงเรียนที่มีกิจกรรมล่าสุด
    const recentSchoolsQuery = `
      SELECT 
        s.school_name,
        s.address,
        COUNT(DISTINCT ia.student_id) as student_count,
        COUNT(DISTINCT st.teacher_id) as teacher_count,
        MAX(ts.teaching_date) as last_activity_date
      FROM schools s
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN teaching_sessions ts ON ia.student_id = ts.student_id
      GROUP BY s.school_id, s.school_name, s.address
      HAVING student_count > 0
      ORDER BY last_activity_date DESC
      LIMIT 5
    `;
    
    const [recentSchools] = await db.query(recentSchoolsQuery);

    res.json({
      success: true,
      data: {
        overview: {
          total_schools: parseInt(overviewStats.total_schools) || 0,
          total_teachers: parseInt(overviewStats.total_teachers) || 0,
          total_students: parseInt(overviewStats.total_students) || 0,
          active_students: parseInt(overviewStats.active_students) || 0,
          completed_students: parseInt(overviewStats.completed_students) || 0
        },
        evaluations: {
          total: parseInt(evaluationsStats.total_evaluations) || 0,
          approved: parseInt(evaluationsStats.approved_count) || 0,
          rejected: parseInt(evaluationsStats.rejected_count) || 0,
          pending: parseInt(evaluationsStats.pending_count) || 0
        },
        pending_evaluations: pendingEvaluations,
        recent_evaluations: recentEvaluations,
        students_to_follow: studentsToFollow,
        recent_schools: recentSchools
      }
    });
  } catch (error) {
    console.error('💥 Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้',
      error: error.message
    });
  }
};

// ดึงข้อมูลรายงานสำหรับอาจารย์นิเทศ
const getReports = async (req, res) => {
  try {
    console.log('🔍 getReports called with query:', req.query);
    const { academic_year_id } = req.query;
    
    // สถิติโรงเรียน
    const schoolsQuery = `
      SELECT 
        COUNT(DISTINCT s.school_id) as total_schools,
        COUNT(DISTINCT st.teacher_id) as total_teachers,
        COUNT(DISTINCT ia.student_id) as total_students
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      ${academic_year_id ? 'WHERE ia.academic_year_id = ?' : ''}
    `;
    
    const schoolsParams = academic_year_id ? [academic_year_id] : [];
    console.log('📊 Executing schools query with params:', schoolsParams);
    const [schoolsResult] = await db.query(schoolsQuery, schoolsParams);
    console.log('📊 Schools result:', schoolsResult);
    const schoolsStats = schoolsResult[0];

    // สถิติการประเมิน
    const evaluationsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        SUM(CASE WHEN cr.status = 'supervisor_approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN cr.status = 'supervisor_rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) as pending_count,
        AVG(CASE WHEN cr.supervisor_average_score IS NOT NULL THEN cr.supervisor_average_score END) as avg_score
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${academic_year_id ? 'WHERE ia.academic_year_id = ?' : ''}
    `;
    
    const [evaluationsResult] = await db.query(evaluationsQuery, schoolsParams);
    const evaluationsStats = evaluationsResult[0];

    // สถิติการสอน
    const teachingQuery = `
      SELECT 
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT lp.id) as total_lesson_plans,
        SUM(ts.student_count) as total_students_taught,
        AVG(ts.student_count) as avg_class_size
      FROM teaching_sessions ts
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      LEFT JOIN internship_assignments ia ON ts.student_id = ia.student_id
      ${academic_year_id ? 'WHERE ia.academic_year_id = ?' : ''}
    `;
    
    const [teachingResult] = await db.query(teachingQuery, schoolsParams);
    const teachingStats = teachingResult[0];

    // รายละเอียดโรงเรียน
    const schoolsDetailQuery = `
      SELECT 
        s.school_name,
        s.address,
        s.phone,
        COUNT(DISTINCT st.teacher_id) as teacher_count,
        COUNT(DISTINCT ia.student_id) as student_count,
        COUNT(DISTINCT cr.id) as evaluation_count
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN completion_requests cr ON ia.id = cr.assignment_id
      ${academic_year_id ? 'WHERE ia.academic_year_id = ?' : ''}
      GROUP BY s.school_id, s.school_name, s.address, s.phone
      ORDER BY s.school_name
    `;
    
    const [schoolsDetail] = await db.query(schoolsDetailQuery, schoolsParams);

    // รายละเอียดนักศึกษา
    const studentsDetailQuery = `
      SELECT 
        u.first_name,
        u.last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        COUNT(DISTINCT lp.id) as lesson_plans_count,
        COUNT(DISTINCT ts.id) as teaching_sessions_count,
        SUM(ts.student_count) as total_students_taught,
        cr.status as evaluation_status,
        cr.supervisor_average_score
      FROM users u
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN lesson_plans lp ON u.id = lp.student_id
      LEFT JOIN teaching_sessions ts ON u.id = ts.student_id
      LEFT JOIN completion_requests cr ON ia.id = cr.assignment_id
      WHERE u.role = 'student'
      ${academic_year_id ? 'AND ia.academic_year_id = ?' : ''}
      GROUP BY u.id, u.first_name, u.last_name, u.student_code, u.faculty, u.major, 
               s.school_name, t.first_name, t.last_name, cr.status, cr.supervisor_average_score
      ORDER BY u.first_name, u.last_name
    `;
    
    const [studentsDetail] = await db.query(studentsDetailQuery, schoolsParams);

    // แปลงค่าให้เป็นตัวเลข
    const processedEvaluationsStats = {
      ...evaluationsStats,
      approved_count: parseInt(evaluationsStats.approved_count) || 0,
      rejected_count: parseInt(evaluationsStats.rejected_count) || 0,
      pending_count: parseInt(evaluationsStats.pending_count) || 0,
      avg_score: parseFloat(evaluationsStats.avg_score) || 0
    };

    const processedTeachingStats = {
      ...teachingStats,
      total_sessions: parseInt(teachingStats.total_sessions) || 0,
      total_lesson_plans: parseInt(teachingStats.total_lesson_plans) || 0,
      total_students_taught: parseInt(teachingStats.total_students_taught) || 0,
      avg_class_size: parseFloat(teachingStats.avg_class_size) || 0
    };

    res.json({
      success: true,
      data: {
        academic_year_id: academic_year_id || null,
        schools_stats: schoolsStats,
        evaluations_stats: processedEvaluationsStats,
        teaching_stats: processedTeachingStats,
        schools_detail: schoolsDetail,
        students_detail: studentsDetail
      }
    });
  } catch (error) {
    console.error('💥 Error fetching reports:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลรายงานได้',
      error: error.message
    });
  }
};

// ดึงข้อมูลการประเมินที่รอดำเนินการสำหรับ supervisor
const getPendingEvaluations = async (req, res) => {
  try {
    console.log('🔍 getPendingEvaluations called');
    
    const query = `
      SELECT 
        cr.id,
        cr.assignment_id,
        cr.created_at,
        cr.self_evaluation,
        cr.achievements,
        cr.challenges_faced,
        cr.skills_developed,
        cr.future_goals,
        cr.total_teaching_hours,
        cr.total_lesson_plans,
        cr.total_teaching_sessions,
        cr.teacher_comments,
        cr.teacher_rating,
        cr.teacher_reviewed_at,
        cr.status,
        u.first_name,
        u.last_name,
        u.student_code,
        u.faculty,
        u.major,
        s.school_name,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      INNER JOIN users u ON ia.student_id = u.id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      WHERE cr.status = 'under_review'
      ORDER BY cr.created_at DESC
    `;
    
    const [requests] = await db.query(query);
    
    console.log('✅ Found pending evaluations:', requests.length);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching pending evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการประเมินที่รอดำเนินการ'
    });
  }
};

// ประเมินคำร้องขอสำเร็จการฝึกแบบละเอียด (เหมือนครูพี่เลี้ยง)
const evaluateCompletionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { supervisor_comments, supervisor_rating, status, detailed_evaluation_data } = req.body;
    const supervisorId = req.user.id;

    console.log('🔵 Backend - Supervisor evaluating completion request:', { requestId, supervisor_comments, supervisor_rating, status, supervisorId });
    console.log('🔵 Backend - Detailed evaluation data:', JSON.stringify(detailed_evaluation_data, null, 2));

    const { pool } = require('../config/database');
    
    // ตรวจสอบว่า supervisor มีสิทธิ์ประเมิน request นี้หรือไม่
    const checkQuery = `
      SELECT cr.id, cr.status
      FROM completion_requests cr
      INNER JOIN internship_assignments ia ON cr.assignment_id = ia.id
      WHERE cr.id = ? AND cr.status = 'under_review'
    `;
    const [checkRows] = await pool.execute(checkQuery, [requestId]);
    
    if (checkRows.length === 0) {
      console.log('🔴 Backend - No permission to evaluate request:', requestId);
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ประเมินคำร้องขอสำเร็จการฝึกนี้ หรือคำร้องนี้ไม่พร้อมสำหรับการประเมิน'
      });
    }
    
    console.log('✅ Backend - Permission granted for request:', requestId, 'status:', checkRows[0].status);

    // เริ่ม transaction โดยใช้ connection
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // ลบการประเมินเก่า (ถ้ามี)
      await connection.execute('DELETE FROM evaluation_details WHERE completion_request_id = ?', [requestId]);

      // บันทึกการประเมินหัวข้อย่อยใหม่
      if (detailed_evaluation_data && detailed_evaluation_data.length > 0) {
        console.log('🔵 Backend - Processing detailed evaluation data...');
        for (const criteria of detailed_evaluation_data) {
          console.log('🔵 Backend - Processing criteria:', criteria.id, criteria.name);
          if (criteria.subItems && criteria.subItems.length > 0) {
            for (const subItem of criteria.subItems) {
              console.log('🔵 Backend - Processing subItem:', subItem.id, subItem.name, 'rating:', subItem.rating);
              await connection.execute(`
                INSERT INTO evaluation_details 
                (completion_request_id, criteria_id, sub_item_id, sub_item_name, sub_item_description, rating)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [
                requestId,
                criteria.id,
                subItem.id,
                subItem.name,
                subItem.description,
                subItem.rating
              ]);
            }
          }
        }
        console.log('🔵 Backend - Detailed evaluation data processed successfully');
      }

      // กำหนดสถานะใหม่ตามการตัดสิน
      let finalStatus;
      if (status === 'pass') {
        finalStatus = 'supervisor_approved';
      } else if (status === 'fail') {
        finalStatus = 'supervisor_rejected';
      } else {
        finalStatus = status; // ใช้สถานะที่ส่งมา
      }

      // อัปเดตการประเมิน
      const updateQuery = `
        UPDATE completion_requests 
        SET supervisor_comments = ?, supervisor_rating = ?, supervisor_reviewed_at = NOW(), status = ?, 
            detailed_evaluation_data = ?, detailed_rating = ?
        WHERE id = ?
      `;
      console.log('🔵 Backend - Updating completion request with:', {
        supervisor_comments,
        supervisor_rating,
        finalStatus,
        detailed_evaluation_data: JSON.stringify(detailed_evaluation_data),
        requestId
      });
      await connection.execute(updateQuery, [
        supervisor_comments, 
        supervisor_rating, 
        finalStatus, 
        JSON.stringify(detailed_evaluation_data),
        supervisor_rating,
        requestId
      ]);

      // commit transaction
      await connection.commit();
      
      res.json({
        success: true,
        message: 'ประเมินคำร้องขอสำเร็จการฝึกสำเร็จ'
      });
    } catch (error) {
      // rollback transaction
      await connection.rollback();
      throw error;
    } finally {
      // release connection
      connection.release();
    }
  } catch (error) {
    console.error('🔴 Backend - Error evaluating completion request:', error);
    console.error('🔴 Backend - Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประเมินคำร้องขอสำเร็จการฝึก',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all lesson plans in the system
const getAllLessonPlans = async (req, res) => {
  try {
    console.log('🔍 getAllLessonPlans called');
    const { page = 1, limit = 10, search = '', subject_id = '', status = '', class_level = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        lp.id, lp.lesson_plan_name, lp.description, lp.objectives, lp.teaching_methods,
        lp.assessment_methods, lp.duration_minutes, lp.target_grade, lp.status, lp.created_at,
        s.subject_code, s.subject_name,
        u.first_name, u.last_name, u.student_code, u.id as student_user_id,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        sch.school_name
      FROM lesson_plans lp
      INNER JOIN subjects s ON lp.subject_id = s.id
      INNER JOIN users u ON lp.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN schools sch ON ia.school_id = sch.school_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      query += ` AND (lp.lesson_plan_name LIKE ? OR lp.description LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (subject_id) {
      query += ` AND lp.subject_id = ?`;
      queryParams.push(subject_id);
    }

    if (status) {
      query += ` AND lp.status = ?`;
      queryParams.push(status);
    }

    if (class_level) {
      query += ` AND lp.target_grade = ?`;
      queryParams.push(class_level);
    }

    query += ` ORDER BY lp.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [lessonPlans] = await db.query(query, queryParams);

    // ดึงข้อมูลไฟล์สำหรับแต่ละแผนการสอน
    const lessonPlansWithFiles = await Promise.all(
      lessonPlans.map(async (plan) => {
        try {
          const fileQuery = `
            SELECT id, file_name, file_path, file_size, file_type, mime_type, file_category, uploaded_at
            FROM lesson_plan_files 
            WHERE lesson_plan_id = ?
          `;
          const [files] = await db.query(fileQuery, [plan.id]);
          return { ...plan, files: files || [] };
        } catch (error) {
          console.error('Error fetching files for lesson plan:', plan.id, error);
          return { ...plan, files: [] };
        }
      })
    );

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM lesson_plans lp
      INNER JOIN subjects s ON lp.subject_id = s.id
      INNER JOIN users u ON lp.student_id = u.id
      WHERE 1=1
    `;

    const countParams = [];
    if (search) {
      countQuery += ` AND (lp.lesson_plan_name LIKE ? OR lp.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (subject_id) {
      countQuery += ` AND lp.subject_id = ?`;
      countParams.push(subject_id);
    }
    if (status) {
      countQuery += ` AND lp.status = ?`;
      countParams.push(status);
    }
    if (class_level) {
      countQuery += ` AND lp.target_grade = ?`;
      countParams.push(class_level);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('✅ Found lesson plans:', lessonPlansWithFiles.length);
    res.json({
      success: true,
      data: lessonPlansWithFiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all lesson plans:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนการสอน' });
  }
};

// Get all teaching sessions in the system
const getAllTeachingSessions = async (req, res) => {
  try {
    console.log('🔍 getAllTeachingSessions called');
    const { page = 1, limit = 10, search = '', subject_id = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ts.id, ts.lesson_topic, ts.teaching_date, ts.start_time, ts.end_time,
        ts.class_level, ts.class_room, ts.student_count, ts.learning_activities,
        ts.learning_outcomes, ts.problems_encountered, ts.problem_solutions,
        ts.improvement_notes, ts.teacher_feedback, ts.self_rating, ts.status, ts.created_at,
        s.subject_code, s.subject_name,
        u.first_name, u.last_name, u.student_code, u.id as student_user_id,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        lp.lesson_plan_name, sch.school_name
      FROM teaching_sessions ts
      INNER JOIN subjects s ON ts.subject_id = s.id
      INNER JOIN users u ON ts.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN users t ON ia.teacher_id = t.id
      LEFT JOIN lesson_plans lp ON ts.lesson_plan_id = lp.id
      LEFT JOIN schools sch ON ia.school_id = sch.school_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      query += ` AND (ts.lesson_topic LIKE ? OR ts.learning_activities LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (subject_id) {
      query += ` AND ts.subject_id = ?`;
      queryParams.push(subject_id);
    }

    if (status) {
      query += ` AND ts.status = ?`;
      queryParams.push(status);
    }

    query += ` ORDER BY ts.teaching_date DESC, ts.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [teachingSessions] = await db.query(query, queryParams);

    // ดึงข้อมูลไฟล์สำหรับแต่ละบันทึกการฝึกประสบการณ์
    const teachingSessionsWithFiles = await Promise.all(
      teachingSessions.map(async (session) => {
        try {
          const fileQuery = `
            SELECT id, file_name, file_path, file_size, file_type, mime_type, file_category
            FROM teaching_session_files 
            WHERE teaching_session_id = ?
          `;
          const [files] = await db.query(fileQuery, [session.id]);
          return { ...session, files: files || [] };
        } catch (error) {
          console.error('Error fetching files for teaching session:', session.id, error);
          return { ...session, files: [] };
        }
      })
    );

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM teaching_sessions ts
      INNER JOIN subjects s ON ts.subject_id = s.id
      INNER JOIN users u ON ts.student_id = u.id
      WHERE 1=1
    `;

    const countParams = [];
    if (search) {
      countQuery += ` AND (ts.lesson_topic LIKE ? OR ts.learning_activities LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (subject_id) {
      countQuery += ` AND ts.subject_id = ?`;
      countParams.push(subject_id);
    }
    if (status) {
      countQuery += ` AND ts.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('✅ Found teaching sessions:', teachingSessionsWithFiles.length);
    res.json({
      success: true,
      data: teachingSessionsWithFiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all teaching sessions:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกประสบการณ์' });
  }
};

module.exports = {
  getDashboard,
  getAllSchools,
  getSchoolDetail,
  addTeacherToSchool,
  removeTeacherFromSchool,
  addStudentToSchool,
  removeStudentFromSchool,
  getAvailableTeachers,
  getAvailableStudents,
  getStudentDetail,
  getReports,
  getPendingEvaluations,
  evaluateCompletionRequest,
  // Lesson Plans and Teaching Sessions APIs
  getAllLessonPlans,
  getAllTeachingSessions,
  // Management APIs
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createSchool,
  updateSchool,
  deleteSchool
};