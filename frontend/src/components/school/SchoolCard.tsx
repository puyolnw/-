import React from 'react';
import type { SchoolOverview } from '../../types/school-system';

interface SchoolCardProps {
  school: SchoolOverview;
  onClick?: () => void;
  onAddStudent?: () => void;
  onAddTeacher?: () => void;
  className?: string;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, onClick, onAddStudent, onAddTeacher, className = '' }) => {
  const getStatusColor = () => {
    if (!school.is_open) return 'bg-gray-100 text-gray-800';
    if (school.current_students >= school.max_students) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (!school.is_open) return 'ปิดรับสมัคร';
    if (school.current_students >= school.max_students) return 'เต็มแล้ว';
    return 'เปิดรับสมัคร';
  };

  const completionRate = school.max_students > 0 
    ? Math.round((school.completed_students / school.max_students) * 100) 
    : 0;

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer hover:border-primary-300' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {school.school_name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              รหัส: {school.school_id}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {school.address}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Students */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {school.current_students}/{school.max_students}
            </div>
            <div className="text-sm text-blue-600">นักศึกษา</div>
            {school.available_slots > 0 && (
              <div className="text-xs text-blue-500 mt-1">
                ว่าง {school.available_slots} ที่
              </div>
            )}
          </div>

          {/* Teachers */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {school.assigned_teachers}/{school.max_teachers}
            </div>
            <div className="text-sm text-green-600">ครูพี่เลี้ยง</div>
            {school.primary_teachers > 0 && (
              <div className="text-xs text-green-500 mt-1">
                หลัก {school.primary_teachers} คน
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>ความคืบหน้า</span>
            <span>{school.current_students > 0 ? Math.round((school.current_students / school.max_students) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${school.current_students > 0 ? Math.min((school.current_students / school.max_students) * 100, 100) : 0}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-sm font-semibold text-gray-900">{school.active_students}</div>
            <div className="text-xs text-gray-600">กำลังฝึก</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-sm font-semibold text-gray-900">{school.completed_students}</div>
            <div className="text-xs text-gray-600">เสร็จแล้ว</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-sm font-semibold text-gray-900">{completionRate}%</div>
            <div className="text-xs text-gray-600">สำเร็จ</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col space-y-2">
            {/* Add Student Button */}
            {onAddStudent && school.is_open && school.current_students < school.max_students && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStudent();
                }}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มนักศึกษา
              </button>
            )}

            {/* Add Teacher Button */}
            {onAddTeacher && school.is_open && school.assigned_teachers < school.max_teachers && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTeacher();
                }}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มครูพี่เลี้ยง
              </button>
            )}

            {/* View Details Button */}
            {onClick && (
              <button
                onClick={onClick}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span>ดูรายละเอียด</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolCard;

