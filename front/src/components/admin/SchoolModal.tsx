import React from 'react';

interface School {
  id: number;
  school_id: string;
  school_name: string;
  address: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface SchoolModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
}

const SchoolModal: React.FC<SchoolModalProps> = ({ school, isOpen, onClose }) => {
  if (!isOpen || !school) return null;

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
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h5a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {school.school_name}
                </h3>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                  {school.school_id}
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
                  <label className="block text-sm font-medium text-gray-500">ชื่อโรงเรียน</label>
                  <p className="mt-1 text-sm text-gray-900">{school.school_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">รหัสโรงเรียน</label>
                  <p className="mt-1 text-sm text-gray-900">{school.school_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                  <p className="mt-1 text-sm text-gray-900">{school.phone || '-'}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">ที่อยู่</label>
                <p className="mt-1 text-sm text-gray-900">{school.address}</p>
              </div>
            </div>

            {/* System Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">ข้อมูลระบบ</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">วันที่เพิ่ม</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(school.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อัพเดทล่าสุด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(school.updated_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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

            {/* Statistics (Mock) */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">สถิติ</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-sm text-blue-800">นักศึกษาฝึกงาน</p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">3</p>
                    <p className="text-sm text-green-800">ครูพี่เลี้ยง</p>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">5</p>
                    <p className="text-sm text-yellow-800">โครงการที่ผ่านมา</p>
                  </div>
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

export default SchoolModal;
