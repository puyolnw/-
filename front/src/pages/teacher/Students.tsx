import React, { useState, useEffect } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import { teacherApiService, type Student } from '../../services/teacherApi';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Frontend - Fetching students...');
      const response = await teacherApiService.getMyStudents();
      console.log('🔵 Frontend - Students response:', response);
      
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้');
      }
    } catch (error) {
      console.error('🔵 Frontend - Error fetching students:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-blue-600';
    if (progress >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <LoggedLayout currentPage="จัดการนักศึกษา">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LoggedLayout>
    );
  }

  if (error) {
    return (
      <LoggedLayout currentPage="จัดการนักศึกษา">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout currentPage="จัดการนักศึกษา">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">จัดการนักศึกษา</h1>
            <p className="mt-2 text-gray-600">รายชื่อนักศึกษาที่คุณดูแล</p>
          </div>

          {/* Students List */}
          {students.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีนักศึกษา</h3>
              <p className="text-gray-500">คุณยังไม่มีนักศึกษาที่ดูแล</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-medium text-lg">
                          {student.first_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{student.user_id}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">รหัสนักศึกษา:</span>
                        <span className="font-medium">{student.student_code}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">วันที่ลงทะเบียน:</span>
                        <span className="font-medium">{formatDate(student.enrollment_date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">สถานะ:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status === 'active' ? 'กำลังฝึกงาน' : student.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">ความคืบหน้า</span>
                        <span className="font-medium">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{student.total_teaching_sessions}</p>
                        <p className="text-xs text-gray-500">ครั้งสอน</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{student.total_teaching_hours}</p>
                        <p className="text-xs text-gray-500">ชั่วโมง</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{student.total_lesson_plans}</p>
                        <p className="text-xs text-gray-500">แผนการสอน</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        ดูรายละเอียด
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                        ส่งข้อความ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        {showDetails && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดนักศึกษา
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">รหัสนักศึกษา</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.student_code}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">วันที่ลงทะเบียน</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStudent.enrollment_date)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">สถิติการฝึกงาน</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{selectedStudent.total_teaching_sessions}</p>
                        <p className="text-sm text-gray-600">ครั้งสอน</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{selectedStudent.total_teaching_hours}</p>
                        <p className="text-sm text-gray-600">ชั่วโมง</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{selectedStudent.total_lesson_plans}</p>
                        <p className="text-sm text-gray-600">แผนการสอน</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">ความคืบหน้ารวม</span>
                      <span className="font-medium">{selectedStudent.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getProgressColor(selectedStudent.progress)}`}
                        style={{ width: `${selectedStudent.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    ปิด
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    ส่งข้อความ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoggedLayout>
  );
};

export default Students;
