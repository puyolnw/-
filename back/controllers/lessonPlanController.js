const LessonPlan = require('../models/LessonPlan');
const LessonPlanFile = require('../models/LessonPlanFile');
const Subject = require('../models/Subject');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตั้งค่า multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/lesson-plans');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // ใช้ originalname โดยตรงเพื่อรักษาชื่อไฟล์ภาษาไทย
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    cb(null, `files-${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// สร้างแผนการสอนใหม่
const createLessonPlan = async (req, res) => {
  try {
    
    const {
      lesson_plan_name,
      subject_id,
      description,
      objectives,
      teaching_methods,
      assessment_methods,
      duration_minutes,
      target_grade,
      status = 'active'
    } = req.body;

    const studentId = req.user.id;

    // ตรวจสอบว่าวิชามีอยู่จริง
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const lessonPlanData = {
      student_id: studentId,
      lesson_plan_name,
      subject_id,
      description: description || null,
      objectives: objectives || null,
      teaching_methods: teaching_methods || null,
      assessment_methods: assessment_methods || null,
      duration_minutes: duration_minutes || 50,
      target_grade,
      status
    };

    const lessonPlan = await LessonPlan.create(lessonPlanData);

    res.status(201).json({
      success: true,
      message: 'Lesson plan created successfully',
      data: lessonPlan
    });
  } catch (error) {
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A lesson plan with this name already exists for this student'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create lesson plan',
      error: error.message
    });
  }
};

// ดึงแผนการสอนทั้งหมดของนักศึกษา
const getMyLessonPlans = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, subject_id, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const options = {
      status,
      subject_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const lessonPlans = await LessonPlan.findByStudentId(studentId, options);
    const stats = await LessonPlan.getStudentStats(studentId);

    res.json({
      success: true,
      data: {
        lessonPlans,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: stats.total_plans
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson plans',
      error: error.message
    });
  }
};

// ดึงแผนการสอนตาม ID
const getLessonPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const lessonPlan = await LessonPlan.findById(id);
    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: 'Lesson plan not found'
      });
    }

    // ตรวจสอบว่าเป็นของนักศึกษาหรือไม่
    if (lessonPlan.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ดึงไฟล์ที่แนบ
    const files = await LessonPlanFile.findByLessonPlanId(id);

    res.json({
      success: true,
      data: {
        ...lessonPlan,
        files
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson plan',
      error: error.message
    });
  }
};

// อัปเดตแผนการสอน
const updateLessonPlan = async (req, res) => {
  try {
    
    const { id } = req.params;
    const studentId = req.user.id;
    const updateData = req.body;

    // ตรวจสอบว่าแผนการสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await LessonPlan.isOwnedByStudent(id, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ตรวจสอบว่าวิชามีอยู่จริง (ถ้ามีการอัปเดต subject_id)
    if (updateData.subject_id) {
      const subject = await Subject.findById(updateData.subject_id);
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Subject not found'
        });
      }
    }

    const updatedLessonPlan = await LessonPlan.update(id, updateData);

    res.json({
      success: true,
      message: 'Lesson plan updated successfully',
      data: updatedLessonPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson plan',
      error: error.message
    });
  }
};

// ลบแผนการสอน
const deleteLessonPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // ตรวจสอบว่าแผนการสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await LessonPlan.isOwnedByStudent(id, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const deleted = await LessonPlan.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Lesson plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Lesson plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson plan',
      error: error.message
    });
  }
};

// อัปโหลดไฟล์สำหรับแผนการสอน
const uploadFiles = async (req, res) => {
  try {
    const { lessonPlanId } = req.params;
    const studentId = req.user.id;

    // ตรวจสอบว่าแผนการสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await LessonPlan.isOwnedByStudent(lessonPlanId, studentId);
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
      // แปลงชื่อไฟล์จาก latin1 เป็น utf8 เพื่อรักษาภาษาไทย
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      const fileData = {
        lesson_plan_id: lessonPlanId,
        file_name: originalName,
        file_path: file.path,
        file_size: file.size,
        file_type: path.extname(originalName),
        mime_type: file.mimetype,
        file_category: getFileCategory(file.mimetype)
      };
      const savedFile = await LessonPlanFile.create(fileData);
      uploadedFiles.push(savedFile);
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadedFiles
    });
  } catch (error) {
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
    const { lessonPlanId, fileId } = req.params;
    const studentId = req.user.id;

    // ตรวจสอบว่าแผนการสอนเป็นของนักศึกษาหรือไม่
    const isOwned = await LessonPlan.isOwnedByStudent(lessonPlanId, studentId);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // ตรวจสอบว่าไฟล์เป็นของแผนการสอนหรือไม่
    const fileOwned = await LessonPlanFile.isOwnedByLessonPlan(fileId, lessonPlanId);
    if (!fileOwned) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // ดึงข้อมูลไฟล์ก่อนลบ
    const file = await LessonPlanFile.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // ลบไฟล์จากฐานข้อมูล
    const deleted = await LessonPlanFile.delete(fileId);
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
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

// ดึงวิชาที่ user สร้างขึ้นเอง
const getSubjects = async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.query;
    const userId = req.user.id; // ดึง user ID จาก token

    const options = {
      search,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const subjects = await Subject.findByUser(userId, options);

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

// สร้างวิชาใหม่
const createSubject = async (req, res) => {
  try {
    
    const { subject_code, subject_name, description } = req.body;
    const createdBy = req.user.id; // ใช้ ID ของผู้ใช้ที่สร้าง


    // ตรวจสอบว่าชื่อวิชาซ้ำหรือไม่
    const existingSubject = await Subject.findByName(subject_name);
    
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject name already exists'
      });
    }

    const subjectData = {
      subject_code,
      subject_name,
      description: description || null,
      created_by: createdBy
    };

    const newSubject = await Subject.create(subjectData);

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: newSubject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error.message
    });
  }
};

// ฟังก์ชันช่วยสำหรับกำหนดหมวดหมู่ไฟล์
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'media';
  if (mimeType.startsWith('video/')) return 'media';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) return 'document';
  return 'other';
};

module.exports = {
  createLessonPlan,
  getMyLessonPlans,
  getLessonPlanById,
  updateLessonPlan,
  deleteLessonPlan,
  uploadFiles,
  deleteFile,
  getSubjects,
  createSubject,
  upload
};
