const { pool } = require('../config/database');

// ดึงข้อมูลครูพี่เลี้ยงในโรงเรียนที่นักเรียนสังกัด
const getAvailableTeachers = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    console.log('🔵 Backend - Getting available teachers for student:', studentId);
    console.log('🔵 Backend - User info:', req.user);

    // ตรวจสอบข้อมูลนักเรียนทั้งหมดในตาราง internship_assignments
    const allStudentsQuery = `
      SELECT 
        ia.student_id,
        ia.school_id,
        s.school_name,
        u.first_name,
        u.last_name,
        u.role
      FROM internship_assignments ia
      INNER JOIN schools s ON ia.school_id = s.school_id
      INNER JOIN users u ON ia.student_id = u.id
      ORDER BY ia.student_id
    `;
    const [allStudents] = await pool.execute(allStudentsQuery);
    console.log('🔵 Backend - All students in internship_assignments:', allStudents);

    // ตรวจสอบข้อมูลนักเรียนก่อน
    const studentQuery = `
      SELECT 
        ia.id as assignment_id,
        ia.student_id,
        ia.school_id, 
        s.school_name,
        ia.academic_year_id,
        ia.teacher_id,
        ia.status,
        ia.enrollment_date,
        ia.start_date,
        ia.end_date
      FROM internship_assignments ia 
      INNER JOIN schools s ON ia.school_id = s.school_id 
      WHERE ia.student_id = ?
    `;
    const [studentData] = await pool.execute(studentQuery, [studentId]);
    console.log('🔵 Backend - Student school data:', studentData);
    
    if (studentData.length === 0) {
      console.log('🔴 Backend - No school assignment found for student:', studentId);
      return res.json({
        success: false,
        message: 'ไม่พบข้อมูลการลงทะเบียนโรงเรียนของนักเรียน'
      });
    }
    
    const studentSchool = studentData[0];
    console.log('🔵 Backend - Student school ID:', studentSchool.school_id);
    console.log('🔵 Backend - Student school name:', studentSchool.school_name);

    // ดึงข้อมูลครูพี่เลี้ยงในโรงเรียนที่นักเรียนสังกัด
    // ใช้ตาราง school_teachers เป็นหลัก (ไม่ใช่ school_id ใน users)
    const query = `
      SELECT DISTINCT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        s.school_name,
        st.school_id,
        st.is_primary,
        st.max_students,
        st.current_students
      FROM users u
      INNER JOIN school_teachers st ON u.id = st.teacher_id
      INNER JOIN schools s ON st.school_id = s.school_id
      INNER JOIN internship_assignments student_ia ON st.school_id = student_ia.school_id
      WHERE u.role = 'teacher' 
        AND student_ia.student_id = ?
        AND st.academic_year_id = student_ia.academic_year_id
      ORDER BY st.is_primary DESC, u.first_name, u.last_name
    `;

    const [teachers] = await pool.execute(query, [studentId]);

    console.log('🔵 Backend - Found teachers:', teachers.length);
    console.log('🔵 Backend - Teachers data:', teachers);
    
    // ตรวจสอบข้อมูลครูในโรงเรียนนั้นๆ เพิ่มเติม
    const allTeachersInSchoolQuery = `
      SELECT 
        st.id,
        st.teacher_id,
        st.school_id,
        st.academic_year_id,
        st.is_primary,
        st.max_students,
        st.current_students,
        u.first_name,
        u.last_name,
        u.role
      FROM school_teachers st
      INNER JOIN users u ON st.teacher_id = u.id
      WHERE st.school_id = ? AND st.academic_year_id = ?
    `;
    const [allTeachersInSchool] = await pool.execute(allTeachersInSchoolQuery, [studentSchool.school_id, studentSchool.academic_year_id]);
    console.log('🔵 Backend - All teachers in school', studentSchool.school_id, ':', allTeachersInSchool);

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('🔵 Backend - Error getting available teachers:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลครูพี่เลี้ยงได้'
    });
  }
};

// ดึงข้อมูลอาจารย์นิเทศ
const getAvailableSupervisors = async (req, res) => {
  try {
    console.log('🔵 Backend - Getting available supervisors');

    // ดึงข้อมูลอาจารย์นิเทศทั้งหมด
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        'มหาวิทยาลัย' as school_name
      FROM users u
      WHERE u.role = 'supervisor'
      ORDER BY u.first_name, u.last_name
    `;

    const [supervisors] = await pool.execute(query);
    
    console.log('🔵 Backend - Found supervisors:', supervisors.length);

    res.json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    console.error('🔵 Backend - Error getting available supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลอาจารย์นิเทศได้'
    });
  }
};

module.exports = {
  getAvailableTeachers,
  getAvailableSupervisors
};
