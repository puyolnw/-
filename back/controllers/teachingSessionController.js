const TeachingSession = require('../models/TeachingSession');
const TeachingSessionFile = require('../models/TeachingSessionFile');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตั้งค่า multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/teaching-sessions');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// สร้างบันทึกการฝึกสอนใหม่
const createTeachingSession = async (req, res) => {
  try {
    const {
      lesson_plan_id,
      subject_id,
      teaching_date,
      start_time,
      end_time,
      class_level,
      class_room,
      student_count,
      lesson_topic,
      learning_activities,
      learning_outcomes,
      teaching_methods_used,
      materials_used,
      student_engagement,
      problems_encountered,
      problem_solutions,
      lessons_learned,
      reflection,
      improvement_notes,
      teacher_feedback,
      self_rating,
      status = 'submitted'
    } = req.body;

    const studentId = req.user.id;

    console.log('🔵 Backend - Creating teaching session with data:', {
      student_id: studentId,
      lesson_plan_id,
      subject_id,
      teaching_date,
      start_time,
      end_time,
      class_level,
      class_room,
      student_count,
      lesson_topic,
      learning_activities,
      learning_outcomes,
      teaching_methods_used,
      materials_used,
      student_engagement,
      problems_encountered,
      problem_solutions,
      lessons_learned,
      reflection,
      improvement_notes,
      teacher_feedback,
      self_rating,
      status
    });

    // ตรวจสอบเวลา
    if (new Date(`2000-01-01 ${end_time}`) <= new Date(`2000-01-01 ${start_time}`)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const sessionData = {
      student_id: studentId,
      lesson_plan_id,
      subject_id,
      teaching_date,
      start_time,
      end_time,
      class_level: class_level || null,
      class_room: class_room || null,
      student_count: student_count ? parseInt(student_count) : null,
      lesson_topic: lesson_topic || null,
      learning_activities: learning_activities || null,
      learning_outcomes: learning_outcomes || null,
      teaching_methods_used: teaching_methods_used || null,
      materials_used: materials_used || null,
      student_engagement: student_engagement || null,
      problems_encountered: problems_encountered || null,
      problem_solutions: problem_solutions || null,
      lessons_learned: lessons_learned || null,
      reflection: reflection || null,
      improvement_notes: improvement_notes || null,
      teacher_feedback: null, // ตั้งเป็น null เนื่องจากยังไม่มีข้อมูล
      self_rating: self_rating ? parseInt(self_rating) : null,
      status
    };

    const teachingSession = await TeachingSession.create(sessionData);

    res.status(201).json({
      success: true,
      message: 'Teaching session created successfully',
      data: teachingSession
    });
  } catch (error) {
    console.error('Error creating teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create teaching session',
      error: error.message
    });
  }
};

// ดึงบันทึกการฝึกสอนทั้งหมดของนักศึกษา
const getMyTeachingSessions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { 
      status, 
      subject_id, 
      lesson_plan_id, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;
    const options = {
      status,
      subject_id,
      lesson_plan_id,
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const teachingSessions = await TeachingSession.findByStudentId(studentId, options);
    const stats = await TeachingSession.getStudentStats(studentId);
    const totalCount = await TeachingSession.getTotalCount(studentId, options);

    const responseData = {
      success: true,
      data: {
        teachingSessions: teachingSessions || [],
        stats: stats || {
          total_sessions: 0,
          draft_sessions: 0,
          submitted_sessions: 0,
          reviewed_sessions: 0,
          total_minutes: 0,
          average_rating: 0,
          teaching_days: 0,
          subjects_taught: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount
        }
      }
    };

    console.log('🔵 Backend - Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teaching sessions',
      error: error.message
    });
  }
};

// ดึงบันทึกการฝึกสอนตาม ID
const getTeachingSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const teachingSession = await TeachingSession.findById(id);
    if (!teachingSession) {
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    // ตรวจสอบว่าเป็นของนักศึกษาหรือไม่
    if (teachingSession.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ดึงไฟล์ที่แนบ
    const files = await TeachingSessionFile.findByTeachingSessionId(id);

    res.json({
      success: true,
      data: {
        ...teachingSession,
        files
      }
    });
  } catch (error) {
    console.error('Error fetching teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teaching session',
      error: error.message
    });
  }
};

