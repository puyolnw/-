const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง connection pool สำหรับประสิทธิภาพที่ดีขึ้น
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'daily',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // เพิ่ม options สำหรับ compatibility
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from(process.env.DB_PASSWORD || ''),
  }
});

// ทดสอบการเชื่อมต่อ
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Create a db object that aliases pool for backward compatibility
const db = {
  query: pool.query.bind(pool)
};

module.exports = {
  pool,
  db,
  testConnection
};
