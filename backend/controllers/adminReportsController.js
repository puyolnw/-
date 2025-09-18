const { db } = require('../config/database');

// ดึงข้อมูลรายงานสำหรับแอดมิน
const getAdminReports = async (req, res) => {
  try {
    console.log('🔍 getAdminReports called with params:', req.query);
    const { 
      academic_year_id, 
      school_id, 
      start_date, 
      end_date,
      report_type = 'overview' 
    } = req.query;

    let whereConditions = [];
    let params = [];

    // Filter by academic year
    if (academic_year_id) {
      whereConditions.push('ia.academic_year_id = ?');
      params.push(academic_year_id);
    }

    // Filter by school
    if (school_id) {
      whereConditions.push('ia.school_id = ?');
      params.push(school_id);
    }

    // Filter by date range
    if (start_date) {
      whereConditions.push('DATE(ts.teaching_date) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push('DATE(ts.teaching_date) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // สถิติภาพรวม
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT s.school_id) as total_schools,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END) as total_teachers,
        COUNT(DISTINCT CASE WHEN u.role = 'supervisor' THEN u.id END) as total_supervisors,
        COUNT(DISTINCT ia.student_id) as active_internships,
        COUNT(DISTINCT CASE WHEN ia.status = 'active' THEN ia.student_id END) as active_students,
        COUNT(DISTINCT CASE WHEN ia.status = 'completed' THEN ia.student_id END) as completed_students
      FROM schools s
      LEFT JOIN school_teachers st ON s.school_id = st.school_id
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN users u ON 1=1
      ${whereClause}
    `;
    
    const [overviewResult] = await db.query(overviewQuery, params);
    const overviewStats = overviewResult[0];

    // สถิติการประเมิน
    const evaluationsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        SUM(CASE WHEN cr.status = 'supervisor_approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN cr.status = 'supervisor_rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) as waiting_count,
        AVG(cr.supervisor_average_score) as avg_score,
        MIN(cr.supervisor_average_score) as min_score,
        MAX(cr.supervisor_average_score) as max_score
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
    `;
    
    const [evaluationsResult] = await db.query(evaluationsQuery, params);
    const evaluationsStats = evaluationsResult[0];

    // สถิติบันทึกฝึกประสบการณ์
    const teachingSessionsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT ts.student_id) as students_with_sessions,
        AVG(ts.student_count) as avg_class_size,
        SUM(ts.student_count) as total_students_taught,
        COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END) as approved_sessions,
        COUNT(DISTINCT CASE WHEN ts.status = 'draft' THEN ts.id END) as draft_sessions,
        COUNT(DISTINCT CASE WHEN ts.status = 'submitted' THEN ts.id END) as submitted_sessions
      FROM teaching_sessions ts
      LEFT JOIN internship_assignments ia ON ts.student_id = ia.student_id
      ${whereClause}
    `;
    
    const [teachingSessionsResult] = await db.query(teachingSessionsQuery, params);
    const teachingSessionsStats = teachingSessionsResult[0];

    // สถิติแผนการสอน
    const lessonPlansQuery = `
      SELECT 
        COUNT(*) as total_plans,
        COUNT(DISTINCT lp.student_id) as students_with_plans,
        COUNT(DISTINCT CASE WHEN lp.status = 'approved' THEN lp.id END) as approved_plans,
        COUNT(DISTINCT CASE WHEN lp.status = 'draft' THEN lp.id END) as draft_plans,
        COUNT(DISTINCT CASE WHEN lp.status = 'submitted' THEN lp.id END) as submitted_plans
      FROM lesson_plans lp
      LEFT JOIN internship_assignments ia ON lp.student_id = ia.student_id
      ${whereClause}
    `;
    
    const [lessonPlansResult] = await db.query(lessonPlansQuery, params);
    const lessonPlansStats = lessonPlansResult[0];

    // ข้อมูลสำหรับกราฟ - การประเมินตามเดือน
    const evaluationsByMonthQuery = `
      SELECT 
        DATE_FORMAT(cr.created_at, '%Y-%m') as month,
        COUNT(*) as count,
        AVG(cr.supervisor_average_score) as avg_score
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
      GROUP BY DATE_FORMAT(cr.created_at, '%Y-%m')
      ORDER BY month
    `;
    
    const [evaluationsByMonth] = await db.query(evaluationsByMonthQuery, params);
    
    // Convert string values to numbers for evaluations by month
    const processedEvaluationsByMonth = evaluationsByMonth.map(item => ({
      ...item,
      count: parseInt(item.count) || 0,
      avg_score: item.avg_score ? parseFloat(item.avg_score) : null
    }));

    // ข้อมูลสำหรับกราฟ - บันทึกฝึกประสบการณ์ตามเดือน
    const teachingSessionsByMonthQuery = `
      SELECT 
        DATE_FORMAT(ts.teaching_date, '%Y-%m') as month,
        COUNT(*) as count,
        AVG(ts.student_count) as avg_class_size
      FROM teaching_sessions ts
      LEFT JOIN internship_assignments ia ON ts.student_id = ia.student_id
      ${whereClause}
      GROUP BY DATE_FORMAT(ts.teaching_date, '%Y-%m')
      ORDER BY month
    `;
    
    const [teachingSessionsByMonth] = await db.query(teachingSessionsByMonthQuery, params);

    // ข้อมูลสำหรับกราฟ - ผู้ใช้ตามบทบาท
    const usersByRoleQuery = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `;
    
    const [usersByRole] = await db.query(usersByRoleQuery);

    // ข้อมูลสำหรับกราฟ - โรงเรียนที่มีกิจกรรม
    const schoolsActivityQuery = `
      SELECT 
        s.school_name,
        COUNT(DISTINCT ia.student_id) as student_count,
        COUNT(DISTINCT ts.id) as teaching_sessions_count,
        COUNT(DISTINCT lp.id) as lesson_plans_count,
        COUNT(DISTINCT cr.id) as evaluations_count
      FROM schools s
      LEFT JOIN internship_assignments ia ON s.school_id = ia.school_id
      LEFT JOIN teaching_sessions ts ON ia.student_id = ts.student_id
      LEFT JOIN lesson_plans lp ON ia.student_id = lp.student_id
      LEFT JOIN completion_requests cr ON ia.id = cr.assignment_id
      ${whereClause}
      GROUP BY s.school_id, s.school_name
      ORDER BY student_count DESC
    `;
    
    const [schoolsActivity] = await db.query(schoolsActivityQuery, params);

    // ข้อมูลสำหรับกราฟ - สถิติการประเมินตามเกณฑ์
    const evaluationCriteriaQuery = `
      SELECT 
        'ความรู้ความเข้าใจในเนื้อหาวิชา' as criteria_name,
        AVG(cr.supervisor_criteria_1) as avg_score,
        COUNT(CASE WHEN cr.supervisor_criteria_1 IS NOT NULL THEN 1 END) as count
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
      UNION ALL
      SELECT 
        'การวางแผนการสอน',
        AVG(cr.supervisor_criteria_2),
        COUNT(CASE WHEN cr.supervisor_criteria_2 IS NOT NULL THEN 1 END)
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
      UNION ALL
      SELECT 
        'การใช้สื่อและเทคโนโลยี',
        AVG(cr.supervisor_criteria_3),
        COUNT(CASE WHEN cr.supervisor_criteria_3 IS NOT NULL THEN 1 END)
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
      UNION ALL
      SELECT 
        'การจัดการชั้นเรียน',
        AVG(cr.supervisor_criteria_4),
        COUNT(CASE WHEN cr.supervisor_criteria_4 IS NOT NULL THEN 1 END)
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
      UNION ALL
      SELECT 
        'การสื่อสารและการนำเสนอ',
        AVG(cr.supervisor_criteria_5),
        COUNT(CASE WHEN cr.supervisor_criteria_5 IS NOT NULL THEN 1 END)
      FROM completion_requests cr
      LEFT JOIN internship_assignments ia ON cr.assignment_id = ia.id
      ${whereClause}
    `;
    
    const [evaluationCriteria] = await db.query(evaluationCriteriaQuery, params);
    
    // Convert string values to numbers for evaluation criteria
    const processedEvaluationCriteria = evaluationCriteria.map(item => ({
      ...item,
      avg_score: item.avg_score ? parseFloat(item.avg_score) : null,
      count: parseInt(item.count) || 0
    }));

    // รายละเอียดข้อมูล
    const detailedDataQuery = `
      SELECT 
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.student_code,
        s.school_name,
        COUNT(DISTINCT ts.id) as teaching_sessions_count,
        COUNT(DISTINCT lp.id) as lesson_plans_count,
        COUNT(DISTINCT cr.id) as evaluations_count,
        AVG(cr.supervisor_average_score) as avg_evaluation_score,
        ia.status as internship_status
      FROM users u
      LEFT JOIN internship_assignments ia ON u.id = ia.student_id
      LEFT JOIN schools s ON ia.school_id = s.school_id
      LEFT JOIN teaching_sessions ts ON u.id = ts.student_id
      LEFT JOIN lesson_plans lp ON u.id = lp.student_id
      LEFT JOIN completion_requests cr ON ia.id = cr.assignment_id
      WHERE u.role = 'student'
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.student_code, s.school_name, ia.status
      ORDER BY u.first_name, u.last_name
    `;
    
    const [detailedData] = await db.query(detailedDataQuery, params);
    
    // Convert string values to numbers for detailed data
    const processedDetailedData = detailedData.map(item => ({
      ...item,
      teaching_sessions_count: parseInt(item.teaching_sessions_count) || 0,
      lesson_plans_count: parseInt(item.lesson_plans_count) || 0,
      evaluations_count: parseInt(item.evaluations_count) || 0,
      avg_evaluation_score: item.avg_evaluation_score ? parseFloat(item.avg_evaluation_score) : null
    }));

    res.json({
      success: true,
      data: {
        overview: {
          total_schools: parseInt(overviewStats.total_schools) || 0,
          total_users: parseInt(overviewStats.total_users) || 0,
          total_students: parseInt(overviewStats.total_students) || 0,
          total_teachers: parseInt(overviewStats.total_teachers) || 0,
          total_supervisors: parseInt(overviewStats.total_supervisors) || 0,
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
          avg_score: parseFloat(evaluationsStats.avg_score) || 0,
          min_score: parseFloat(evaluationsStats.min_score) || 0,
          max_score: parseFloat(evaluationsStats.max_score) || 0
        },
        teaching_sessions: {
          total: parseInt(teachingSessionsStats.total_sessions) || 0,
          students_with_sessions: parseInt(teachingSessionsStats.students_with_sessions) || 0,
          avg_class_size: parseFloat(teachingSessionsStats.avg_class_size) || 0,
          total_students_taught: parseInt(teachingSessionsStats.total_students_taught) || 0,
          approved: parseInt(teachingSessionsStats.approved_sessions) || 0,
          draft: parseInt(teachingSessionsStats.draft_sessions) || 0,
          submitted: parseInt(teachingSessionsStats.submitted_sessions) || 0
        },
        lesson_plans: {
          total: parseInt(lessonPlansStats.total_plans) || 0,
          students_with_plans: parseInt(lessonPlansStats.students_with_plans) || 0,
          approved: parseInt(lessonPlansStats.approved_plans) || 0,
          draft: parseInt(lessonPlansStats.draft_plans) || 0,
          submitted: parseInt(lessonPlansStats.submitted_plans) || 0
        },
        charts: {
          evaluations_by_month: processedEvaluationsByMonth,
          teaching_sessions_by_month: teachingSessionsByMonth,
          users_by_role: usersByRole,
          schools_activity: schoolsActivity,
          evaluation_criteria: processedEvaluationCriteria
        },
        detailed_data: processedDetailedData
      }
    });
  } catch (error) {
    console.error('💥 Error fetching admin reports:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลรายงานได้',
      error: error.message
    });
  }
};

// ดึงข้อมูลสำหรับ filter options
const getFilterOptions = async (req, res) => {
  try {
    console.log('🔍 getFilterOptions called');

    // Academic years
    const [academicYears] = await db.query(`
      SELECT id, year, semester 
      FROM academic_years 
      ORDER BY year DESC, semester DESC
    `);

    // Schools
    const [schools] = await db.query(`
      SELECT school_id as id, school_name as name 
      FROM schools 
      ORDER BY school_name
    `);

    // Date range
    const [dateRange] = await db.query(`
      SELECT 
        MIN(DATE(ts.teaching_date)) as min_date,
        MAX(DATE(ts.teaching_date)) as max_date
      FROM teaching_sessions ts
    `);

    res.json({
      success: true,
      data: {
        academic_years: academicYears,
        schools: schools,
        date_range: dateRange[0]
      }
    });
  } catch (error) {
    console.error('💥 Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลตัวเลือกกรองได้',
      error: error.message
    });
  }
};

module.exports = {
  getAdminReports,
  getFilterOptions
};
