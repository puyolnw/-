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

  // สำหรับนักศึกษาเท่านั้น - จัดเรียงตามที่ต้องการ
  const isStudent = user.role === 'student';

  if (!isStudent) {
    // สำหรับ role อื่นๆ ให้แสดงแบบเดิม
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">รหัสผู้ใช้งาน</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.user_id}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">ประเภทผู้ใช้งาน</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{getRoleDisplayName()}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">ชื่อ</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.first_name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">นามสกุล</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.last_name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">อีเมล</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">เบอร์โทรศัพท์</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.phone || '-'}</span>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-600">ที่อยู่</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.address || '-'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">ชื่อผู้ใช้งาน</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-prompt font-semibold text-gray-900 mb-4">
              ข้อมูลบัญชี
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">วันที่สร้างบัญชี</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{formatDate(user.created_at)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">อัปเดตล่าสุด</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{formatDate(user.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // สำหรับนักศึกษา - Layout ใหม่ตามที่ต้องการ
  return (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 shadow-lg">
                <img
                  src={getProfileImageUrl()}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
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
      </div>

      {/* Section 1: ข้อมูลส่วนตัว */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-prompt font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* แถว 1: รหัสผู้ใช้งาน */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">รหัสผู้ใช้งาน</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.user_id}</span>
              </div>
            </div>

            {/* แถว 2: รหัสนักศึกษา | ชื่อ | นามสกุล */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">รหัสนักศึกษา</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.student_code || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ชื่อ</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.first_name}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">นามสกุล</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.last_name}</span>
                </div>
              </div>
            </div>

            {/* แถว 3: สาขาวิชา | คณะ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">สาขาวิชา</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.major || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">คณะ</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.faculty || '-'}</span>
                </div>
              </div>
            </div>

            {/* แถว 4: ที่อยู่ | เบอร์โทรศัพท์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ที่อยู่</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.address || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">เบอร์โทรศัพท์</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* แถว 5: อีเมล */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">อีเมล</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{user.email}</span>
              </div>
            </div>

            {/* แถว 6: ชื่อผู้ใช้งาน | รหัสผ่าน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">ชื่อผู้ใช้งาน</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.username}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">รหัสผ่าน</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">••••••••</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: บุคคลอ้างอิง */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-prompt font-semibold text-gray-900">บุคคลอ้างอิง</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* แถว 1: อาจารย์ที่ปรึกษา | เบอร์โทร */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">อาจารย์ที่ปรึกษา</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.advisor_name || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">เบอร์โทร</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.advisor_phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* แถว 2: บิดา | อาชีพ | เบอร์โทร */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">บิดา</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.father_name || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">อาชีพ</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.father_occupation || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">เบอร์โทร</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.father_phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* แถว 3: มารดา | อาชีพ | เบอร์โทร */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">มารดา</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.mother_name || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">อาชีพ</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.mother_occupation || '-'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">เบอร์โทร</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-900">{user.mother_phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: ข้อมูลบัญชี */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${getRoleTheme()}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-prompt font-semibold text-gray-900">ข้อมูลบัญชี</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">วันที่สร้างบัญชี</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{formatDate(user.created_at)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">อัปเดตล่าสุด</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