// อัปเดตบันทึกการฝึกสอน
const updateTeachingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const updateData = req.body;

    // ตรวจสอบว่าบันทึกการฝึกสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await TeachingSession.isOwnedByStudent(id, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ตรวจสอบเวลา (ถ้ามีการอัปเดต)
    if (updateData.start_time && updateData.end_time) {
      if (new Date(`2000-01-01 ${updateData.end_time}`) <= new Date(`2000-01-01 ${updateData.start_time}`)) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    const updatedTeachingSession = await TeachingSession.update(id, updateData);

    res.json({
      success: true,
      message: 'Teaching session updated successfully',
      data: updatedTeachingSession
    });
  } catch (error) {
    console.error('Error updating teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teaching session',
      error: error.message
    });
  }
};

// ลบบันทึกการฝึกสอน
const deleteTeachingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    console.log('🔵 Backend - Delete teaching session request:', { id, studentId });

    // ตรวจสอบว่าบันทึกการฝึกสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await TeachingSession.isOwnedByStudent(id, studentId);
    console.log('🔵 Backend - Is owned by student:', isOwned);
    
    if (!isOwned) {
      console.log('🔵 Backend - Access denied for session:', id);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const deleted = await TeachingSession.delete(id);
    console.log('🔵 Backend - Delete result:', deleted);
    
    if (!deleted) {
      console.log('🔵 Backend - Teaching session not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    console.log('🔵 Backend - Teaching session deleted successfully:', id);
    res.json({
      success: true,
      message: 'Teaching session deleted successfully'
    });
  } catch (error) {
    console.error('🔵 Backend - Error deleting teaching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete teaching session',
      error: error.message
    });
  }
};

// ดึงแผนการสอนที่ใช้ได้
const getAvailableLessonPlans = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject_id } = req.query;

    const lessonPlans = await TeachingSession.getAvailableLessonPlans(studentId, subject_id);

    res.json({
      success: true,
      data: lessonPlans || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available lesson plans',
      error: error.message
    });
  }
};

// อัปโหลดไฟล์สำหรับบันทึกการฝึกสอน
const uploadFiles = async (req, res) => {
  try {
    const { teachingSessionId } = req.params;
    const studentId = req.user.id;

    // ตรวจสอบว่าบันทึกการฝึกสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await TeachingSession.isOwnedByStudent(teachingSessionId, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileData = {
        teaching_session_id: teachingSessionId,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        file_type: path.extname(file.originalname),
        mime_type: file.mimetype,
        file_category: getFileCategory(file.mimetype),
        description: req.body.description || null
      };

      const savedFile = await TeachingSessionFile.create(fileData);
      uploadedFiles.push(savedFile);
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};

// ลบไฟล์
const deleteFile = async (req, res) => {
  try {
    const { teachingSessionId, fileId } = req.params;
    const studentId = req.user.id;

    // ตรวจสอบว่าบันทึกการฝึกสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await TeachingSession.isOwnedByStudent(teachingSessionId, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ตรวจสอบว่าไฟล์เป็นของบันทึกการฝึกสอนหรือไม่
    const fileOwned = await TeachingSessionFile.isOwnedByTeachingSession(fileId, teachingSessionId);
    if (!fileOwned) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // ดึงข้อมูลไฟล์ก่อนลบ
    const file = await TeachingSessionFile.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // ลบไฟล์จากฐานข้อมูล
    const deleted = await TeachingSessionFile.delete(fileId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // ลบไฟล์จากระบบไฟล์
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    } catch (fsError) {
      console.error('Error deleting file from filesystem:', fsError);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

// ดึงสถิติรายเดือน
const getMonthlyStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const stats = await TeachingSession.getMonthlyStats(studentId, year, month);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly stats',
      error: error.message
    });
  }
};

// ฟังก์ชันช่วยสำหรับกำหนดหมวดหมู่ไฟล์
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
};

module.exports = {
  createTeachingSession,
  getMyTeachingSessions,
  getTeachingSessionById,
  updateTeachingSession,
  deleteTeachingSession,
  getAvailableLessonPlans,
  uploadFiles,
  deleteFile,
  getMonthlyStats,
  upload
};
