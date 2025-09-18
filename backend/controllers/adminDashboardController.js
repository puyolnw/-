const { db } = require('../config/database');

// ดึงข้อมูลแดชบอร์ดสำหรับแอดมิน
const getAdminDashboard = async (req, res) => {
  try {
    console.log('🔍 getAdminDashboard called');
    
    // สถิติภาพรวม
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT s.school_id) as total_schools,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as total_teachers,
        COUNT(DISTINCT CASE WHEN u.role = 'supervisor' THEN u.id END) as total_supervisors,
        COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as total_admins,
        COUNT(DISTINCT ia.student_id) as active_internships,
        COUNT(DISTINCT CASE WHEN ia.status = 'active' THEN ia.student_id END) as active_students,
        COUNT(DISTINCT CASE WHEN ia.status = 'completed' THEN ia.student_id END) as completed_students
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN users u ON 1=1
    `;
    
    const [overviewResult] = await db.query(overviewQuery);
    const overviewStats = overviewResult[0];

    // สถิติการประเมิน
    const evaluationsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        SUM(CASE WHEN cr.status = 'supervisor_approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN cr.status = 'supervisor_rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) as waiting_count,
        AVG(cr.supervisor_average_score) as avg_score
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
    `;
    
    const [evaluationsResult] = await db.query(evaluationsQuery);
    const evaluationsStats = evaluationsResult[0];

    // สถิติบันทึกฝึกประสบการณ์
    const teachingSessionsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT ts.student_id) as students_with_sessions,
        AVG(ts.student_count) as avg_class_size,
        COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END) as approved_sessions,
        COUNT(DISTINCT CASE WHEN ts.status = 'draft' THEN ts.id END) as draft_sessions
      FROM teaching_sessions ts
    `;
    
    const [teachingSessionsResult] = await db.query(teachingSessionsQuery);
    const teachingSessionsStats = teachingSessionsResult[0];

    // สถิติแผนการสอน
    const lessonPlansQuery = `
      SELECT 
        COUNT(*) as total_plans,
        COUNT(DISTINCT lp.student_id) as students_with_plans,
        COUNT(DISTINCT CASE WHEN lp.status = 'approved' THEN lp.id END) as approved_plans,
        COUNT(DISTINCT CASE WHEN lp.status = 'draft' THEN lp.id END) as draft_plans
      FROM lesson_plans lp
    `;
    
    const [lessonPlansResult] = await db.query(lessonPlansQuery);
    const lessonPlansStats = lessonPlansResult[0];

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
      ORDER BY cr.created_at DESC
      LIMIT 5
    `;
    
    const [recentEvaluations] = await db.query(recentEvaluationsQuery);

    // บันทึกฝึกประสบการณ์ล่าสุด
    const recentTeachingSessionsQuery = `
      SELECT 
        ts.id,
        ts.teaching_date,
        ts.lesson_topic,
        ts.status,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name
      FROM teaching_sessions ts
      JOIN users u ON ts.student_id = u.id
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      ORDER BY ts.teaching_date DESC
      LIMIT 5
    `;
    
    const [recentTeachingSessions] = await db.query(recentTeachingSessionsQuery);

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

    // ผู้ใช้ที่ลงทะเบียนล่าสุด
    const recentUsersQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        CASE 
          WHEN u.role = 'student' THEN s.school_name
          ELSE NULL
        END as school_name
      FROM users u
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id AND u.role = 'student'
      LEFT JOIN schools s ON ia.school_id = s.school_id
      ORDER BY u.created_at DESC
      LIMIT 5
    `;
    
    const [recentUsers] = await db.query(recentUsersQuery);

    res.json({
      success: true,
      data: {
        overview: {
          total_schools: parseInt(overviewStats.total_schools) || 0,
          total_users: parseInt(overviewStats.total_users) || 0,
          total_students: parseInt(overviewStats.total_students) || 0,
          total_teachers: parseInt(overviewStats.total_teachers) || 0,
          total_supervisors: parseInt(overviewStats.total_supervisors) || 0,
          total_admins: parseInt(overviewStats.total_admins) || 0,
          active_internships: parseInt(overviewStats.active_internships) || 0,
          active_students: parseInt(overviewStats.active_students) || 0,
          completed_students: parseInt(overviewStats.completed_students) || 0
        },
        evaluations: {
          total: parseInt(evaluationsStats.total_evaluations) || 0,
          approved: parseInt(evaluationsStats.approved_count) || 0,
          rejected: parseInt(evaluationsStats.rejected_count) || 0,
          pending: parseInt(evaluationsStats.pending_count) || 0,
          waiting: parseInt(evaluationsStats.waiting_count) || 0,
          avg_score: parseFloat(evaluationsStats.avg_score) || 0
        },
        teaching_sessions: {
          total: parseInt(teachingSessionsStats.total_sessions) || 0,
          students_with_sessions: parseInt(teachingSessionsStats.students_with_sessions) || 0,
          avg_class_size: parseFloat(teachingSessionsStats.avg_class_size) || 0,
          approved: parseInt(teachingSessionsStats.approved_sessions) || 0,
          draft: parseInt(teachingSessionsStats.draft_sessions) || 0
        },
        lesson_plans: {
          total: parseInt(lessonPlansStats.total_plans) || 0,
          students_with_plans: parseInt(lessonPlansStats.students_with_plans) || 0,
          approved: parseInt(lessonPlansStats.approved_plans) || 0,
          draft: parseInt(lessonPlansStats.draft_plans) || 0
        },
        recent_evaluations: recentEvaluations,
        recent_teaching_sessions: recentTeachingSessions,
        recent_schools: recentSchools,
        recent_users: recentUsers
      }
    });
  } catch (error) {
    console.error('💥 Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้',
      error: error.message
    });
  }
};

module.exports = {
  getAdminDashboard
};
