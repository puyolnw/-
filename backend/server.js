const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Global rate limiting
app.use(generalLimiter);

// CORS Configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(sanitizeInput);

// Static files สำหรับรูปโปรไฟล์
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route สำหรับดูไฟล์แผนการสอน
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { pool } = require('./config/database');
    
    // ดึงข้อมูลไฟล์จาก database
    const [rows] = await pool.execute(
      'SELECT * FROM lesson_plan_files WHERE id = ?',
      [fileId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const file = rows[0];
    console.log('🔵 File serving - File data:', file);
    
    // ใช้ file_path โดยตรง (เป็น absolute path แล้ว)
    const filePath = file.file_path;
    console.log('🔵 File serving - File path:', filePath);
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.log('🔴 File serving - File not found on disk:', filePath);
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }
    
    console.log('🔵 File serving - Sending file:', file.file_name);
    // ส่งไฟล์
    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ success: false, message: 'Error serving file' });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);

// Admin Routes
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/reports', require('./routes/admin/reports'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/schools', require('./routes/admin/schools'));
app.use('/api/admin/teaching-sessions', require('./routes/adminTeachingSessions'));
app.use('/api/admin/evaluations', require('./routes/adminEvaluations'));

// New School System Routes
app.use('/api/admin/academic-years', require('./routes/admin/academicYears'));
app.use('/api/admin/school-system', require('./routes/admin/schoolSystem'));
app.use('/api/admin/assignments', require('./routes/admin/assignments'));

// Student Routes
app.use('/api/student/assignments', require('./routes/student/assignments'));
app.use('/api/student/lesson-plans', require('./routes/student/lessonPlans'));
app.use('/api/student/teaching-sessions', require('./routes/student/teachingSessions'));

// Chat Routes
app.use('/api/chat', require('./routes/chat'));

// Completion Request Routes
app.use('/api/completion-requests', require('./routes/completionRequests'));

// Dashboard Routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Teacher Routes
app.use('/api/teacher', require('./routes/teacher'));

// Supervisor Routes
app.use('/api/supervisor', require('./routes/supervisor'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // ทดสอบการเชื่อมต่อ database
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Cannot start server - Database connection failed');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
