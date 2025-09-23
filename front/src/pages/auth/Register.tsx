import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { UserRole } from '../../types/user';
import AuthLayout from '../../components/layouts/AuthLayout';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: 'student' as UserRole,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
    student_code: '', // รหัสนักศึกษา
    faculty: 'ครุศาสตร์',      // คณะ
    major: '',        // สาขา
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    // Validation สำหรับข้อมูลนักศึกษา (required เสมอ)
    if (!formData.student_code.trim()) {
      newErrors.student_code = 'กรุณากรอกรหัสนักศึกษา';
    } else if (!/^[0-9]{10}$/.test(formData.student_code.trim())) {
      newErrors.student_code = 'รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก';
    }

    if (!formData.faculty.trim()) {
      newErrors.faculty = 'กรุณากรอกชื่อคณะ';
    }

    if (!formData.major.trim()) {
      newErrors.major = 'กรุณากรอกชื่อสาขาวิชา';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setShowSuccessModal(false);

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await apiService.register(submitData);
      
      if (response.success && response.data) {
        setShowSuccessModal(true);
      } else {
        if (response.errors) {
          const fieldErrors: any = {};
          response.errors.forEach((error: any) => {
            fieldErrors[error.path] = error.msg;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: response.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const serverErrors: any = {};
        err.response.data.errors.forEach((error: any) => {
          serverErrors[error.path || error.param] = error.msg;
        });
        setErrors(serverErrors);
      } else {
        const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        setErrors({ 
          general: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  // ระบบสมัครสำหรับนักศึกษาเท่านั้น - role จะถูกตั้งค่าเป็น 'student' อัตโนมัติ

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">ฝ</span>
          </div>
          <h2 className="text-2xl font-prompt font-bold text-gray-900">
            สมัครสมาชิกนักศึกษา
          </h2>
          <p className="text-gray-600 mt-2">
            ระบบฝึกประสบการณ์วิชาชีพ - สำหรับนักศึกษา
          </p>
        </div>


        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information - แสดงตลอดเวลาเพราะเป็นการสมัครนักศึกษาเท่านั้น */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">ข้อมูลนักศึกษา</h3>
              
              {/* Student Code */}
              <div>
                <label htmlFor="student_code" className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสนักศึกษา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="student_code"
                  name="student_code"
                  value={formData.student_code}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.student_code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="กรอกรหัสนักศึกษา (เช่น 6401234567)"
                />
                {errors.student_code && <p className="text-red-500 text-sm mt-1">{errors.student_code}</p>}
              </div>

              {/* Faculty and Major */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                    คณะ <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(กำหนดไว้แล้ว)</span>
                  </label>
                  <input
                    type="text"
                    id="faculty"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    required
                    readOnly
                    className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed ${
                      errors.faculty ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="คณะครุศาสตร์"
                  />
                  {errors.faculty && <p className="text-red-500 text-sm mt-1">{errors.faculty}</p>}
                </div>

                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                    สาขาวิชา <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="major"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.major ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">เลือกสาขาวิชา</option>
                    <option value="บรรณารักษ์">บรรณารักษ์</option>
                    <option value="ภาษาอังกฤษ">ภาษาอังกฤษ</option>
                  </select>
                  {errors.major && <p className="text-red-500 text-sm mt-1">{errors.major}</p>}
                </div>
              </div>
            </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อ"
              />
              {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกนามสกุล"
              />
              {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกอีเมล"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                pattern="[0-9]*"
                inputMode="numeric"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกเบอร์โทรศัพท์ (เช่น 0812345678)"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="กรอกที่อยู่"
            />
          </div>


          {/* Account Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อผู้ใช้งาน"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกรหัสผ่าน"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ยืนยันรหัสผ่าน"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                กำลังสมัครสมาชิก...
              </div>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">สมัครสมาชิกสำเร็จ!</h3>
              <p className="text-gray-600">
                ยินดีต้อนรับเข้าสู่ระบบฝึกประสบการณ์วิชาชีพ<br />
                กรุณาเข้าสู่ระบบด้วยข้อมูลที่สมัครไว้
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Register;
