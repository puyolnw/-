
import React, { memo } from 'react';
import type { SchoolTeacher } from '../../types/school-system';

interface TeacherListProps {
  teachers: SchoolTeacher[];
  loading?: boolean;
  onRemove?: (teacher: SchoolTeacher) => void;
  onSetPrimary?: (teacher: SchoolTeacher) => void;
  onEdit?: (teacher: SchoolTeacher) => void;
}

const TeacherList: React.FC<TeacherListProps> = memo(({
  teachers,
  loading = false,
  onRemove,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีครูพี่เลี้ยง</h3>
        <p className="mt-1 text-sm text-gray-500">ยังไม่มีครูพี่เลี้ยงในโรงเรียนนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
        <div key={teacher.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Teacher Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                teacher.is_primary ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <span className={`font-semibold text-lg ${
                  teacher.is_primary ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {teacher.teacher_name?.charAt(0) || 'T'}
                </span>
              </div>

              {/* Teacher Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {teacher.teacher_name}
                  </h4>
                  {teacher.is_primary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      ครูหลัก
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>รหัส: {teacher.user_id}</p>
                  <p>อีเมล: {teacher.email}</p>
                  <p>โทร: {teacher.phone}</p>
                </div>
              </div>

              {/* Capacity Info */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {teacher.current_students}/{teacher.max_students}
                </div>
                <div className="text-sm text-gray-600">นักศึกษา</div>
                {teacher.current_students >= teacher.max_students && (
                  <div className="text-xs text-red-500 mt-1">เต็มแล้ว</div>
                )}
              </div>
            </div>

            {/* Action Buttons - Only Remove */}
            <div className="flex items-center space-x-2">
              {onRemove && (
                <button
                  onClick={() => onRemove(teacher)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium p-2 rounded-lg hover:bg-red-50"
                  title="ลบออก"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar for Teacher Load */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>ภาระงาน</span>
              <span>{teacher.max_students > 0 ? Math.round((teacher.current_students / teacher.max_students) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  teacher.current_students >= teacher.max_students 
                    ? 'bg-red-500' 
                    : teacher.current_students / teacher.max_students > 0.8 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${teacher.max_students > 0 ? Math.min((teacher.current_students / teacher.max_students) * 100, 100) : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

TeacherList.displayName = 'TeacherList';

export default TeacherList;

