import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfileView: React.FC = () => {
  const { user, getRoleDisplayName, getRoleTheme } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้งาน</p>
      </div>
    );
  }

  // ฟังก์ชันสำหรับ format วันที่อย่างปลอดภัย
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      const date = new Date(dateString);
      
      // ตรวจสอบว่าเป็น valid date หรือไม่
      if (isNaN(date.getTime())) {
        return 'ข้อมูลวันที่ไม่ถูกต้อง';
      }
      
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return 'ไม่สามารถแสดงวันที่ได้';
    }
  };

  // ฟังก์ชันสำหรับ URL รูปโปรไฟล์
  const getProfileImageUrl = () => {
    if (user.profile_image) {
      return `http://localhost:3000/uploads/profiles/${user.profile_image}`;
    }
    // รูป default ตาม role
    return `/images/default-${user.role}.png`;
  };

  // สร้าง profile fields แยกตาม role
  const baseFields = [
    { label: 'รหัสผู้ใช้งาน', value: user.user_id },
    { label: 'ประเภทผู้ใช้งาน', value: getRoleDisplayName() },
    { label: 'ชื่อ', value: user.first_name },
    { label: 'นามสกุล', value: user.last_name },
    { label: 'อีเมล', value: user.email },
    { label: 'เบอร์โทรศัพท์', value: user.phone || '-' },
    { label: 'ที่อยู่', value: user.address || '-' },
    { label: 'ชื่อผู้ใช้งาน', value: user.username },
  ];

  // เพิ่มฟิลด์สำหรับนักศึกษา
  const studentFields = user.role === 'student' ? [
    { label: 'รหัสนักศึกษา', value: user.student_code || '-' },
    { label: 'คณะ', value: user.faculty || '-' },
    { label: 'สาขาวิชา', value: user.major || '-' },
  ] : [];

  // ซ่อนรหัสโรงเรียนสำหรับทุก role ตามความต้องการใหม่
  const schoolField: { label: string; value: string }[] = [];

  const profileFields = [
    ...baseFields,
    ...studentFields,
    ...schoolField,
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="relative mr-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 shadow-lg">
              <img
                src={getProfileImageUrl()}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // ถ้าโหลดรูปไม่ได้ ให้แสดงตัวอักษร
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-primary-100 flex items-center justify-center">
                        <span class="text-3xl font-bold text-primary-600">
                          ${user.first_name.charAt(0)}
                        </span>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            {/* Badge สถานะออนไลน์ */}
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-prompt font-semibold text-gray-900 mb-1">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-lg text-gray-600 mb-2">{getRoleDisplayName()}</p>
            <p className="text-sm text-primary-600 font-medium">{user.user_id}</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profileFields.map((field, index) => (
            <div key={index} className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                {field.label}
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{field.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Account Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-prompt font-semibold text-gray-900 mb-4">
            ข้อมูลบัญชี
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                วันที่สร้างบัญชี
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">
                อัปเดตล่าสุด
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">
                  {formatDate(user.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
