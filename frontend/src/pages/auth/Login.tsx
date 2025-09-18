import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import AuthLayout from '../../components/layouts/AuthLayout';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect function แยกออกมา
  const redirectToUserDashboard = useCallback((userRole: string) => {
    const roleRedirects = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      supervisor: '/supervisor/dashboard',
      admin: '/admin/dashboard'
    } as const;
    
    const targetPath = roleRedirects[userRole as keyof typeof roleRedirects];
    console.log('🚀 Navigating to:', targetPath);
    
    // สำหรับ student ให้บังคับรีเฟรชเพื่อให้ sidebar แสดงถูกต้อง
    if (userRole === 'student') {
      console.log('🔄 Forcing refresh for student to fix sidebar');
      window.location.href = targetPath;
    } else {
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);

  // Redirect ถ้า user login แล้วมาเข้าหน้า login อีก (เช็คครั้งเดียวตอน mount)
  useEffect(() => {
    console.log('🔄 useEffect triggered (mount only):', { isAuthenticated, user: user?.role });
    if (isAuthenticated && user) {
      redirectToUserDashboard(user.role);
    }
  }, []); // ไม่มี dependencies - เรียกแค่ครั้งเดียว

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted:', formData);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📡 Calling API...');
      const response = await apiService.login(formData);
      console.log('📥 API Response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Login success, setting user state...');
        setSuccess('เข้าสู่ระบบสำเร็จ! กำลังพาคุณไปยังหน้าหลัก...');
        login(response.data.user, response.data.token);
        
        // รอ 1.5 วินาที แล้วค่อย redirect เพื่อให้เห็น success message
        setTimeout(() => {
          if (response.data?.user?.role) {
            redirectToUserDashboard(response.data.user.role);
          }
        }, 1500);
      } else {
        console.log('❌ Login failed:', response.message);
        setError(response.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } catch (err: any) {
      console.log('💥 API Error:', err);
      console.log('💥 Error Status:', err.response?.status);
      console.log('💥 Error Data:', err.response?.data);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">ฝ</span>
          </div>
          <h2 className="text-2xl font-prompt font-bold text-gray-900">
            เข้าสู่ระบบ
          </h2>
          <p className="text-gray-600 mt-2">
            ระบบฝึกประสบการณ์วิชาชีพ
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 fade-in-up">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 fade-in-up">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อผู้ใช้งาน
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="กรอกชื่อผู้ใช้งาน"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="กรอกรหัสผ่าน"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <div className="flex items-center justify-center">
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              )}
              <span className={`transition-all duration-200 ${loading ? 'opacity-75' : 'opacity-100'}`}>
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </span>
            </div>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        {/* ข้อมูลทดสอบ */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลทดสอบ:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>นักศึกษา:</strong> ssaa / 123456</p>
            <p><strong>ครูพี่เลี้ยง:</strong> ddd / 123456</p>
            <p><strong>อาจารย์นิเทศ:</strong> www / 123456</p>
            <p><strong>ผู้ดูแลระบบ:</strong> admin / 123456</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
