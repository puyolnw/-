const { pool } = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connection successful:', rows);
    
    // Test lesson_plans table
    const [lessonPlans] = await pool.execute('SELECT COUNT(*) as count FROM lesson_plans');
    console.log('✅ lesson_plans table accessible:', lessonPlans);
    
    // Test subjects table
    const [subjects] = await pool.execute('SELECT COUNT(*) as count FROM subjects');
    console.log('✅ subjects table accessible:', subjects);
    
    // Test users table
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ users table accessible:', users);
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();
