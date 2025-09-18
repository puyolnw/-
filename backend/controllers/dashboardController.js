const User = require('../models/User');
const TeachingSession = require('../models/TeachingSession');
const LessonPlan = require('../models/LessonPlan');
const CompletionRequest = require('../models/CompletionRequest');
const SchoolInfo = require('../models/SchoolInfo');

// ดึงข้อมูล Dashboard สำหรับนักศึกษา
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('🔵 Backend - Getting student dashboard for student ID:', studentId);

    // ดึงข้อมูลพื้นฐาน
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ดึงข้อมูลโรงเรียน
    let schoolInfo = null;
    try {
      const schoolResponse = await SchoolInfo.getStudentSchoolInfo(studentId);
      if (schoolResponse) {
        schoolInfo = schoolResponse;
      }
    } catch (error) {
      console.log('🔵 Backend - No school info found:', error.message);
    }

    // ดึงสถิติการฝึกสอน
    let teachingStats = null;
    if (schoolInfo?.assignment_id) {
      try {
        const statsResponse = await CompletionRequest.getTeachingStats(studentId, schoolInfo.assignment_id);
        if (statsResponse) {
          teachingStats = statsResponse;
        }
      } catch (error) {
        console.log('🔵 Backend - No teaching stats found:', error.message);
      }
    }

    // ดึงสถิติแผนการสอน
    let lessonPlanStats = null;
    try {
      const lessonPlanResponse = await LessonPlan.getMyLessonPlans(studentId, { limit: 1 });
      if (lessonPlanResponse && lessonPlanResponse.stats) {
        lessonPlanStats = lessonPlanResponse.stats;
      }
    } catch (error) {
      console.log('🔵 Backend - No lesson plan stats found:', error.message);
    }

    // ดึงบันทึกการฝึกสอนล่าสุด
    let recentTeachingSessions = [];
    try {
      const sessionsResponse = await TeachingSession.findByStudentId(studentId, { limit: 5 });
      if (sessionsResponse && sessionsResponse.length > 0) {
        recentTeachingSessions = sessionsResponse || [];
      }
    } catch (error) {
      console.log('🔵 Backend - No recent teaching sessions found:', error.message);
    }

    // ดึงแผนการสอนล่าสุด
    let recentLessonPlans = [];
    try {
      const plansResponse = await LessonPlan.findByStudentId(studentId, { limit: 5 });
      if (plansResponse && plansResponse.length > 0) {
        recentLessonPlans = plansResponse || [];
      }
    } catch (error) {
      console.log('🔵 Backend - No recent lesson plans found:', error.message);
    }

    // ดึงสถานะคำร้อง
    let completionRequestStatus = null;
    try {
      const requestResponse = await CompletionRequest.findByStudent(studentId);
      if (requestResponse && requestResponse.length > 0) {
        completionRequestStatus = requestResponse[0]; // เอาคำร้องล่าสุด
      }
    } catch (error) {
      console.log('🔵 Backend - No completion request found:', error.message);
    }

    // สร้างข้อมูล Dashboard
    const dashboardData = {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        user_id: student.user_id,
        email: student.email
      },
      schoolInfo,
      teachingStats,
      lessonPlanStats,
      recentTeachingSessions,
      recentLessonPlans,
      completionRequestStatus,
      // สถิติรวม
      summary: {
        totalTeachingSessions: teachingStats?.total_teaching_sessions || 0,
        totalTeachingHours: teachingStats?.total_teaching_hours || 0,
        totalLessonPlans: recentLessonPlans.length || 0,
        isRegistered: !!schoolInfo,
        hasCompletionRequest: !!completionRequestStatus,
        completionRequestStatus: completionRequestStatus?.status || null
      }
    };

    console.log('🔵 Backend - Dashboard data prepared:', {
      hasSchoolInfo: !!schoolInfo,
      hasTeachingStats: !!teachingStats,
      hasLessonPlanStats: !!lessonPlanStats,
      recentSessionsCount: recentTeachingSessions.length,
      recentPlansCount: recentLessonPlans.length,
      hasCompletionRequest: !!completionRequestStatus
    });

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('🔵 Backend - Error getting student dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard'
    });
  }
};

module.exports = {
  getStudentDashboard
};
