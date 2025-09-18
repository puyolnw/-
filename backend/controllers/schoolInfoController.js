const SchoolInfo = require('../models/SchoolInfo');

// ดึงข้อมูลโรงเรียนของนักศึกษา
const getStudentSchoolInfo = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('🔵 Backend - getStudentSchoolInfo called for student:', studentId);
    console.log('🔵 Backend - User object:', req.user);
    console.log('🔵 Backend - User role:', req.user.role);
    console.log('🔵 Backend - User role type:', typeof req.user.role);

    const schoolInfo = await SchoolInfo.getStudentSchoolInfo(studentId);

    console.log('🔵 Backend - School info result:', schoolInfo);

    if (!schoolInfo) {
      console.log('🔵 Backend - No school info found for student:', studentId);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโรงเรียนของนักศึกษา'
      });
    }

    console.log('🔵 Backend - School info found:', schoolInfo);

    res.json({
      success: true,
      data: schoolInfo
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching student school info:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน'
    });
  }
};

module.exports = {
  getStudentSchoolInfo
};
