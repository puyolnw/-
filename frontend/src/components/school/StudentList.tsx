import React, { memo } from 'react';
import type { InternshipAssignment } from '../../types/school-system';

interface StudentListProps {
  students: InternshipAssignment[];
  loading?: boolean;
  onRemove?: (assignment: InternshipAssignment) => void;
  onUpdateStatus?: (assignment: InternshipAssignment) => void;
  onAssignTeacher?: (assignment: InternshipAssignment) => void;
}

const StudentList: React.FC<StudentListProps> = memo(({
  students,
  loading = false,
  onRemove,
}) => {
  console.log('🔵 StudentList - Component rendered', {
    studentsCount: students.length,
    students: students,
    loading,
    timestamp: new Date().toISOString()
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'กำลังฝึก';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
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

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีนักศึกษา</h3>
        <p className="mt-1 text-sm text-gray-500">ยังไม่มีนักศึกษาในโรงเรียนนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((assignment) => (
        <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Student Avatar */}
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {assignment.student_name?.charAt(0) || 'N'}
                </span>
              </div>

              {/* Student Info */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {assignment.student_name}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>รหัส: {assignment.student_code}</p>
                  <p>{assignment.faculty} - {assignment.major}</p>
                  {assignment.teacher_name && (
                    <p className="text-primary-600">ครูพี่เลี้ยง: {assignment.teacher_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                {getStatusText(assignment.status)}
              </span>

              {/* Action Buttons - Only Remove */}
              <div className="flex items-center space-x-2">
                {onRemove && (
                  <button
                    onClick={() => onRemove(assignment)}
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
          </div>

          {/* Additional Info */}
          {(assignment.start_date || assignment.end_date || assignment.notes) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                {assignment.start_date && (
                  <div>
                    <span className="font-medium">วันที่เริ่ม:</span>
                    <span className="ml-1">{new Date(assignment.start_date).toLocaleDateString('th-TH')}</span>
                  </div>
                )}
                {assignment.end_date && (
                  <div>
                    <span className="font-medium">วันที่สิ้นสุด:</span>
                    <span className="ml-1">{new Date(assignment.end_date).toLocaleDateString('th-TH')}</span>
                  </div>
                )}
                {assignment.enrollment_date && (
                  <div>
                    <span className="font-medium">วันที่สมัคร:</span>
                    <span className="ml-1">{new Date(assignment.enrollment_date).toLocaleDateString('th-TH')}</span>
                  </div>
                )}
              </div>
              {assignment.notes && (
                <div className="mt-2">
                  <span className="font-medium text-gray-700">หมายเหตุ:</span>
                  <p className="text-gray-600 mt-1">{assignment.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

StudentList.displayName = 'StudentList';

export default StudentList;

