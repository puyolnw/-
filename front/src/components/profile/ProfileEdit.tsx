import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../types/user';
import { useToast } from '../../contexts/ToastContext';

interface ProfileEditProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ onSave, onCancel }) => {
  const { user, updateUser, getRoleTheme } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    school_id: user?.school_id || '',
    student_code: user?.student_code || '',
    faculty: user?.faculty || '',
    major: user?.major || '',
    advisor_name: user?.advisor_name || '',
    advisor_phone: user?.advisor_phone || '',
    father_name: user?.father_name || '',
    father_occupation: user?.father_occupation || '',
    father_phone: user?.father_phone || '',
    mother_name: user?.mother_name || '',
    mother_occupation: user?.mother_occupation || '',
    mother_phone: user?.mother_phone || '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // useEffect เพื่อ sync ข้อมูลเมื่อ user data โหลดเสร็จ
  useEffect(() => {
    if (user) {
      const newProfileData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        school_id: user.school_id || '',
        student_code: user.student_code || '',
        faculty: user.faculty || '',
        major: user.major || '',
        advisor_name: user.advisor_name || '',
        advisor_phone: user.advisor_phone || '',
        father_name: user.father_name || '',
        father_occupation: user.father_occupation || '',
        father_phone: user.father_phone || '',
        mother_name: user.mother_name || '',
        mother_occupation: user.mother_occupation || '',
        mother_phone: user.mother_phone || '',
      };
      setProfileData(newProfileData);
      
      // ตั้งค่า image preview ถ้ามี profile image
      if (user.profile_image) {
        setImagePreview(`http://localhost:3000/uploads/profiles/${user.profile_image}`);
      }
    }
  }, [user]); // dependency: user


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({
      ...profileData,
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ profile_image: 'ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPG, PNG, WEBP เท่านั้น' });
        return;
      }

      // ตรวจสอบขนาดไฟล์ (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ profile_image: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 2MB)' });
        return;
      }

      setSelectedImage(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.profile_image) {
        setErrors({
          ...errors,
          profile_image: '',
        });
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('profile_image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getCurrentProfileImageUrl = () => {
    if (imagePreview) {
      return imagePreview; // ใช้ preview ถ้ามีการเลือกรูปใหม่
    }
    if (user?.profile_image) {
      return `http://localhost:3000/uploads/profiles/${user.profile_image}`;
    }
    return null;
  };

  const validatePasswordForm = () => {
    const newErrors: any = {};

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'รหัสผ่านไม่ตรงกัน';
    }

    if (passwordData.new_password.length < 6) {
      newErrors.new_password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!passwordData.current_password) {
      newErrors.current_password = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    }

    return newErrors;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // สร้าง FormData สำหรับส่งข้อมูลและรูป
      const formData = new FormData();
      
      // เพิ่มข้อมูลโปรไฟล์
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      // เพิ่มรูปถ้ามีการเลือก
      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      const result = await apiService.updateProfile(formData);
      
      if (result.success && result.data) {
        updateUser(result.data.user);
        showToast('🎉 อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว', 'success');
        setSuccessMessage('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
        setSelectedImage(null);
        // ไม่ clear imagePreview เพื่อให้ยังเห็นรูปที่อัพเดทแล้ว
        if (onSave) onSave();
      } else {
        if (result.errors) {
          const fieldErrors: any = {};
          result.errors.forEach((error: any) => {
            fieldErrors[error.path] = error.msg;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: result.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
        }
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      showToast('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      setErrors({ 
        general: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validatePasswordForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await apiService.changePassword(passwordData);
      
      if (response.success) {
        showToast('🔐 เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
        setSuccessMessage('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        showToast('❌ เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
        setErrors({ general: response.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
      }
    } catch (err: any) {
      showToast('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      setErrors({ 
        general: err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้งาน</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-prompt font-semibold text-gray-900">
          แก้ไขข้อมูลส่วนตัว
        </h2>
        <p className="text-gray-600 mt-1">จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ข้อมูลส่วนตัว
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {errors.general}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-100">
                  {getCurrentProfileImageUrl() ? (
                    <img
                      src={getCurrentProfileImageUrl()!}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-600">
                        {user?.first_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <label
                  htmlFor="profile_image"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                
                <input
                  type="file"
                  id="profile_image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {/* Remove Button */}
                {(imagePreview || user?.profile_image) && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Image Upload Instructions */}
            <div className="text-center text-sm text-gray-600 mb-6">
              <p>รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 2MB</p>
              <p>ขนาดที่แนะนำ: 400x400 พิกเซล</p>
            </div>
            
            {/* Image Error */}
            {errors.profile_image && (
              <div className="text-center">
                <p className="text-red-500 text-sm">{errors.profile_image}</p>
              </div>
            )}
            {/* สำหรับ role อื่นๆ ที่ไม่ใช่ student */}
            {user.role !== 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={profileData.first_name || ''}
                    onChange={handleProfileChange}
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
                    value={profileData.last_name || ''}
                    onChange={handleProfileChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกนามสกุล"
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email || ''}
                    onChange={handleProfileChange}
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
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone || ''}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                </div>
              </div>
            )}

            {/* ฟิลด์สำหรับนักศึกษา */}
            {user.role === 'student' && (
              <div className="space-y-6">
                {/* Section 1: ข้อมูลส่วนตัว */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">ข้อมูลส่วนตัว</h3>
                  
                  <div className="space-y-6">
                    {/* แถว 1: รหัสผู้ใช้งาน */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผู้ใช้งาน</label>
                      <div className="p-3 bg-gray-100 rounded-lg border text-gray-600">
                        {user.user_id}
                      </div>
                    </div>

                    {/* แถว 2: รหัสนักศึกษา | ชื่อ | นามสกุล */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="student_code" className="block text-sm font-medium text-gray-700 mb-2">
                          รหัสนักศึกษา {!user?.student_code && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          id="student_code"
                          name="student_code"
                          value={profileData.student_code || ''}
                          onChange={handleProfileChange}
                          required={!user?.student_code}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.student_code ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="กรอกรหัสนักศึกษา (เช่น 6401234567)"
                        />
                        {errors.student_code && <p className="text-red-500 text-sm mt-1">{errors.student_code}</p>}
                      </div>

                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                          ชื่อ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={profileData.first_name || ''}
                          onChange={handleProfileChange}
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
                          value={profileData.last_name || ''}
                          onChange={handleProfileChange}
                          required
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.last_name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="กรอกนามสกุล"
                        />
                        {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                      </div>
                    </div>

                    {/* แถว 3: สาขาวิชา | คณะ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                          สาขาวิชา {!user?.major && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          id="major"
                          name="major"
                          value={profileData.major || ''}
                          onChange={handleProfileChange}
                          required={!user?.major}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.major ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="กรอกชื่อสาขาวิชา (เช่น วิทยาการคอมพิวเตอร์)"
                        />
                        {errors.major && <p className="text-red-500 text-sm mt-1">{errors.major}</p>}
                      </div>

                      <div>
                        <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                          คณะ {!user?.faculty && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          id="faculty"
                          name="faculty"
                          value={profileData.faculty || ''}
                          onChange={handleProfileChange}
                          required={!user?.faculty}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.faculty ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="กรอกชื่อคณะ (เช่น วิทยาศาสตร์และเทคโนโลยี)"
                        />
                        {errors.faculty && <p className="text-red-500 text-sm mt-1">{errors.faculty}</p>}
                      </div>
                    </div>

                    {/* แถว 4: ที่อยู่ | เบอร์โทรศัพท์ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                        <textarea
                          id="address"
                          name="address"
                          value={profileData.address || ''}
                          onChange={handleProfileChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกที่อยู่"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={profileData.phone || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกเบอร์โทรศัพท์"
                        />
                      </div>
                    </div>

                    {/* แถว 5: อีเมล */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email || ''}
                        onChange={handleProfileChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกอีเมล"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* แถว 6: ชื่อผู้ใช้งาน | รหัสผ่าน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้งาน</label>
                        <div className="p-3 bg-gray-100 rounded-lg border text-gray-600">
                          {user.username}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                        <div className="p-3 bg-gray-100 rounded-lg border text-gray-600">
                          ••••••••
                        </div>
                        <p className="text-xs text-gray-500 mt-1">ใช้แท็บ "เปลี่ยนรหัสผ่าน" เพื่อแก้ไข</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: บุคคลอ้างอิง */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">บุคคลอ้างอิง</h3>
                  <div className="space-y-6">
                    {/* แถว 1: อาจารย์ที่ปรึกษา | เบอร์โทร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="advisor_name" className="block text-sm font-medium text-gray-700 mb-2">อาจารย์ที่ปรึกษา</label>
                        <input
                          type="text"
                          id="advisor_name"
                          name="advisor_name"
                          value={profileData.advisor_name || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกชื่ออาจารย์ที่ปรึกษา"
                        />
                      </div>
                      <div>
                        <label htmlFor="advisor_phone" className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
                        <input
                          type="tel"
                          id="advisor_phone"
                          name="advisor_phone"
                          value={profileData.advisor_phone || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกเบอร์โทร"
                        />
                      </div>
                    </div>

                    {/* แถว 2: บิดา | อาชีพ | เบอร์โทร */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="father_name" className="block text-sm font-medium text-gray-700 mb-2">บิดา</label>
                        <input
                          type="text"
                          id="father_name"
                          name="father_name"
                          value={profileData.father_name || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกชื่อบิดา"
                        />
                      </div>
                      <div>
                        <label htmlFor="father_occupation" className="block text-sm font-medium text-gray-700 mb-2">อาชีพ</label>
                        <input
                          type="text"
                          id="father_occupation"
                          name="father_occupation"
                          value={profileData.father_occupation || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกอาชีพ"
                        />
                      </div>
                      <div>
                        <label htmlFor="father_phone" className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
                        <input
                          type="tel"
                          id="father_phone"
                          name="father_phone"
                          value={profileData.father_phone || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกเบอร์โทร"
                        />
                      </div>
                    </div>

                    {/* แถว 3: มารดา | อาชีพ | เบอร์โทร */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="mother_name" className="block text-sm font-medium text-gray-700 mb-2">มารดา</label>
                        <input
                          type="text"
                          id="mother_name"
                          name="mother_name"
                          value={profileData.mother_name || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกชื่อมารดา"
                        />
                      </div>
                      <div>
                        <label htmlFor="mother_occupation" className="block text-sm font-medium text-gray-700 mb-2">อาชีพ</label>
                        <input
                          type="text"
                          id="mother_occupation"
                          name="mother_occupation"
                          value={profileData.mother_occupation || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกอาชีพ"
                        />
                      </div>
                      <div>
                        <label htmlFor="mother_phone" className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
                        <input
                          type="tel"
                          id="mother_phone"
                          name="mother_phone"
                          value={profileData.mother_phone || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="กรอกเบอร์โทร"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ที่อยู่สำหรับ role อื่นๆ */}
            {user.role !== 'student' && (
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={profileData.address || ''}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกที่อยู่"
                />
              </div>
            )}

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg transition-colors duration-200"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.current_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
              {errors.current_password && <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>}
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.new_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="กรอกรหัสผ่านใหม่"
              />
              {errors.new_password && <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>}
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
              {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg transition-colors duration-200"
              >
                {loading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

export default ProfileEdit;
