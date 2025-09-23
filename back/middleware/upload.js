const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์ uploads/profiles ถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// กำหนดการเก็บไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์: user_[user_id]_[timestamp].[ext]
    const userId = req.user?.user_id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `user_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// ตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPG, PNG, WEBP เท่านั้น'), false);
  }
};

// กำหนดขนาดไฟล์สูงสุด (2MB)
const limits = {
  fileSize: 2 * 1024 * 1024 // 2MB
};

// สร้าง multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Middleware สำหรับอัปโหลดรูปโปรไฟล์
const uploadProfileImage = upload.single('profile_image');

// Middleware wrapper สำหรับจัดการ error
const handleUploadError = (req, res, next) => {
  uploadProfileImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 2MB)'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// ฟังก์ชันสำหรับลบไฟล์เก่า
const deleteOldProfileImage = (filename) => {
  if (!filename) return;
  
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted old profile image: ${filename}`);
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
    }
  }
};

module.exports = {
  handleUploadError,
  deleteOldProfileImage,
  uploadDir
};
