import React from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';

const InternshipInfo: React.FC = () => {
  return (
    <LoggedLayout currentPage="ข้อมูลการฝึกงาน">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-prompt font-semibold text-gray-900 mb-6">
            ข้อมูลการฝึกงาน
          </h2>
          <p className="text-gray-600">หน้านี้จะแสดงข้อมูลการฝึกงานของนักศึกษา</p>
          <p className="text-sm text-gray-500 mt-2">กำลังพัฒนา...</p>
        </div>
      </div>
    </LoggedLayout>
  );
};

export default InternshipInfo;
