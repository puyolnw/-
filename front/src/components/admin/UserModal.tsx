import React from 'react';
import type { User } from '../../types/user';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const roleDisplayMap = {
    student: 'นักศึกษา',
    teacher: 'ครูพี่เลี้ยง',
    supervisor: 'ผู้นิเทศ',
    admin: 'ผู้ดูแลระบบ'
  };

  const roleColorMap = {
    student: 'bg-green-100 text-green-800',
    teacher: 'bg-yellow-100 text-yellow-800',
    supervisor: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                {user.profile_image ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src={`http://localhost:3000/uploads/profiles/${user.profile_image}`}
                    alt=""
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary-600">
                      {user.first_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColorMap[user.role]}`}>
                  {roleDisplayMap[user.role]}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">ข้อมูลพื้นฐาน</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อ</label>
                  <p className="mt-1 text-sm text-gray-900">{user.first_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">นามสกุล</label>
                  <p className="mt-1 text-sm text-gray-900">{user.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อผู้ใช้</label>
                  <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">รหัสผู้ใช้</label>
                  <p className="mt-1 text-sm text-gray-900">{user.user_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อีเมล</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                  <p className="mt-1 text-sm text-gray-900">{user.phone || '-'}</p>
                </div>
              </div>
              {user.address && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">ที่อยู่</label>
                  <p className="mt-1 text-sm text-gray-900">{user.address}</p>
                </div>
              )}
            </div>

            {/* Student Information */}
            {user.role === 'student' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">ข้อมูលนักศึกษา</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">รหัสนักศึกษา</label>
                    <p className="mt-1 text-sm text-gray-900">{user.student_code || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">คณะ</label>
                    <p className="mt-1 text-sm text-gray-900">{user.faculty || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">สาขาวิชา</label>
                    <p className="mt-1 text-sm text-gray-900">{user.major || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">ข้อมูลระบบ</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">วันที่สมัคร</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อัพเดทล่าสุด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">สถานะ</label>
                  <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    ใช้งานได้
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
