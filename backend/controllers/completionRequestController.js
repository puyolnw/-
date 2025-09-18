const CompletionRequest = require('../models/CompletionRequest');

// สร้างคำร้องขอสำเร็จการฝึกใหม่
const createCompletionRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      assignment_id,
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals
    } = req.body;

    console.log('🔵 Backend - Create completion request:', { studentId, assignment_id });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    // ดึงสถิติการฝึกสอน
    const teachingStats = await CompletionRequest.getTeachingStats(studentId, assignment_id);
    console.log('🔵 Backend - Teaching stats:', teachingStats);

    // สร้างคำร้อง
    const requestData = {
      student_id: studentId,
      assignment_id,
      total_teaching_hours: teachingStats.total_teaching_hours || 0,
      total_lesson_plans: teachingStats.total_lesson_plans || 0,
      total_teaching_sessions: teachingStats.total_teaching_sessions || 0,
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals
    };

    const newRequest = await CompletionRequest.create(requestData);
    console.log('🔵 Backend - Completion request created:', newRequest);

    res.status(201).json({
      success: true,
      message: 'คำร้องขอสำเร็จการฝึกถูกส่งเรียบร้อยแล้ว',
      data: newRequest
    });
  } catch (error) {
    console.error('🔵 Backend - Error creating completion request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งคำร้อง'
    });
  }
};

// ดึงคำร้องขอสำเร็จการฝึกของนักศึกษา
const getStudentCompletionRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('🔵 Backend - Get completion requests for student:', studentId);

    const requests = await CompletionRequest.findByStudent(studentId);
    console.log('🔵 Backend - Completion requests found:', requests.length);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching completion requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง'
    });
  }
};

// ดึงคำร้องขอสำเร็จการฝึกตาม ID
const getCompletionRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔵 Backend - Get completion request by ID:', { id, userId, userRole });

    const request = await CompletionRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำร้องขอสำเร็จการฝึก'
      });
    }

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (userRole === 'student' && request.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงคำร้องนี้'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching completion request by ID:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง'
    });
  }
};

// ดึงคำร้องที่รอการอนุมัติ (สำหรับครูพี่เลี้ยง)
const getPendingRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;

    console.log('🔵 Backend - Get pending requests for teacher:', teacherId);

    const requests = await CompletionRequest.findPendingByTeacher(teacherId);
    console.log('🔵 Backend - Pending requests found:', requests.length);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำร้องที่รอการอนุมัติ'
    });
  }
};

// อัปเดตสถานะคำร้อง (สำหรับครูพี่เลี้ยง)
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, teacher_comments, teacher_rating } = req.body;

    console.log('🔵 Backend - Update request status:', { id, status, teacher_comments, teacher_rating });

    // ตรวจสอบสถานะที่อนุญาต
    const allowedStatuses = ['under_review', 'approved', 'rejected', 'revision_required'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง'
      });
    }

    const updated = await CompletionRequest.updateStatus(id, status, teacher_comments, teacher_rating);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำร้องหรือไม่สามารถอัปเดตได้'
      });
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะคำร้องเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('🔵 Backend - Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำร้อง'
    });
  }
};

// อัปเดตความเห็นจากอาจารย์นิเทศ
const updateSupervisorReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_comments, supervisor_rating } = req.body;

    console.log('🔵 Backend - Update supervisor review:', { id, supervisor_comments, supervisor_rating });

    const updated = await CompletionRequest.updateSupervisorReview(id, supervisor_comments, supervisor_rating);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำร้องหรือไม่สามารถอัปเดตได้'
      });
    }

    res.json({
      success: true,
      message: 'อัปเดตความเห็นจากอาจารย์นิเทศเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('🔵 Backend - Error updating supervisor review:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตความเห็น'
    });
  }
};

// อนุมัติคำร้อง (สำหรับอาจารย์นิเทศ)
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.id;

    console.log('🔵 Backend - Approve request:', { id, approvedBy });

    const approved = await CompletionRequest.approve(id, approvedBy);
    if (!approved) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำร้องหรือไม่สามารถอนุมัติได้'
      });
    }

    res.json({
      success: true,
      message: 'อนุมัติคำร้องเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('🔵 Backend - Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติคำร้อง'
    });
  }
};

// ลบคำร้อง (เฉพาะคำร้องที่ยังไม่ได้รับการอนุมัติ)
const deleteCompletionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    console.log('🔵 Backend - Delete completion request:', { id, studentId });

    const deleted = await CompletionRequest.delete(id, studentId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำร้องหรือไม่สามารถลบได้ (คำร้องอาจได้รับการอนุมัติแล้ว)'
      });
    }

    res.json({
      success: true,
      message: 'ลบคำร้องเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('🔵 Backend - Error deleting completion request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบคำร้อง'
    });
  }
};

// ดึงสถิติการฝึกสอนสำหรับคำร้อง
const getTeachingStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { assignment_id } = req.query;

    console.log('🔵 Backend - Get teaching stats:', { studentId, assignment_id });
    console.log('🔵 Backend - Request headers:', req.headers);
    console.log('🔵 Backend - User object:', req.user);

    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const stats = await CompletionRequest.getTeachingStats(studentId, assignment_id);
    console.log('🔵 Backend - Teaching stats result:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('🔵 Backend - Error fetching teaching stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
    });
  }
};

// อัปเดตคำร้องขอสำเร็จการฝึก
const updateCompletionRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      assignment_id,
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals,
      status
    } = req.body;

    console.log('🔵 Backend - Update completion request:', { studentId, assignment_id, status });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const result = await CompletionRequest.updateByAssignment(studentId, assignment_id, {
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals,
      status: status || 'pending'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Completion request updated successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to update completion request'
      });
    }
  } catch (error) {
    console.error('Error updating completion request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตคำร้อง'
    });
  }
};

// ขอประเมินใหม่ (สำหรับกรณีที่ไม่ผ่าน)
const requestRevision = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const {
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals
    } = req.body;

    console.log('🔵 Backend - Request revision:', { studentId, id });

    const result = await CompletionRequest.requestRevision(id, studentId, {
      self_evaluation,
      achievements,
      challenges_faced,
      skills_developed,
      future_goals
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'ขอประเมินใหม่เรียบร้อยแล้ว',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'ไม่สามารถขอประเมินใหม่ได้'
      });
    }
  } catch (error) {
    console.error('🔵 Backend - Error requesting revision:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการขอประเมินใหม่'
    });
  }
};

module.exports = {
  createCompletionRequest,
  getStudentCompletionRequests,
  getCompletionRequestById,
  getPendingRequests,
  updateRequestStatus,
  updateSupervisorReview,
  approveRequest,
  deleteCompletionRequest,
  getTeachingStats,
  updateCompletionRequest,
  requestRevision
};
